import { useAnnotationArticles } from "@/context/AnnotationArticlesContext";
import { useCallback, useMemo } from "react";

export function useAnnotateQueue(annotatedIds: Set<string>) {
  const articles = useAnnotationArticles();

  const allIds = useMemo(
    () =>
      [...articles]
        .sort((a, b) =>
          a.id.localeCompare(b.id, undefined, { numeric: true }),
        )
        .map((a) => a.id),
    [articles],
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
