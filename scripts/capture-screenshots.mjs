#!/usr/bin/env node

import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

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

const SCREENSHOT_DELAY = Number.parseInt(process.env.EXPERIMENT_SCREENSHOT_DELAY ?? "500", 10);
const ACTION_DELAY = Number.parseInt(process.env.EXPERIMENT_ACTION_DELAY ?? "350", 10);
const NAVIGATION_DELAY = Number.parseInt(process.env.EXPERIMENT_NAV_DELAY ?? "900", 10);

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
const pad = (value, size = 2) => String(value).padStart(size, "0");
const screenshotLog = [];

function parseArguments(argv) {
  let articleLimit = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (["--articles", "--limit", "-n"].includes(arg)) {
      const next = Number.parseInt(argv[index + 1], 10);
      if (!Number.isNaN(next) && next > 0) {
        articleLimit = next;
      }
      index += 1;
    }
  }

  return { articleLimit };
}

const { articleLimit: cliArticleLimit } = parseArguments(process.argv.slice(2));
const envArticleLimit = Number.parseInt(process.env.EXPERIMENT_ARTICLE_LIMIT ?? "", 10);
const ARTICLE_LIMIT =
  Number.isFinite(cliArticleLimit) && cliArticleLimit > 0
    ? cliArticleLimit
    : Number.isFinite(envArticleLimit) && envArticleLimit > 0
      ? envArticleLimit
      : null;

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

function formatOptionLabel(index) {
  return String(index + 1);
}

async function extractSlideInfo(page) {
  return page.evaluate(() => {
    const slideLabel = Array.from(document.querySelectorAll("span")).find((el) =>
      /^Strana\s+\d+\s*\/\s*\d+/i.test(el.textContent ?? "")
    );

    const match = slideLabel?.textContent?.match(/Strana\s+(\d+)\s*\/\s*(\d+)/i);
    const current = match ? Number.parseInt(match[1], 10) : null;
    const total = match ? Number.parseInt(match[2], 10) : null;

    const questionRoot = document.querySelector("[data-question-index][data-question-active='true']");

    const credibilitySlide = document.querySelector("[data-question-kind='credibility-scale']");
    const credibilityQuestionNumber = credibilitySlide
      ? Number.parseInt(credibilitySlide.getAttribute("data-question-number") ?? "3", 10)
      : null;
    const credibilityOptionCount = credibilitySlide
      ? Number.parseInt(credibilitySlide.getAttribute("data-option-count") ?? "7", 10)
      : null;

    const answers = questionRoot
      ? Array.from(questionRoot.querySelectorAll("[data-answer-index]"))
          .map((button) => ({
            index: Number.parseInt(button.getAttribute("data-answer-index") ?? "-1", 10),
            text: button.textContent?.trim() ?? "",
          }))
          .filter((answer) => Number.isFinite(answer.index) && answer.index >= 0)
      : [];

    return {
      currentSlide: current,
      totalSlides: total,
      isQuestion: Boolean(questionRoot),
      questionIndex: questionRoot
        ? Number.parseInt(questionRoot.getAttribute("data-question-index") ?? "-1", 10)
        : null,
      answers,
      isCredibilityScale: Boolean(credibilitySlide),
      sliderQuestionNumber: credibilityQuestionNumber,
      sliderOptionCount: credibilityOptionCount,
    };
  });
}

async function waitForSlideChange(page, previousSlideNumber) {
  await page
    .waitForFunction(
      (prev) => {
        const label = Array.from(document.querySelectorAll("span")).find((el) =>
          /^Strana\s+\d+\s*\/\s*\d+/i.test(el.textContent ?? "")
        );
        const match = label?.textContent?.match(/Strana\s+(\d+)\s*\/\s*(\d+)/i);
        if (!match) return false;
        const current = Number.parseInt(match[1], 10);
        return current !== prev;
      },
      { timeout: 10_000 },
      previousSlideNumber
    )
    .catch(() => {});
}

async function waitForHome(page) {
  await page.waitForSelector("article[data-card-variant='minimal']", { timeout: 10_000 });
  await delay(NAVIGATION_DELAY);
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
  const { imageDir, metaDir } = await ensureArticleDirs(articleId);
  const pngPath = path.join(imageDir, `${baseName}.png`);
  const metaPath = path.join(metaDir, `${baseName}.json`);

  await delay(SCREENSHOT_DELAY);
  await page.screenshot({ path: pngPath, fullPage: false });
  const boundingBoxes = await collectBoundingBoxes(page, meta);
  await fs.writeFile(metaPath, JSON.stringify(boundingBoxes, null, 2), "utf8");

  console.log(`Saved screenshot: ${path.relative(projectRoot, pngPath)}`);
  console.log(`Saved boxes:      ${path.relative(projectRoot, metaPath)}`);

  const articleLabel = `article-${articleId}`;
  const parsedPage = Number.parseInt(meta.pageLabel ?? "", 10);
  const pageField = Number.isFinite(parsedPage) ? String(parsedPage) : "";
  const relativeFile = path.join(articleLabel, "images", `${baseName}.png`);
  const questionValue =
    meta.questionNumber && meta.questionNumber > 0
      ? meta.optionLabel === "unselected"
        ? "0"
        : String(meta.optionLabel)
      : "None";
  const isLastPage = Boolean(meta.isLastPage);

  screenshotLog.push({
    articleId: articleLabel,
    page: pageField,
    file: relativeFile,
    isLastPage,
    question: questionValue,
  });
}

async function captureQuestionSlide(page, articleId, slideInfo, isLastPage = false) {
  const pageLabel = slideInfo.currentSlide ? pad(slideInfo.currentSlide) : "--";
  const questionNumber = (slideInfo.questionIndex ?? 0) + 1;

  const unselectedFilename = `article-${articleId}-${pageLabel}-Q${questionNumber}(unselected)`;
  await captureScreenshot(page, articleId, unselectedFilename, {
    articleId,
    pageLabel,
    questionNumber,
    optionLabel: "unselected",
    url: await page.url(),
    isLastPage,
  });

  for (const answer of slideInfo.answers) {
    const optionLabel = formatOptionLabel(answer.index);
    const filename = `article-${articleId}-${pageLabel}-Q${questionNumber}(${optionLabel})`;
    const selector = `[data-question-index='${slideInfo.questionIndex}'][data-question-active='true'] [data-answer-index='${answer.index}']`;
    const buttonHandle = await page.$(selector);
    if (!buttonHandle) {
      console.warn(`Answer button not found for question ${questionNumber}, option ${answer.index}.`);
      continue;
    }

    await buttonHandle.click();
    await delay(ACTION_DELAY);
    await captureScreenshot(page, articleId, filename, {
      articleId,
      pageLabel,
      questionNumber,
      optionLabel,
      url: await page.url(),
      isLastPage,
    });
  }
}

async function captureSliderSlide(page, articleId, slideInfo, isLastPage = false) {
  const pageLabel = slideInfo.currentSlide ? pad(slideInfo.currentSlide) : "--";
  const questionNumber = slideInfo.sliderQuestionNumber ?? 3;
  const optionCount = slideInfo.sliderOptionCount ?? 7;

  const unselectedFilename = `article-${articleId}-${pageLabel}-Q${questionNumber}(unselected)`;
  await captureScreenshot(page, articleId, unselectedFilename, {
    articleId,
    pageLabel,
    questionNumber,
    optionLabel: "unselected",
    url: await page.url(),
    isLastPage,
  });

  for (let option = 1; option <= optionCount; option += 1) {
    await page.keyboard.press(String(option));
    await delay(ACTION_DELAY);
    const filename = `article-${articleId}-${pageLabel}-Q${questionNumber}(${option})`;
    await captureScreenshot(page, articleId, filename, {
      articleId,
      pageLabel,
      questionNumber,
      optionLabel: String(option),
      url: await page.url(),
      isLastPage,
    });
  }
}

async function captureNonQuestionSlide(page, articleId, slideInfo, isLastPage = false) {
  const pageLabel = slideInfo.currentSlide ? pad(slideInfo.currentSlide) : "--";
  const filename = `article-${articleId}-${pageLabel}-Q0(base)`;
  await captureScreenshot(page, articleId, filename, {
    articleId,
    pageLabel,
    questionNumber: 0,
    optionLabel: "base",
    url: await page.url(),
    isLastPage,
  });
}

async function captureArticleSlides(page, articleId) {
  while (true) {
    const slideInfo = await extractSlideInfo(page);

    if (!slideInfo.currentSlide || !slideInfo.totalSlides) {
      await delay(150);
      continue;
    }

    const isLastSlide = slideInfo.currentSlide >= slideInfo.totalSlides;

    if (slideInfo.isQuestion) {
      await captureQuestionSlide(page, articleId, slideInfo, isLastSlide);
    } else if (slideInfo.isCredibilityScale) {
      await captureSliderSlide(page, articleId, slideInfo, isLastSlide);
    } else {
      await captureNonQuestionSlide(page, articleId, slideInfo, isLastSlide);
    }

    if (isLastSlide) {
      await page.keyboard.press("ArrowRight");
      await waitForHome(page);
      break;
    }

    await page.keyboard.press("ArrowRight");
    await waitForSlideChange(page, slideInfo.currentSlide);
    await delay(ACTION_DELAY);
  }
}

async function captureArticle(page, articleId, articlePosition) {
  const homeFilename = `article-${articleId}-00-Q0(home)`;
  await captureScreenshot(page, articleId, homeFilename, {
    articleId,
    pageLabel: "00",
    questionNumber: 0,
    optionLabel: "home",
    url: await page.url(),
    articlePosition,
    isLastPage: false,
  });

  const articleSelector = `article[data-article-id='${articleId}']`;
  await page.click(articleSelector);
  await waitForArticleNavigation(page);
  await captureArticleSlides(page, articleId);
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

    await startExperiment(page);
    await captureExperiment(page);
    const tsvLines = [
      ["article_id", "page", "file", "is_last_page", "question"].join("\t"),
      ...screenshotLog.map((entry) =>
        [
          entry.articleId,
          entry.page,
          entry.file,
          entry.isLastPage ? "true" : "false",
          entry.question,
        ].join("\t")
      ),
    ];
    await fs.writeFile(INDEX_TSV, tsvLines.join("\n"), "utf8");
    console.log(`Index TSV written: ${path.relative(projectRoot, INDEX_TSV)}`);
  } finally {
    await browser.close();
    await stopDevServer(devProcess);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
