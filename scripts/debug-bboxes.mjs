#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function buildOverlaySvg({ words = [], letters = [], viewport }) {
  const width = viewport?.width ?? 1920;
  const height = viewport?.height ?? 1080;

  const wordRects = words
    .map(
      (word) =>
        `<rect x="${word.x}" y="${word.y}" width="${word.width}" height="${word.height}" rx="2" ry="2" />`
    )
    .join("");

  const letterRects = letters
    .map(
      (letter) =>
        `<rect x="${letter.x}" y="${letter.y}" width="${letter.width}" height="${letter.height}" rx="1" ry="1" />`
    )
    .join("");

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <g fill="none" stroke="rgba(0, 180, 255, 0.4)" stroke-width="1">${wordRects}</g>
      <g fill="none" stroke="rgba(255, 75, 0, 0.35)" stroke-width="0.8">${letterRects}</g>
    </svg>`
  );
}

async function createDebugImage({ imagePath, metaPath, outputPath }) {
  const meta = await readJson(metaPath);
  const overlay = buildOverlaySvg(meta);

  const image = sharp(imagePath);
  const { width, height } = await image.metadata();

  await image
    .composite([{ input: overlay, top: 0, left: 0 }])
    .resize(width, height, { fit: "fill" })
    .png()
    .toFile(outputPath);

  console.log(`Debug image written: ${outputPath}`);
}

async function main() {
  const articleDir = process.argv[2];
  if (!articleDir) {
    console.error("Usage: node scripts/debug-bboxes.mjs <path-to-article-dir>");
    process.exit(1);
  }

  const metaDir = path.join(articleDir, "meta");
  const imageDir = path.join(articleDir, "images");
  const debugDir = path.join(articleDir, "debug");

  await fs.mkdir(debugDir, { recursive: true });

  const metaFiles = (await fs.readdir(metaDir)).filter((file) => file.endsWith(".json"));

  for (const metaFile of metaFiles) {
    const baseName = metaFile.replace(/\.json$/i, "");
    const metaPath = path.join(metaDir, metaFile);
    const imagePath = path.join(imageDir, `${baseName}.png`);
    const outputPath = path.join(debugDir, `${baseName}.debug.png`);

    try {
      await fs.access(imagePath);
    } catch {
      console.warn(`Skipping ${metaFile}: missing image at ${imagePath}`);
      continue;
    }

    try {
      await createDebugImage({ imagePath, metaPath, outputPath });
    } catch (error) {
      console.error(`Failed to render ${metaFile}:`, error);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
