#!/usr/bin/env node

import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const DEFAULT_PORT = 4173;
const DEV_PORT = Number.parseInt(process.env.EXPERIMENT_PORT ?? "", 10) || DEFAULT_PORT;
const BASE_URL = `http://127.0.0.1:${DEV_PORT}`;
const START_URL = `${BASE_URL}/?screenshot=1`;

const VIEWPORT = { width: 1920, height: 1080 };
const SCREENSHOT_ROOT = path.resolve(projectRoot, "screenshots", "experiment-run");
const RUN_ID = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_DIR = path.join(SCREENSHOT_ROOT, `run-${RUN_ID}`);
const INDEX_TSV = path.join(OUTPUT_DIR, "index.tsv");

const SCREENSHOT_DELAY = Number.parseInt(process.env.EXPERIMENT_SCREENSHOT_DELAY ?? "120", 10);
const ACTION_DELAY = Number.parseInt(process.env.EXPERIMENT_ACTION_DELAY ?? "80", 10);
const NAVIGATION_DELAY = Number.parseInt(process.env.EXPERIMENT_NAV_DELAY ?? "300", 10);

const animationBlockerCSS = `
*, *::before, *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
  scroll-behavior: auto !important;
}
`;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseArguments(argv) {
  let articleLimit = null;
  let onlyTsv = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (["--articles", "--limit", "-n"].includes(arg)) {
      const next = Number.parseInt(argv[index + 1], 10);
      if (!Number.isNaN(next) && next > 0) {
        articleLimit = next;
      }
      index += 1;
    } else if (arg === "--only-tsv") {
      onlyTsv = true;
    }
  }

  return { articleLimit, onlyTsv };
}

const { articleLimit: cliArticleLimit, onlyTsv } = parseArguments(process.argv.slice(2));
const envArticleLimit = Number.parseInt(process.env.EXPERIMENT_ARTICLE_LIMIT ?? "", 10);
const ARTICLE_LIMIT =
  Number.isFinite(cliArticleLimit) && cliArticleLimit > 0
    ? cliArticleLimit
    : Number.isFinite(envArticleLimit) && envArticleLimit > 0
      ? envArticleLimit
      : null;
const ONLY_TSV = onlyTsv;

async function ensureOutputDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

async function ensureArticleDirs(articleId) {
  const articleDir = path.join(OUTPUT_DIR, `article-${articleId}`);
  const imageDir = path.join(articleDir, "images");
  const metaDir = path.join(articleDir, "meta");
  await fs.mkdir(imageDir, { recursive: true });
  await fs.mkdir(metaDir, { recursive: true });
  return { articleDir, imageDir, metaDir };
}

async function startDevServer() {
  return new Promise((resolve, reject) => {
    const devProcess = spawn(
      "npm",
      ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(DEV_PORT)],
      {
        cwd: projectRoot,
        env: {
          ...process.env,
          BROWSER: "none",
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    let resolved = false;

    const handleOutput = (data) => {
      const text = data.toString();
      process.stdout.write(`[dev] ${text}`);
      if (!resolved && (text.includes(`127.0.0.1:${DEV_PORT}`) || text.toLowerCase().includes("ready in"))) {
        resolved = true;
        resolve(devProcess);
      }
    };

    devProcess.stdout?.on("data", handleOutput);
    devProcess.stderr?.on("data", handleOutput);

    devProcess.on("exit", (code) => {
      if (!resolved) {
        reject(new Error(`Vite dev server exited prematurely with code ${code ?? "unknown"}`));
      }
    });

    devProcess.on("error", (error) => {
      if (!resolved) {
        reject(error);
      }
    });
  });
}

async function stopDevServer(devProcess) {
  if (!devProcess || devProcess.killed) {
    return;
  }

  await new Promise((resolve) => {
    devProcess.on("close", resolve);
    devProcess.kill();
  });
}

async function disableAnimations(page) {
  try {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  } catch (error) {
    console.warn("Could not emulate reduced motion preference:", error);
  }

  const injectStyles = async () => {
    try {
      await page.addStyleTag({ content: animationBlockerCSS });
    } catch (error) {
      console.warn("Could not inject animation override styles:", error);
    }
  };

  page.on("domcontentloaded", () => {
    void injectStyles();
  });

  await injectStyles();
}

async function startExperiment(page) {
  await page.goto(START_URL, { waitUntil: "networkidle0" });
  await page.waitForSelector("button", { timeout: 10_000 });

  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const experimentButton = buttons.find((button) =>
      button.textContent?.toLowerCase().includes("experiment")
    );
    experimentButton?.scrollIntoView({ block: "center" });
    experimentButton?.click();
    return Boolean(experimentButton);
  });

  if (!clicked) {
    throw new Error("Could not find the Experiment start button on the homepage.");
  }

  await page.waitForSelector("article[data-card-variant='minimal']", { timeout: 10_000 });
  await delay(NAVIGATION_DELAY);
}

async function findNextArticleCard(page, processedArticleIds) {
  const targetId = await page.evaluate(
    (alreadyProcessed) => {
      const cards = Array.from(
        document.querySelectorAll("article[data-card-variant='minimal'][data-card-interactive='true']")
      );

      const nextCard = cards.find((card) => {
        const id = card.getAttribute("data-article-id");
        return id && !alreadyProcessed.includes(id);
      });

      return nextCard?.getAttribute("data-article-id") ?? null;
    },
    Array.from(processedArticleIds)
  );

  if (!targetId) {
    return null;
  }

  const handle = await page.$(`article[data-article-id='${targetId}']`);
  if (!handle) {
    return null;
  }

  return { id: targetId, handle };
}

async function scrollArticleIntoView(page, handle) {
  await page.evaluate((element) => {
    element?.scrollIntoView({ block: "center", behavior: "auto" });
  }, handle);
  await delay(200);
}

async function waitForArticleNavigation(page) {
  await page.waitForFunction(() => window.location.pathname.includes("/article/"), { timeout: 10_000 });
  await page.waitForSelector("main", { timeout: 10_000 });
  await delay(NAVIGATION_DELAY);
}

function normalizeArticleId(rawId) {
  const match = String(rawId ?? "").match(/\d+/);
  return match ? match[0] : String(rawId ?? "");
}

async function extractSlideInfo(page) {
  return page.evaluate(() => {
    const currentPageEl = document.querySelector("span[aria-current='page']");
    const paginationContainer = currentPageEl?.parentElement ?? null;
    const paginationItems = paginationContainer
      ? Array.from(paginationContainer.querySelectorAll("span"))
      : [];
    const currentPage = currentPageEl
      ? Number.parseInt(currentPageEl.textContent ?? "", 10)
      : null;
    const totalPages = paginationItems.length > 0 ? paginationItems.length : null;

    const questionRoot = document.querySelector("[data-question-index][data-question-active='true']");

    const sliderRoot = document.querySelector("[data-question-kind]");
    const sliderKind = sliderRoot?.getAttribute("data-question-kind") ?? null;
    const sliderQuestionNumber = sliderRoot
      ? Number.parseInt(sliderRoot.getAttribute("data-question-number") ?? "0", 10)
      : null;
    const sliderOptionCount = sliderRoot
      ? Number.parseInt(sliderRoot.getAttribute("data-option-count") ?? "0", 10)
      : null;

    const answers = questionRoot
      ? Array.from(questionRoot.querySelectorAll("[data-answer-index]"))
          .map((button) => ({
            index: Number.parseInt(button.getAttribute("data-answer-index") ?? "-1", 10),
            text: button.textContent?.trim() ?? "",
          }))
          .filter((answer) => Number.isFinite(answer.index) && answer.index >= 0)
      : [];

    let signature = "unknown";
    if (questionRoot) {
      const qIndex = Number.parseInt(questionRoot.getAttribute("data-question-index") ?? "-1", 10);
      signature = `question:${qIndex}`;
    } else if (sliderRoot) {
      signature = `slider:${sliderKind ?? "unknown"}`;
    } else if (Number.isFinite(currentPage)) {
      signature = `page:${currentPage}`;
    }

    return {
      currentPage,
      totalPages,
      isQuestion: Boolean(questionRoot),
      questionIndex: questionRoot
        ? Number.parseInt(questionRoot.getAttribute("data-question-index") ?? "-1", 10)
        : null,
      answers,
      isSlider: Boolean(sliderRoot),
      sliderKind,
      sliderQuestionNumber,
      sliderOptionCount,
      signature,
    };
  });
}

async function waitForSlideChange(page, previousSignature) {
  await page
    .waitForFunction(
      (prev) => {
        const currentPageEl = document.querySelector("span[aria-current='page']");
        const questionRoot = document.querySelector("[data-question-index][data-question-active='true']");
        const sliderRoot = document.querySelector("[data-question-kind]");

        let signature = "unknown";
        if (questionRoot) {
          const qIndex = Number.parseInt(questionRoot.getAttribute("data-question-index") ?? "-1", 10);
          signature = `question:${qIndex}`;
        } else if (sliderRoot) {
          const sliderKind = sliderRoot.getAttribute("data-question-kind") ?? "unknown";
          signature = `slider:${sliderKind}`;
        } else if (currentPageEl) {
          signature = `page:${currentPageEl.textContent ?? ""}`;
        }

        return signature !== prev;
      },
      { timeout: 10_000 },
      previousSignature
    )
    .catch(() => {});
}

async function waitForHome(page) {
  await page.waitForFunction(() => window.location.pathname === "/" || !window.location.pathname.includes("/article/"), { timeout: 10_000 });
  await delay(NAVIGATION_DELAY);

  // Try to wait for articles to load, but don't fail if they don't (e.g., at end of list)
  await page.waitForSelector("article[data-card-variant='minimal']", { timeout: 5_000 }).catch(() => {
    console.log("Note: No more article cards found (possibly at end of list)");
  });
}

function round(value) {
  return Math.round(value * 100) / 100;
}

async function collectBoundingBoxes(page, meta) {
  return page.evaluate((metaFromNode) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const round = (value) => Math.round(value * 100) / 100;

    const isVisible = (node) => {
      if (!node || !(node instanceof Element)) return false;
      const style = window.getComputedStyle(node);
      if (style.visibility === "hidden" || style.display === "none" || parseFloat(style.opacity) === 0) {
        return false;
      }
      const rect = node.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      if (rect.bottom < 0 || rect.right < 0 || rect.top > viewportHeight || rect.left > viewportWidth) return false;
      return true;
    };

    const words = [];
    const letters = [];

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node?.textContent || !node.textContent.trim()) {
          return NodeFilter.FILTER_REJECT;
        }
        const parent = node.parentElement;
        if (!parent || !isVisible(parent)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let currentNode = walker.nextNode();
    while (currentNode) {
      const text = currentNode.textContent ?? "";
      const parent = currentNode.parentElement;
      const style = parent ? window.getComputedStyle(parent) : null;
      const baseMeta = {
        fontFamily: style?.fontFamily ?? null,
        fontSize: style?.fontSize ?? null,
        color: style?.color ?? null,
      };

      const wordRegex = /\S+/g;
      let match;
      while ((match = wordRegex.exec(text)) !== null) {
        const range = document.createRange();
        range.setStart(currentNode, match.index);
        range.setEnd(currentNode, match.index + match[0].length);
        const rect = range.getBoundingClientRect();
        range.detach?.();
        if (rect.width === 0 || rect.height === 0) continue;
        if (rect.bottom < 0 || rect.right < 0 || rect.top > viewportHeight || rect.left > viewportWidth) continue;
        words.push({
          text: match[0],
          x: round(rect.x),
          y: round(rect.y),
          width: round(rect.width),
          height: round(rect.height),
          ...baseMeta,
        });
      }

      for (let index = 0; index < text.length; index += 1) {
        const character = text[index];
        if (!character.trim()) continue;
        const range = document.createRange();
        range.setStart(currentNode, index);
        range.setEnd(currentNode, index + 1);
        const rect = range.getClientRects()[0];
        range.detach?.();
        if (!rect || rect.width === 0 || rect.height === 0) continue;
        if (rect.bottom < 0 || rect.right < 0 || rect.top > viewportHeight || rect.left > viewportWidth) continue;
        letters.push({
          char: character,
          x: round(rect.x),
          y: round(rect.y),
          width: round(rect.width),
          height: round(rect.height),
          ...baseMeta,
        });
      }

      currentNode = walker.nextNode();
    }

    return {
      meta: metaFromNode,
      viewport: { width: viewportWidth, height: viewportHeight },
      words,
      letters,
    };
  }, meta);
}

async function captureScreenshot(page, articleId, baseName, meta = {}) {
  if (ONLY_TSV) {
    return;
  }

  const { imageDir, metaDir } = await ensureArticleDirs(articleId);
  const pngPath = path.join(imageDir, `${baseName}.png`);
  const metaPath = path.join(metaDir, `${baseName}.json`);

  await delay(SCREENSHOT_DELAY);
  await page.screenshot({ path: pngPath, fullPage: false });
  const boundingBoxes = await collectBoundingBoxes(page, meta);
  await fs.writeFile(metaPath, JSON.stringify(boundingBoxes, null, 2), "utf8");

  console.log(`Saved screenshot: ${path.relative(projectRoot, pngPath)}`);
  console.log(`Saved boxes:      ${path.relative(projectRoot, metaPath)}`);

  void meta;
}

async function captureQuestionSlide(page, articleId, slideInfo) {
  const questionIndex = slideInfo.questionIndex ?? -1;
  if (questionIndex !== 0) {
    return;
  }

  const normalizedId = normalizeArticleId(articleId);
  const unselectedFilename = `${normalizedId}_q_empty`;
  await captureScreenshot(page, articleId, unselectedFilename, {
    articleId,
    questionNumber: questionIndex + 1,
    optionLabel: "unselected",
    url: await page.url(),
  });

  for (const answer of slideInfo.answers) {
    const label = (answer.text ?? "").toLowerCase();
    const optionLabel = label.includes("ano") ? "s" : label.includes("ne") ? "d" : null;
    if (!optionLabel) {
      continue;
    }
    const filename = `${normalizedId}_q_${optionLabel}`;
    const selector = `[data-question-index='${slideInfo.questionIndex}'][data-question-active='true'] [data-answer-index='${answer.index}']`;
    const buttonHandle = await page.$(selector);
    if (!buttonHandle) {
      console.warn(`Answer button not found for question ${questionIndex + 1}, option ${answer.index}.`);
      continue;
    }

    await buttonHandle.click();
    await delay(ACTION_DELAY);
    await captureScreenshot(page, articleId, filename, {
      articleId,
      questionNumber: questionIndex + 1,
      optionLabel,
      url: await page.url(),
    });
  }
}

async function captureSliderSlide(page, articleId, slideInfo) {
  const sliderKind = slideInfo.sliderKind ?? "";
  const optionCount = slideInfo.sliderOptionCount ?? 5;
  const optionLabels = ["s", "d", "f", "j", "k"];

  if (optionCount < 1) {
    return;
  }

  let baseName = null;
  if (sliderKind === "novelty-scale") {
    baseName = "heard";
  } else if (sliderKind === "credibility-scale") {
    baseName = "credibility";
  }

  if (!baseName) {
    return;
  }

  await captureScreenshot(page, articleId, `${baseName}_empty`, {
    articleId,
    questionNumber: slideInfo.sliderQuestionNumber ?? null,
    optionLabel: "unselected",
    url: await page.url(),
  });

  const maxOption = Math.min(optionCount, optionLabels.length);
  for (let option = 1; option <= maxOption; option += 1) {
    await page.keyboard.press(String(option));
    await delay(ACTION_DELAY);
    await captureScreenshot(page, articleId, `${baseName}_${optionLabels[option - 1]}`, {
      articleId,
      questionNumber: slideInfo.sliderQuestionNumber ?? null,
      optionLabel: String(option),
      url: await page.url(),
    });
  }
}

async function captureTextSlide(page, articleId, slideInfo) {
  if (!Number.isFinite(slideInfo.currentPage)) {
    return;
  }

  const normalizedId = normalizeArticleId(articleId);
  const filename = `${normalizedId}_${slideInfo.currentPage}`;
  await captureScreenshot(page, articleId, filename, {
    articleId,
    pageLabel: String(slideInfo.currentPage),
    questionNumber: 0,
    optionLabel: "base",
    url: await page.url(),
  });
}

async function captureArticleSlides(page, articleId, articlePosition) {
  let maxPages = null;

  while (true) {
    const isOnArticle = await page
      .evaluate(() => window.location.pathname.includes("/article/"))
      .catch(() => false);

    if (!isOnArticle) {
      await waitForHome(page);
      break;
    }

    const slideInfo = await extractSlideInfo(page);

    if (slideInfo.signature === "unknown") {
      await delay(150);
      continue;
    }

    if (Number.isFinite(slideInfo.totalPages)) {
      maxPages = slideInfo.totalPages;
    }

    if (slideInfo.isQuestion) {
      await captureQuestionSlide(page, articleId, slideInfo);
    } else if (slideInfo.isSlider && articlePosition === 1) {
      await captureSliderSlide(page, articleId, slideInfo);
    } else if (!slideInfo.isSlider && !slideInfo.isQuestion) {
      await captureTextSlide(page, articleId, slideInfo);
    }

    const previousSignature = slideInfo.signature;
    await page.keyboard.press("Space");
    await delay(ACTION_DELAY);

    const navigatedHome = await page
      .waitForFunction(() => !window.location.pathname.includes("/article/"), { timeout: 3_000 })
      .then(() => true)
      .catch(() => false);

    if (navigatedHome) {
      await waitForHome(page);
      break;
    }

    await waitForSlideChange(page, previousSignature);
  }

  return Number.isFinite(maxPages) ? maxPages : 0;
}

async function captureArticle(page, articleId, articlePosition) {
  const articleSelector = `article[data-article-id='${articleId}']`;
  await page.click(articleSelector);
  await waitForArticleNavigation(page);
  const maxPages = await captureArticleSlides(page, articleId, articlePosition);
  const normalizedId = normalizeArticleId(articleId);
  const tsvLine = `${normalizedId}\t${maxPages}\n`;
  await fs.appendFile(INDEX_TSV, tsvLine, "utf8");
}

async function captureExperiment(page) {
  const processedArticleIds = new Set();
  let articlePosition = 1;

  while (ARTICLE_LIMIT === null || processedArticleIds.size < ARTICLE_LIMIT) {
    const nextArticle = await findNextArticleCard(page, processedArticleIds);

    if (!nextArticle) {
      console.log("No further interactive articles detected. Capture complete.");
      break;
    }

    await scrollArticleIntoView(page, nextArticle.handle);
    processedArticleIds.add(nextArticle.id);

    console.log(`\nProcessing article ${articlePosition}: ${nextArticle.id}`);
    await captureArticle(page, nextArticle.id, articlePosition);
    articlePosition += 1;
  }
}

async function main() {
  await ensureOutputDir();
  const devProcess = await startDevServer();

  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: VIEWPORT,
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(10_000);
    await disableAnimations(page);

    console.log(`Saving screenshots to ${path.relative(projectRoot, OUTPUT_DIR)}`);
    if (ARTICLE_LIMIT) {
      console.log(`Article limit: ${ARTICLE_LIMIT}`);
    }

    await fs.writeFile(INDEX_TSV, "article_id\tmax_pages\n", "utf8");
    console.log(`Index TSV: ${path.relative(projectRoot, INDEX_TSV)}`);

    await startExperiment(page);
    await captureExperiment(page);
  } finally {
    await browser.close();
    await stopDevServer(devProcess);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
