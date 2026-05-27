#!/usr/bin/env bash
# Daily backup of the annotations SQLite DB + quick stats.
# Produces a single .tar.gz in BACKUP_DIR per run.
#
# Cron (every day 03:00):
#   0 3 * * * /path/to/mf24.cz/scripts/backup-annotations.sh >> /var/log/mf24-backup.log 2>&1

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

DB_PATH="${DB_PATH:-$REPO_DIR/data-records/annotations.db}"
BACKUP_DIR="${BACKUP_DIR:-$REPO_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-60}"

TS="$(date +%Y%m%d-%H%M%S)"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_PATH" ]; then
  echo "[$(date -Iseconds)] DB not found: $DB_PATH" >&2
  exit 1
fi

DUMP_NAME="annotations-$TS"
STAGE="$WORK_DIR/$DUMP_NAME"
mkdir -p "$STAGE"

# Consistent snapshot using SQLite Online Backup API (safe for live DB).
sqlite3 "$DB_PATH" ".backup '$STAGE/annotations.db'"

# Plain-text SQL dump as a secondary, diff-friendly format.
sqlite3 "$DB_PATH" ".dump" > "$STAGE/annotations.sql"

# Quick stats — one shot.
sqlite3 "$DB_PATH" <<'SQL' > "$STAGE/stats.txt"
.headers on
.mode column

SELECT '=== overview ===' AS section;
SELECT
  (SELECT COUNT(*) FROM annotations) AS total_annotations,
  (SELECT COUNT(DISTINCT annotator_id) FROM annotations) AS annotators,
  (SELECT COUNT(DISTINCT article_id) FROM annotations) AS articles_annotated,
  (SELECT COUNT(*) FROM articles) AS articles_total,
  (SELECT MIN(submitted_at) FROM annotations) AS first_submission,
  (SELECT MAX(submitted_at) FROM annotations) AS last_submission;

SELECT '';
SELECT '=== articles ===' AS section;
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN dezinfo = 1 THEN 1 ELSE 0 END) AS dezinfo,
  SUM(CASE WHEN manip = 1 THEN 1 ELSE 0 END) AS manip,
  COUNT(DISTINCT theme) AS themes
FROM articles;

SELECT '';
SELECT '=== articles annotation coverage ===' AS section;
SELECT a.theme,
       COUNT(DISTINCT a.article_id) AS articles,
       COUNT(DISTINCT ann.article_id) AS annotated
FROM articles a
LEFT JOIN annotations ann ON ann.article_id = a.article_id
GROUP BY a.theme
ORDER BY articles DESC;

SELECT '';
SELECT '=== per annotator ===' AS section;
SELECT annotator_id,
       COUNT(*) AS annotations,
       COUNT(DISTINCT article_id) AS articles,
       MIN(submitted_at) AS first_at,
       MAX(submitted_at) AS last_at
FROM annotations
GROUP BY annotator_id
ORDER BY annotations DESC;

SELECT '';
SELECT '=== last 7 days ===' AS section;
SELECT substr(submitted_at, 1, 10) AS day,
       COUNT(*) AS annotations,
       COUNT(DISTINCT annotator_id) AS annotators
FROM annotations
WHERE submitted_at >= date('now', '-7 days')
GROUP BY day
ORDER BY day DESC;

SELECT '';
SELECT '=== spans summary ===' AS section;
SELECT
  COUNT(*) AS total_spans,
  AVG(span_count) AS avg_spans_per_annotation,
  MAX(span_count) AS max_spans_per_annotation
FROM (
  SELECT json_array_length(spans_json) AS span_count
  FROM annotations
);

SELECT '';
SELECT '=== spans per type ===' AS section;
SELECT json_extract(value, '$.typeId') AS type_id,
       COUNT(*) AS span_count
FROM annotations, json_each(spans_json)
GROUP BY type_id
ORDER BY span_count DESC;

SELECT '';
SELECT '=== spans per type+variant ===' AS section;
SELECT json_extract(value, '$.typeId') AS type_id,
       COALESCE(json_extract(value, '$.optionId'), '(none)') AS variant,
       COUNT(*) AS span_count
FROM annotations, json_each(spans_json)
GROUP BY type_id, variant
ORDER BY span_count DESC;

SELECT '';
SELECT '=== ratings ===' AS section;
SELECT
  AVG(credibility) AS avg_credibility,
  AVG(manipulativeness) AS avg_manipulativeness,
  SUM(CASE WHEN heard = 1 THEN 1 ELSE 0 END) AS heard_yes,
  SUM(CASE WHEN heard = 0 THEN 1 ELSE 0 END) AS heard_no
FROM annotations;
SQL

# Manifest for quick eyeballing of the archive contents.
{
  echo "Backup: $DUMP_NAME"
  echo "Source DB: $DB_PATH"
  echo "Created: $(date -Iseconds)"
  echo "Host: $(hostname)"
  echo "DB size: $(wc -c < "$STAGE/annotations.db") bytes"
} > "$STAGE/manifest.txt"

ARCHIVE="$BACKUP_DIR/$DUMP_NAME.tar.gz"
tar -czf "$ARCHIVE" -C "$WORK_DIR" "$DUMP_NAME"

echo "[$(date -Iseconds)] wrote $ARCHIVE ($(wc -c < "$ARCHIVE") bytes)"

# Prune older archives.
find "$BACKUP_DIR" -maxdepth 1 -name 'annotations-*.tar.gz' -type f \
  -mtime +"$RETENTION_DAYS" -print -delete || true
