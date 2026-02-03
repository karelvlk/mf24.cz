#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function parseArguments(argv) {
  const args = {
    tsv: null,
    order: null,
    out: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--tsv") {
      args.tsv = argv[i + 1];
      i++;
    } else if (arg === "--order") {
      args.order = argv[i + 1];
      i++;
    } else if (arg === "--out") {
      args.out = argv[i + 1];
      i++;
    }
  }

  return args;
}

function parseTsv(tsvText) {
  const lines = tsvText.trim().split("\n");
  if (lines.length < 1) {
    return { header: null, rows: [] };
  }

  const header = lines[0];
  const rows = lines.slice(1).map((line) => {
    const parts = line.split("\t");
    return {
      article_id: parts[0]?.trim(),
      max_pages: parts[1]?.trim(),
      raw: line,
    };
  });

  return { header, rows };
}

function parseCsv(csvText) {
  const lines = csvText.trim().split("\n");
  const rows = [];
  let inQuotes = false;
  let currentRow = [];
  let currentValue = "";

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (inQuotes) {
        if (char === '"') {
          if (line[i + 1] === '"') {
            currentValue += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          currentValue += char;
        }
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentValue.trim());
        currentValue = "";
      } else {
        currentValue += char;
      }
    }

    currentRow.push(currentValue.trim());
    currentValue = "";

    if (currentRow.some((val) => val.length > 0)) {
      rows.push(currentRow);
    }

    currentRow = [];
  }

  if (inQuotes === false && (currentValue || currentRow.length > 0)) {
    currentRow.push(currentValue.trim());
    rows.push(currentRow);
  }

  // Find the index column (column 2, 0-indexed)
  const header = rows[0];
  const indexColumnIdx = header.findIndex(
    (h) => h.toLowerCase() === "index"
  );

  if (indexColumnIdx === -1) {
    throw new Error('CSV must contain an "index" column');
  }

  const indices = rows
    .slice(1)
    .map((row) => {
      const indexValue = row[indexColumnIdx];
      return indexValue ? String(indexValue).trim() : null;
    })
    .filter((idx) => idx !== null);

  return { indices };
}

async function main() {
  const args = parseArguments(process.argv.slice(2));

  if (!args.tsv || !args.order || !args.out) {
    console.error("Usage: sort-tsv-by-order.mjs --tsv <file> --order <file> --out <file>");
    process.exitCode = 1;
    return;
  }

  try {
    const tsvPath = path.resolve(projectRoot, args.tsv);
    const orderPath = path.resolve(projectRoot, args.order);
    const outPath = path.resolve(projectRoot, args.out);

    console.log(`Reading TSV from: ${tsvPath}`);
    const tsvText = await fs.readFile(tsvPath, "utf8");
    const { header: tsvHeader, rows: tsvRows } = parseTsv(tsvText);

    console.log(`Reading order from: ${orderPath}`);
    const orderText = await fs.readFile(orderPath, "utf8");
    const { indices: orderIndices } = parseCsv(orderText);

    console.log(`\nTSV has ${tsvRows.length} articles`);
    console.log(`Order has ${orderIndices.length} entries`);

    // Create a map of article_id to row for quick lookup
    const tsvMap = new Map();
    for (const row of tsvRows) {
      tsvMap.set(row.article_id, row);
    }

    // Check if all TSV articles are in the order
    const tsvArticleIds = new Set(tsvRows.map((r) => r.article_id));
    const orderArticleIds = new Set(orderIndices);

    const missingInOrder = Array.from(tsvArticleIds).filter(
      (id) => !orderArticleIds.has(id)
    );

    if (missingInOrder.length > 0) {
      throw new Error(
        `Articles in TSV but not in order CSV index column: ${missingInOrder.join(", ")}`
      );
    }

    // Sort TSV rows according to order, skipping missing articles
    const skippedArticles = [];
    const sortedRows = [];

    for (const index of orderIndices) {
      if (tsvMap.has(index)) {
        sortedRows.push(tsvMap.get(index));
      } else {
        skippedArticles.push(index);
      }
    }

    if (skippedArticles.length > 0) {
      console.log(`\nSkipped articles (in order but not in TSV): ${skippedArticles.join(", ")}`);
    }

    // Write output
    const outputLines = [tsvHeader, ...sortedRows.map((r) => r.raw)];
    const outputText = outputLines.join("\n") + "\n";

    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, outputText, "utf8");

    console.log(`\nWrote ${sortedRows.length} articles to: ${outPath}`);
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  }
}

main();
