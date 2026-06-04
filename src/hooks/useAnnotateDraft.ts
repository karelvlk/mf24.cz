import type { SpanAnnotation } from "@/lib/spanAnnotation";

export type AnnotateAnswers = {
  credibility?: number;
  manipulativeness?: number;
  heard?: number;
};

export type AnnotateDraft = {
  spans: SpanAnnotation[];
  answers: AnnotateAnswers;
};

const DRAFT_PREFIX = "annotate_draft_";

function draftKey(annotator: string, articleId: string) {
  return `${DRAFT_PREFIX}${annotator}_${articleId}`;
}

/** Synchronous localStorage mirror — the always-on offline fallback. */
export function saveDraftLocal(
  annotator: string,
  articleId: string,
  draft: AnnotateDraft,
) {
  if (!annotator || !articleId) return;
  try {
    localStorage.setItem(draftKey(annotator, articleId), JSON.stringify(draft));
  } catch {
    // ignore (quota / private mode)
  }
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
