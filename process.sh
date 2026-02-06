RUN_ID=run-2026-02-05T07-14-33-106Z
OUT_DIR=screenshots_v3_align-left
python scripts/copy-screenshots.py --inp screenshots/experiment-run/$RUN_ID --out $OUT_DIR
bun scripts/sort-tsv-by-order.mjs --tsv screenshots/experiment-run/$RUN_ID/index.tsv --order data/deziper-rand-a.csv --out $OUT_DIR/index-rand-a.tsv
bun scripts/sort-tsv-by-order.mjs --tsv screenshots/experiment-run/$RUN_ID/index.tsv --order data/deziper-rand-b.csv --out $OUT_DIR/index-rand-b.tsv