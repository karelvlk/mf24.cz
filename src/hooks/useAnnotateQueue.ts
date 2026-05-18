import { annotationArticles } from "@/data/news";
import { useCallback, useMemo } from "react";

export function useAnnotateQueue(annotatedIds: Set<string>) {
  const allIds = useMemo(
    () =>
      [...annotationArticles]
        .sort((a, b) =>
          a.id.localeCompare(b.id, undefined, { numeric: true }),
        )
        .map((a) => a.id),
    [],
  );

  const nextUnvisited = useCallback(
    (afterId?: string) => {
      const visited = new Set(annotatedIds);
      if (afterId) visited.add(afterId);
      for (const id of allIds) {
        if (!visited.has(id)) return id;
      }
      return null;
    },
    [allIds, annotatedIds],
  );

  return {
    allIds,
    totalCount: allIds.length,
    visitedCount: annotatedIds.size,
    nextUnvisited,
  };
}
