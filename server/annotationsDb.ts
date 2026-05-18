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
};

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
  `);
  dbInstance = db;
  maybeMigrateJson(rootDir);
  return db;
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

export function insertAnnotation(rootDir: string, payload: AnnotationPayload) {
  const db = getDb(rootDir);
  if (!payload.annotatorId || !payload.articleId) {
    throw new Error("Missing annotatorId or articleId");
  }
  const answers = payload.answers ?? {};
  const stmt = db.prepare(`
    INSERT INTO annotations
      (annotator_id, article_id, credibility, manipulativeness, heard, spans_json, types_json, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
  );
  return info.lastInsertRowid;
}

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
