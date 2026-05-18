import { annotationArticles } from "@/data/news";
import { useCallback, useEffect, useState } from "react";

const VISITED_PREFIX = "annotate_visited_";

function key(annotator: string) {
  return `${VISITED_PREFIX}${annotator}`;
}

function loadVisited(annotator: string): string[] {
  if (!annotator) return [];
  try {
    const raw = localStorage.getItem(key(annotator));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function saveVisited(annotator: string, ids: string[]) {
  if (!annotator) return;
  try {
    localStorage.setItem(key(annotator), JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function useAnnotateQueue(annotator: string) {
  const [visited, setVisited] = useState<string[]>(() => loadVisited(annotator));

  useEffect(() => {
    setVisited(loadVisited(annotator));
  }, [annotator]);

  const allIds = [...annotationArticles]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((a) => a.id);

  const markVisited = useCallback(
    (articleId: string) => {
      setVisited((prev) => {
        if (prev.includes(articleId)) return prev;
        const next = [...prev, articleId];
        saveVisited(annotator, next);
        return next;
      });
    },
    [annotator],
  );

  const resetVisited = useCallback(() => {
    setVisited([]);
    saveVisited(annotator, []);
  }, [annotator]);

  const nextUnvisited = useCallback(
    (afterId?: string) => {
      const visitedSet = new Set(visited);
      if (afterId) visitedSet.add(afterId);
      for (const id of allIds) {
        if (!visitedSet.has(id)) return id;
      }
      return null;
    },
    [allIds, visited],
  );

  return {
    visited,
    totalCount: allIds.length,
    visitedCount: visited.length,
    markVisited,
    resetVisited,
    nextUnvisited,
    allIds,
  };
}
