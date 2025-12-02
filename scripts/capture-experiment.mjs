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
const SCREENSHOT_DIR = path.resolve(projectRoot, "screenshots", "experiment-flow");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const SCREENSHOT_DELAY = Number.parseInt(process.env.EXPERIMENT_SCREENSHOT_DELAY ?? "600", 10);
const ACTION_DELAY = Number.parseInt(process.env.EXPERIMENT_ACTION_DELAY ?? "400", 10);
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

async function ensureScreenshotDir() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
}

function pad(value, size = 2) {
  return String(value).padStart(size, "0");
}

function startDevServer() {
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

async function waitForSlideChange(page, previousPosition) {
  await page.waitForFunction(
    (prevPosition) => {
      const active = document.querySelector("[data-slide-active='true']");
      if (!active) {
        return true;
      }
      const currentPosition = active.getAttribute("data-slide-position");
      return currentPosition !== prevPosition;
    },
    {},
    previousPosition
  );
}

async function getActiveSlide(page) {
  return page.evaluate(() => {
    const active = document.querySelector("[data-slide-active='true']");
    if (!active) {
      return null;
    }

    const slideType = active.getAttribute("data-slide-type") ?? "";
    const slidePosition = active.getAttribute("data-slide-position") ?? "";
    const questionIndexAttr = active.getAttribute("data-question-index");
    const answerCountAttr = active.getAttribute("data-answer-count");

    return {
      slideType,
      slidePosition,
      questionIndex: questionIndexAttr ? Number.parseInt(questionIndexAttr, 10) : null,
      answerCount: answerCountAttr ? Number.parseInt(answerCountAttr, 10) : null,
    };
  });
}

async function takeScreenshot(page, filename) {
  const filePath = path.join(SCREENSHOT_DIR, filename);
  await delay(SCREENSHOT_DELAY);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`Saved screenshot: ${path.relative(projectRoot, filePath)}`);
}

async function startExperiment(page) {
  await page.waitForSelector("button span", { timeout: 10_000 });
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const trigger = buttons.find((button) =>
      button.textContent?.toLowerCase().includes("otevřít nastavení experimentu")
    );
    trigger?.click();
  });
  await page.waitForSelector("#participant-id", { timeout: 5_000 });

  await page.evaluate(() => {
    const participantInput = document.querySelector("#participant-id");
    const startInput = document.querySelector("#start-position");
    if (participantInput instanceof HTMLInputElement) {
      participantInput.value = "";
    }
    if (startInput instanceof HTMLInputElement) {
      startInput.value = "";
    }
  });

  await page.type("#participant-id", "1");
  await page.type("#start-position", "1");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const startButton = buttons.find((button) =>
      button.textContent?.toLowerCase().includes("spustit experiment")
    );
    startButton?.click();
  });
  await page.waitForSelector("#participant-id", { hidden: true, timeout: 5_000 });
  await delay(NAVIGATION_DELAY);
}

async function captureArticle(page, articleIndex, processedArticleIds) {
  const targetArticle = await page.waitForSelector(
    "article[data-card-variant='minimal'][data-card-interactive='true']",
    { timeout: 5_000 }
  ).catch(() => null);

  if (!targetArticle) {
    return false;
  }

  const articleId = await targetArticle.evaluate((element) => element.getAttribute("data-article-id") ?? "");
  if (!articleId || processedArticleIds.has(articleId)) {
    return false;
  }

  processedArticleIds.add(articleId);

  await takeScreenshot(page, `article${pad(articleIndex)}-home.png`);

  await targetArticle.click();

  await page.waitForFunction(
    () => window.location.pathname.startsWith("/article/"),
    { timeout: 5_000 }
  );
  await page.waitForSelector("[aria-label='Čtečka článku']", { timeout: 5_000 });
  await delay(NAVIGATION_DELAY);
  await page.click("[aria-label='Čtečka článku']");
  await page.waitForSelector("[data-slide-active]", { timeout: 5_000 });
  await delay(NAVIGATION_DELAY);

  let carouselIndex = 1;
  let questionIndex = 1;

  while (true) {
    const activeSlide = await getActiveSlide(page);

    if (!activeSlide) {
      const isOnHomepage = await page.evaluate(() => window.location.pathname === "/");
      if (isOnHomepage) {
        break;
      }
      await delay(ACTION_DELAY);
      continue;
    }

    const { slideType, slidePosition } = activeSlide;

    if (slideType === "page" || slideType === "rating") {
      await takeScreenshot(page, `article${pad(articleIndex)}-carousel${pad(carouselIndex)}.png`);
      carouselIndex += 1;
      await page.keyboard.press("ArrowRight");
      await waitForSlideChange(page, slidePosition);
      await delay(ACTION_DELAY);
      const isOnHomepage = await page.evaluate(() => window.location.pathname === "/");
      if (isOnHomepage) {
        break;
      }
      continue;
    }

    if (slideType === "question") {
      await takeScreenshot(page, `article${pad(articleIndex)}-question${pad(questionIndex)}-selected0.png`);

      const expectedAnswers =
        typeof activeSlide.answerCount === "number" && activeSlide.answerCount > 0
          ? activeSlide.answerCount
          : await page.$$eval(
              "[data-slide-active='true'] [data-answer-index]",
              (elements) => elements.length
            );

      for (let answerIndex = 0; answerIndex < expectedAnswers; answerIndex += 1) {
        const selector = `[data-slide-active='true'] [data-answer-index='${answerIndex}']`;
        const buttonHandle = await page.$(selector);

        if (!buttonHandle) {
          console.warn(
            `Answer button with index ${answerIndex} not found on question slide ${questionIndex}.`
          );
          continue;
        }

        await buttonHandle.click();
        await delay(ACTION_DELAY);
        await takeScreenshot(
          page,
          `article${pad(articleIndex)}-question${pad(questionIndex)}-selected${answerIndex + 1}.png`
        );
      }

      questionIndex += 1;
      await page.keyboard.press("ArrowRight");
      await waitForSlideChange(page, slidePosition);
      await delay(ACTION_DELAY);
      const isOnHomepage = await page.evaluate(() => window.location.pathname === "/");
      if (isOnHomepage) {
        break;
      }
      continue;
    }

    console.warn(`Encountered unsupported slide type "${slideType}", stopping carousel capture.`);
    break;
  }

  await page.waitForFunction(() => window.location.pathname === "/", { timeout: 10_000 }).catch(() => {});
  await delay(NAVIGATION_DELAY);
  return true;
}

async function captureExperimentFlow(page) {
  const processedArticleIds = new Set();
  let articleIndex = 1;

  while (true) {
    const success = await captureArticle(page, articleIndex, processedArticleIds);
    if (!success) {
      console.log("No further interactive articles detected. Capture complete.");
      break;
    }

    articleIndex += 1;

    const hasNext = await page
      .waitForFunction(
        (processed) => {
          const card = document.querySelector("article[data-card-variant='minimal'][data-card-interactive='true']");
          if (!card) {
            return false;
          }
          const id = card.getAttribute("data-article-id");
          return Boolean(id) && !processed.includes(id);
        },
        { timeout: 7_000 },
        Array.from(processedArticleIds)
      )
      .catch(() => false);

    if (!hasNext) {
      console.log("Experiment finished or no remaining articles for capture.");
      break;
    }
  }
}

async function main() {
  await ensureScreenshotDir();
  const devProcess = await startDevServer();

  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1440, height: 900 },
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(10_000);
    await disableAnimations(page);

    await page.goto(START_URL, { waitUntil: "networkidle0" });
    await startExperiment(page);
    await captureExperimentFlow(page);
  } finally {
    await browser.close();
    await stopDevServer(devProcess);
  }
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
