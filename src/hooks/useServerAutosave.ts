import type { SpanAnnotation } from "@/lib/spanAnnotation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnnotateAnswers, saveDraftLocal } from "./useAnnotateDraft";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

export type AutosaveSnapshot = {
  spans: SpanAnnotation[];
  answers: AnnotateAnswers;
  types: unknown[];
};

const DEBOUNCE_MS = 600;
// retry backoff, capped at last entry
const BACKOFF_MS = [1000, 2000, 5000, 10000, 30000];

function buildPayload(
  annotator: string,
  articleId: string,
  snap: AutosaveSnapshot,
  status: "draft" | "submitted",
) {
  return {
    annotatorId: annotator,
    articleId,
    answers: { ...snap.answers, spans: snap.spans, types: snap.types },
    timestamp: new Date().toISOString(),
    status,
  };
}

async function postSnapshot(
  annotator: string,
  articleId: string,
  snap: AutosaveSnapshot,
  status: "draft" | "submitted",
): Promise<boolean> {
  const resp = await fetch(`${import.meta.env.BASE_URL}api/save-annotation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildPayload(annotator, articleId, snap, status)),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return true;
}

/**
 * Sends a full annotation snapshot to the server on every change (debounced),
 * mirrors to localStorage as an always-on fallback, and auto-retries failures
 * with backoff. Exposes a coarse save state for the UI and a `flush()` to force
 * a synchronous save (used by the navigation guard and Submit).
 */
export function useServerAutosave(
  annotator: string,
  articleId: string,
  snapshot: AutosaveSnapshot,
  hydrated: boolean,
) {
  const [status, setStatus] = useState<SaveStatus>("saved");

  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  const debounceRef = useRef<number | null>(null);
  const retryRef = useRef<number | null>(null);
  const attemptRef = useRef(0);
  const inFlightRef = useRef(false);
  const dirtyRef = useRef(false);
  const firstRunRef = useRef(true);
  // fire-and-forget save used by the debounce + retry loop
  const doSaveRef = useRef<() => void>(() => {});

  const clearTimers = useCallback(() => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (retryRef.current !== null) {
      window.clearTimeout(retryRef.current);
      retryRef.current = null;
    }
  }, []);

  useEffect(() => {
    doSaveRef.current = async () => {
      if (!annotator || !articleId) return;
      if (inFlightRef.current) {
        // a save is running; remember to re-save with the latest snapshot
        dirtyRef.current = true;
        return;
      }
      if (retryRef.current !== null) {
        window.clearTimeout(retryRef.current);
        retryRef.current = null;
      }
      inFlightRef.current = true;
      setStatus("saving");
      try {
        await postSnapshot(annotator, articleId, snapshotRef.current, "draft");
        attemptRef.current = 0;
        inFlightRef.current = false;
        if (dirtyRef.current) {
          dirtyRef.current = false;
          doSaveRef.current();
        } else {
          setStatus("saved");
        }
      } catch (err) {
        console.error("Autosave failed:", err);
        inFlightRef.current = false;
        setStatus("error");
        const delay = BACKOFF_MS[Math.min(attemptRef.current, BACKOFF_MS.length - 1)];
        attemptRef.current += 1;
        retryRef.current = window.setTimeout(() => doSaveRef.current(), delay);
      }
    };
  }, [annotator, articleId]);

  // reset state when switching article/annotator
  useEffect(() => {
    firstRunRef.current = true;
    attemptRef.current = 0;
    dirtyRef.current = false;
    inFlightRef.current = false;
    clearTimers();
    setStatus("saved");
  }, [annotator, articleId, clearTimers]);

  // on every snapshot change: mirror locally, mark unsaved, debounce a save
  useEffect(() => {
    if (!hydrated || !annotator || !articleId) return;
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    saveDraftLocal(annotator, articleId, {
      spans: snapshot.spans,
      answers: snapshot.answers,
    });
    setStatus("unsaved");
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(
      () => doSaveRef.current(),
      DEBOUNCE_MS,
    );
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    };
  }, [annotator, articleId, hydrated, snapshot]);

  // unmount cleanup
  useEffect(() => () => clearTimers(), [clearTimers]);

  /** Cancel pending timers and save immediately. Returns true on success. */
  const flush = useCallback(async (): Promise<boolean> => {
    clearTimers();
    if (!annotator || !articleId) return true;
    setStatus("saving");
    try {
      await postSnapshot(annotator, articleId, snapshotRef.current, "draft");
      attemptRef.current = 0;
      setStatus("saved");
      return true;
    } catch (err) {
      console.error("Autosave flush failed:", err);
      setStatus("error");
      return false;
    }
  }, [annotator, articleId, clearTimers]);

  return { status, hasPending: status !== "saved", flush };
}
