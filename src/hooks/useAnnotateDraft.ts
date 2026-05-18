import type { SpanAnnotation } from "@/lib/spanAnnotation";
import { useEffect, useRef, useState } from "react";

export type AnnotateAnswers = {
  credibility?: number;
  manipulativeness?: number;
  heard?: number;
};

export type AnnotateDraft = {
  spans: SpanAnnotation[];
  answers: AnnotateAnswers;
};

type SaveStatus = "idle" | "saving" | "saved";

const DRAFT_PREFIX = "annotate_draft_";
const SAVE_DEBOUNCE_MS = 300;

function draftKey(annotator: string, articleId: string) {
  return `${DRAFT_PREFIX}${annotator}_${articleId}`;
}

export function loadDraft(
  annotator: string,
  articleId: string,
): AnnotateDraft | null {
  if (!annotator || !articleId) return null;
  try {
    const raw = localStorage.getItem(draftKey(annotator, articleId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      spans: Array.isArray(parsed.spans) ? parsed.spans : [],
      answers: parsed.answers ?? {},
    };
  } catch {
    return null;
  }
}

export function clearDraft(annotator: string, articleId: string) {
  if (!annotator || !articleId) return;
  try {
    localStorage.removeItem(draftKey(annotator, articleId));
  } catch {
    // ignore
  }
}

export function useAnnotateDraft(
  annotator: string,
  articleId: string,
  draft: AnnotateDraft,
  hydrated: boolean,
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<number | null>(null);
  const firstRunRef = useRef(true);

  useEffect(() => {
    if (!hydrated || !annotator || !articleId) return;
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    setStatus("saving");
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey(annotator, articleId),
          JSON.stringify(draft),
        );
        setStatus("saved");
      } catch {
        setStatus("idle");
      }
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [annotator, articleId, draft, hydrated]);

  useEffect(() => {
    firstRunRef.current = true;
  }, [annotator, articleId]);

  return status;
}
