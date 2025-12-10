import csv
import datetime
import json
import random

# ---- CONFIG ----
TXT_FILE = "texts.txt"
CSV_FILE = "annotations.csv"
OUTPUT_JSON = "articles.json"

CATEGORY_MAP = {
    "P": "priroda",
    "Z": "zdravi",
    "S": "zahranicni-politika",
    "D": "ceska-politika",
}

# DUMMY otázka – jen placeholder
DUMMY_QUESTION = [
    {
        "question": "Jak se máte?",
        "answers": [
            {"text": "Dobře", "is_correct": True},
            {"text": "Špatně", "is_correct": False},
        ],
    }
]


def random_timestamp():
    """Generate a random publication timestamp."""
    hour = random.randint(0, 23)
    minute = random.randint(0, 59)
    return f"{hour}:{minute:02d}"


# ---- LOAD FILES ----
with open(TXT_FILE, "r", encoding="utf-8") as f_txt:
    articles = [line.strip() for line in f_txt.readlines()]

with open(CSV_FILE, "r", encoding="utf-8") as f_csv:
    reader = csv.reader(f_csv)
    annotations = list(reader)

# ---- BUILD JSON ----
output = []

for i, article_text in enumerate(articles):
    row = annotations[i]  # line N ↔ row N in CSV

    article_id = row[0]
    category_code = row[1]
    manip_code = row[2]
    dezinfo_code = row[3]

    obj = {
        "id": f"article_{article_id}",
        "title": f"Článek {article_id}",
        "perex": "Klikněte pro zobrazení článku...",
        "content": article_text,
        "category": CATEGORY_MAP.get(category_code, "neznamy"),
        "published": random_timestamp(),
        "author": "DEZIPER",
        "dezinformative": dezinfo_code == "D",
        "manipulative": manip_code == "M",
        "question": DUMMY_QUESTION,
    }

    output.append(obj)

# ---- SAVE ----
with open(OUTPUT_JSON, "w", encoding="utf-8") as f_out:
    json.dump(output, f_out, ensure_ascii=False, indent=2)

print("Done! JSON was saved as", OUTPUT_JSON)
