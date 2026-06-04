import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

export type AnnotationPayload = {
  annotatorId: string;
  articleId: string;
  answers: {
    credibility?: number;
    manipulativeness?: number;
    heard?: number;
    spans?: unknown[];
    types?: unknown[];
  };
  timestamp?: string;
  status?: AnnotationStatus;
};

export type AnnotationStatus = "draft" | "submitted";

export type AnnotationRow = {
  id: number;
  annotator_id: string;
  article_id: string;
  credibility: number | null;
  manipulativeness: number | null;
  heard: number | null;
  spans_json: string;
  types_json: string;
  submitted_at: string;
  status: string;
};

let dbInstance: Database.Database | null = null;
let dbPath: string | null = null;

function getDb(rootDir: string): Database.Database {
  if (dbInstance) return dbInstance;
  const dataDir = path.resolve(rootDir, "data-records");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  dbPath = path.join(dataDir, "annotations.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS annotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      annotator_id TEXT NOT NULL,
      article_id TEXT NOT NULL,
      credibility INTEGER,
      manipulativeness INTEGER,
      heard INTEGER,
      spans_json TEXT NOT NULL,
      types_json TEXT NOT NULL,
      submitted_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_annotator ON annotations(annotator_id);
    CREATE INDEX IF NOT EXISTS idx_article ON annotations(article_id);
    CREATE INDEX IF NOT EXISTS idx_pair ON annotations(annotator_id, article_id);
    CREATE INDEX IF NOT EXISTS idx_submitted ON annotations(submitted_at);

    CREATE TABLE IF NOT EXISTS articles (
      article_id TEXT PRIMARY KEY,
      dataset TEXT NOT NULL,
      pseudotitle TEXT,
      title TEXT,
      source TEXT,
      content TEXT,
      question TEXT,
      answer TEXT,
      theme TEXT,
      manip INTEGER,
      dezinfo INTEGER,
      csv_row_index INTEGER,
      category TEXT,
      perex TEXT,
      author TEXT,
      published TEXT,
      updated_at TEXT NOT NULL
    );
    -- additive migration: ensure new columns exist on pre-existing tables
  `);
  for (const col of [
    "category TEXT",
    "perex TEXT",
    "author TEXT",
    "published TEXT",
  ]) {
    try {
      db.exec(`ALTER TABLE articles ADD COLUMN ${col}`);
    } catch {
      // already exists
    }
  }
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_articles_theme ON articles(theme);
    CREATE INDEX IF NOT EXISTS idx_articles_dezinfo ON articles(dezinfo);
  `);

  // annotations migration: add status, collapse duplicates, enforce one row per pair
  let statusJustAdded = false;
  try {
    db.exec(
      `ALTER TABLE annotations ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'`,
    );
    statusJustAdded = true;
  } catch {
    // column already exists
  }
  if (statusJustAdded) {
    // every pre-existing row was a real submission
    db.exec(`UPDATE annotations SET status = 'submitted'`);
  }
  db.exec(`
    DELETE FROM annotations
    WHERE id NOT IN (
      SELECT MAX(id) FROM annotations GROUP BY annotator_id, article_id
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pair_unique
      ON annotations(annotator_id, article_id);
  `);

  dbInstance = db;
  maybeMigrateJson(rootDir);
  try {
    syncArticlesFromCsv(rootDir);
  } catch (e) {
    console.error("[annotationsDb] Article sync failed:", e);
  }
  return db;
}

function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (c === "\r") {
      i += 1;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      field = "";
      row = [];
      i += 1;
      continue;
    }
    field += c;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const CATEGORY_MAP: Record<string, string> = {
  zdravi: "zdravi",
  priroda: "priroda",
  "domaci-politika": "ceska-politika",
  "ceska-politika": "ceska-politika",
  "svetova-politika": "zahranicni-politika",
  "zahranicni-politika": "zahranicni-politika",
};

function normalizeCategory(category: string | undefined): string {
  return CATEGORY_MAP[(category ?? "").trim().toLowerCase()] ?? "pohady";
}

function randomTimestamp(): string {
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 60);
  return `${hour}:${minute.toString().padStart(2, "0")}`;
}

const AUTHORS = ["DEZIPER", "Redakce", "Anonymní zdroj", "Externí autor"];
function pickRandomAuthor(): string {
  return AUTHORS[Math.floor(Math.random() * AUTHORS.length)];
}

function parseBoolish(v: string | undefined): number | null {
  if (v === undefined) return null;
  const s = v.trim().toLowerCase();
  if (!s) return null;
  if (["1", "true", "yes", "ano", "ja"].includes(s)) return 1;
  if (["0", "false", "no", "ne", "nein"].includes(s)) return 0;
  return null;
}

export function syncArticlesFromCsv(rootDir: string): number {
  const db = dbInstance;
  if (!db) return 0;
  const csvPath = path.resolve(rootDir, "data", "datasets", "A.csv");
  if (!fs.existsSync(csvPath)) {
    console.warn("[annotationsDb] A.csv not found, skipping article sync");
    return 0;
  }
  const text = fs.readFileSync(csvPath, "utf8");
  const table = parseCsvText(text);
  if (table.length < 2) return 0;
  // Header is on the 2nd row in this dataset (1st row is "Polozka, 1, 2 ...").
  const headerRowIdx = table[0][0]?.trim().toLowerCase() === "polozka" ? 1 : 0;
  const header = table[headerRowIdx].map((h) => h.trim());
  const col = (name: string) => header.indexOf(name);
  const idxIndex = col("index");
  const idxPseudo = col("pseudotitle");
  const idxTitle = col("title");
  const idxSource = col("source");
  const idxContent = col("content");
  const idxQuestion = col("question");
  const idxAnswer = col("answer");
  const idxTheme = col("theme");
  const idxManip = col("manip");
  const idxDezinfo = col("dezinfo");

  const now = new Date().toISOString();
  const upsert = db.prepare(`
    INSERT INTO articles
      (article_id, dataset, pseudotitle, title, source, content, question, answer,
       theme, manip, dezinfo, csv_row_index, category, perex, author, published, updated_at)
    VALUES (?, 'A', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(article_id) DO UPDATE SET
      pseudotitle = excluded.pseudotitle,
      title = excluded.title,
      source = excluded.source,
      content = excluded.content,
      question = excluded.question,
      answer = excluded.answer,
      theme = excluded.theme,
      manip = excluded.manip,
      dezinfo = excluded.dezinfo,
      csv_row_index = excluded.csv_row_index,
      category = COALESCE(articles.category, excluded.category),
      perex = COALESCE(articles.perex, excluded.perex),
      author = COALESCE(articles.author, excluded.author),
      published = COALESCE(articles.published, excluded.published),
      updated_at = excluded.updated_at
  `);

  let count = 0;
  const tx = db.transaction(() => {
    for (let r = headerRowIdx + 1; r < table.length; r += 1) {
      const row = table[r];
      if (!row || row.every((v) => !v?.trim())) continue;
      const articleId = (row[idxIndex] ?? "").trim();
      if (!articleId) continue;
      const theme = row[idxTheme];
      upsert.run(
        articleId,
        row[idxPseudo] ?? null,
        row[idxTitle] ?? null,
        row[idxSource] ?? null,
        row[idxContent] ?? null,
        row[idxQuestion] ?? null,
        row[idxAnswer] ?? null,
        theme ?? null,
        parseBoolish(row[idxManip]),
        parseBoolish(row[idxDezinfo]),
        r,
        normalizeCategory(theme),
        "Klikněte pro zobrazení článku...",
        pickRandomAuthor(),
        randomTimestamp(),
        now,
      );
      count += 1;
    }
  });
  tx();
  console.log(`[annotationsDb] Synced ${count} articles from ${csvPath}`);
  return count;
}

function maybeMigrateJson(rootDir: string) {
  if (!dbInstance) return;
  const countRow = dbInstance
    .prepare("SELECT COUNT(*) as c FROM annotations")
    .get() as { c: number };
  if (countRow.c > 0) return;
  const jsonPath = path.resolve(rootDir, "data-records", "annotations.json");
  if (!fs.existsSync(jsonPath)) return;
  let raw: string;
  try {
    raw = fs.readFileSync(jsonPath, "utf8");
  } catch (e) {
    console.error("[annotationsDb] Failed to read legacy JSON:", e);
    return;
  }
  let arr: AnnotationPayload[];
  try {
    arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return;
  } catch (e) {
    console.error("[annotationsDb] Failed to parse legacy JSON:", e);
    return;
  }
  const insert = dbInstance.prepare(`
    INSERT INTO annotations
      (annotator_id, article_id, credibility, manipulativeness, heard, spans_json, types_json, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = dbInstance.transaction((items: AnnotationPayload[]) => {
    for (const item of items) {
      if (!item.annotatorId || !item.articleId) continue;
      const answers = item.answers ?? {};
      insert.run(
        item.annotatorId,
        item.articleId,
        answers.credibility ?? null,
        answers.manipulativeness ?? null,
        answers.heard ?? null,
        JSON.stringify(answers.spans ?? []),
        JSON.stringify(answers.types ?? []),
        item.timestamp ?? new Date().toISOString(),
      );
    }
  });
  tx(arr);
  console.log(
    `[annotationsDb] Migrated ${arr.length} legacy records from ${jsonPath} → ${dbPath}`,
  );
  try {
    fs.renameSync(jsonPath, `${jsonPath}.migrated`);
  } catch {
    // ignore
  }
}

export function initDb(rootDir: string) {
  getDb(rootDir);
}

export type ArticleApi = {
  id: string;
  title: string;
  perex: string;
  content?: string;
  category: string;
  published: string;
  author: string;
  dezinformative: boolean;
  manipulative: boolean;
  question: Array<{
    question: string;
    answers: Array<{ text: string; is_correct: boolean }>;
  }>;
};

function parseBooleanField(value: string | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  const s = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "ano", "ja"].includes(s);
}

export function getArticles(rootDir: string): ArticleApi[] {
  const db = getDb(rootDir);
  const rows = db
    .prepare(
      `SELECT article_id, title, pseudotitle, perex, content, category, theme,
              published, author, manip, dezinfo, question, answer, csv_row_index
       FROM articles
       ORDER BY CAST(csv_row_index AS INTEGER) ASC`,
    )
    .all() as Array<Record<string, string | number | null>>;
  return rows.map((r) => {
    const yesIsCorrect = parseBooleanField(
      r.answer as string | null | undefined,
    );
    const questionText = (r.question as string | null) ?? "";
    return {
      id: String(r.article_id),
      title:
        (r.title as string | null)?.trim() ||
        (r.pseudotitle as string | null)?.trim() ||
        "Bez názvu",
      perex: (r.perex as string | null) ?? "Klikněte pro zobrazení článku...",
      content: (r.content as string | null) ?? "",
      category: (r.category as string | null) ?? "pohady",
      published: (r.published as string | null) ?? "",
      author: (r.author as string | null) ?? "DEZIPER",
      dezinformative: r.dezinfo === 1,
      manipulative: r.manip === 1,
      question: questionText
        ? [
            {
              question: questionText,
              answers: [
                { text: "Ano", is_correct: yesIsCorrect },
                { text: "Ne", is_correct: !yesIsCorrect },
              ],
            },
          ]
        : [],
    };
  });
}

export function upsertAnnotation(rootDir: string, payload: AnnotationPayload) {
  const db = getDb(rootDir);
  if (!payload.annotatorId || !payload.articleId) {
    throw new Error("Missing annotatorId or articleId");
  }
  const answers = payload.answers ?? {};
  const status: AnnotationStatus =
    payload.status === "submitted" ? "submitted" : "draft";
  const stmt = db.prepare(`
    INSERT INTO annotations
      (annotator_id, article_id, credibility, manipulativeness, heard, spans_json, types_json, submitted_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(annotator_id, article_id) DO UPDATE SET
      credibility = excluded.credibility,
      manipulativeness = excluded.manipulativeness,
      heard = excluded.heard,
      spans_json = excluded.spans_json,
      types_json = excluded.types_json,
      submitted_at = excluded.submitted_at,
      status = excluded.status
  `);
  const info = stmt.run(
    payload.annotatorId,
    payload.articleId,
    answers.credibility ?? null,
    answers.manipulativeness ?? null,
    answers.heard ?? null,
    JSON.stringify(answers.spans ?? []),
    JSON.stringify(answers.types ?? []),
    payload.timestamp ?? new Date().toISOString(),
    status,
  );
  return info.lastInsertRowid;
}

// Back-compat alias; all writes upsert one row per (annotator, article).
export const insertAnnotation = upsertAnnotation;

export function getLatestAnnotations(rootDir: string): AnnotationPayload[] {
  const db = getDb(rootDir);
  const rows = db
    .prepare(
      `
      SELECT a.*
      FROM annotations a
      INNER JOIN (
        SELECT annotator_id, article_id, MAX(id) as max_id
        FROM annotations
        GROUP BY annotator_id, article_id
      ) latest
      ON a.id = latest.max_id
      ORDER BY a.submitted_at DESC
    `,
    )
    .all() as AnnotationRow[];
  return rows.map(rowToPayload);
}

export function getAnnotationsByAnnotator(
  rootDir: string,
  annotatorId: string,
): AnnotationPayload[] {
  const db = getDb(rootDir);
  const rows = db
    .prepare(
      `
      SELECT a.*
      FROM annotations a
      INNER JOIN (
        SELECT annotator_id, article_id, MAX(id) as max_id
        FROM annotations
        WHERE annotator_id = ?
        GROUP BY annotator_id, article_id
      ) latest
      ON a.id = latest.max_id
      ORDER BY a.submitted_at DESC
    `,
    )
    .all(annotatorId) as AnnotationRow[];
  return rows.map(rowToPayload);
}

export function deleteAnnotationsByAnnotator(
  rootDir: string,
  annotatorId: string,
): number {
  const db = getDb(rootDir);
  const info = db
    .prepare("DELETE FROM annotations WHERE annotator_id = ?")
    .run(annotatorId);
  return Number(info.changes);
}

export function getAllAnnotations(rootDir: string): AnnotationPayload[] {
  const db = getDb(rootDir);
  const rows = db
    .prepare("SELECT * FROM annotations ORDER BY submitted_at DESC")
    .all() as AnnotationRow[];
  return rows.map(rowToPayload);
}

function rowToPayload(r: AnnotationRow): AnnotationPayload {
  let spans: unknown[] = [];
  let types: unknown[] = [];
  try {
    spans = JSON.parse(r.spans_json);
  } catch {
    // ignore
  }
  try {
    types = JSON.parse(r.types_json);
  } catch {
    // ignore
  }
  return {
    annotatorId: r.annotator_id,
    articleId: r.article_id,
    answers: {
      credibility: r.credibility ?? undefined,
      manipulativeness: r.manipulativeness ?? undefined,
      heard: r.heard ?? undefined,
      spans,
      types,
    },
    timestamp: r.submitted_at,
    status: r.status === "submitted" ? "submitted" : "draft",
  };
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportCsv(rootDir: string): string {
  const db = getDb(rootDir);
  const rows = db
    .prepare("SELECT * FROM annotations ORDER BY submitted_at DESC")
    .all() as AnnotationRow[];
  const header = [
    "id",
    "annotator_id",
    "article_id",
    "credibility",
    "manipulativeness",
    "heard",
    "span_count",
    "submitted_at",
    "spans_json",
    "types_json",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    let spanCount = 0;
    try {
      const parsed = JSON.parse(r.spans_json);
      if (Array.isArray(parsed)) spanCount = parsed.length;
    } catch {
      // ignore
    }
    lines.push(
      [
        r.id,
        csvEscape(r.annotator_id),
        csvEscape(r.article_id),
        r.credibility ?? "",
        r.manipulativeness ?? "",
        r.heard ?? "",
        spanCount,
        csvEscape(r.submitted_at),
        csvEscape(r.spans_json),
        csvEscape(r.types_json),
      ].join(","),
    );
  }
  return lines.join("\n");
}
