#!/usr/bin/env node
// Export an annotations SQLite backup (.tar.gz or .db) to two JSON files,
// split by data type: ratings (one row per annotation) and spans (one row
// per span, flattened with its parent annotation context).
//
// Usage:
//   node scripts/export-backup-json.mjs <backup.tar.gz|annotations.db> [ratings.json] [spans.json]
//
// Examples:
//   node scripts/export-backup-json.mjs backups/annotations-20260624-030001.tar.gz
//     -> backups/annotations-20260624-030001-ratings.json
//     -> backups/annotations-20260624-030001-spans.json
//
// Output paths default to the input name with -ratings.json / -spans.json
// suffixes. The spans_json / types_json columns are parsed back into real
// arrays so the result is structured JSON, not strings-in-strings.

import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function die(msg) {
  console.error(msg);
  process.exit(1);
}

const input = process.argv[2];
if (!input) {
  die(
    "Usage: node scripts/export-backup-json.mjs <backup.tar.gz|annotations.db> [out.json]"
  );
}
if (!fs.existsSync(input)) die(`Input not found: ${input}`);

// Resolve the SQLite DB path, extracting the tarball to a temp dir if needed.
let dbPath;
let tmpDir = null;
if (input.endsWith(".db")) {
  dbPath = input;
} else if (input.endsWith(".tar.gz") || input.endsWith(".tgz")) {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "annexport-"));
  execFileSync("tar", ["xzf", path.resolve(input), "-C", tmpDir]);
  const found = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".db")) found.push(p);
    }
  };
  walk(tmpDir);
  if (!found.length) die("No .db file inside the archive.");
  dbPath = found[0];
} else {
  die("Input must be a .tar.gz, .tgz, or .db file.");
}

const parseJson = (s, fallback) => {
  if (s == null) return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return s; // keep raw if not valid JSON
  }
};

const db = new Database(dbPath, { readonly: true });

const tableExists = (name) =>
  db
    .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?")
    .get(name) != null;

const annotations = tableExists("annotations")
  ? db
      .prepare("SELECT * FROM annotations ORDER BY id")
      .all()
      .map((r) => ({
        ...r,
        spans: parseJson(r.spans_json, []),
        types: parseJson(r.types_json, []),
      }))
  : [];

const articles = tableExists("articles")
  ? db.prepare("SELECT * FROM articles ORDER BY article_id").all()
  : [];

db.close();
if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });

const exportedAt = new Date().toISOString();

// Ratings: one row per annotation, scalar fields only (no spans/types).
const ratings = annotations.map((r) => ({
  id: r.id,
  annotator_id: r.annotator_id,
  article_id: r.article_id,
  credibility: r.credibility,
  manipulativeness: r.manipulativeness,
  heard: r.heard,
  status: r.status,
  submitted_at: r.submitted_at,
}));

// Spans: one row per span, flattened with its parent annotation context.
const spans = [];
for (const r of annotations) {
  const list = Array.isArray(r.spans) ? r.spans : [];
  for (const s of list) {
    spans.push({
      annotation_id: r.id,
      annotator_id: r.annotator_id,
      article_id: r.article_id,
      ...s,
    });
  }
}

// Pick only the articles referenced by a given set of rows, keyed by id so
// each file is self-contained: referenced articles first, then the data.
const articlesById = new Map(articles.map((a) => [a.article_id, a]));
const referencedArticles = (rows) => {
  const ids = [...new Set(rows.map((r) => r.article_id))];
  return ids
    .map((id) => articlesById.get(id))
    .filter(Boolean)
    .sort((a, b) => a.article_id.localeCompare(b.article_id));
};

const base = path.join(
  path.dirname(input),
  path.basename(input).replace(/\.(tar\.gz|tgz|db)$/, "")
);
const meta = { source: path.basename(input), exportedAt };

const ratingsPath = process.argv[3] || `${base}-ratings.json`;
const spansPath = process.argv[4] || `${base}-spans.json`;

const ratingsArticles = referencedArticles(ratings);
const spansArticles = referencedArticles(spans);

fs.writeFileSync(
  ratingsPath,
  JSON.stringify(
    {
      ...meta,
      count: ratings.length,
      articles: ratingsArticles,
      ratings,
    },
    null,
    2
  )
);
fs.writeFileSync(
  spansPath,
  JSON.stringify(
    { ...meta, count: spans.length, articles: spansArticles, spans },
    null,
    2
  )
);

console.log(
  `Wrote ${ratingsPath} (${ratings.length} ratings, ${ratingsArticles.length} articles)`
);
console.log(
  `Wrote ${spansPath} (${spans.length} spans, ${spansArticles.length} articles)`
);
