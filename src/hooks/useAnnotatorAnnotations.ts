import type { SpanAnnotation } from "@/lib/spanAnnotation";
import { useCallback, useEffect, useState } from "react";

export type AnnotatorAnnotation = {
  articleId: string;
  credibility?: number;
  manipulativeness?: number;
  spans: SpanAnnotation[];
  timestamp: string;
};

type ServerPayload = {
  annotatorId: string;
  articleId: string;
  answers: {
    credibility?: number;
    manipulativeness?: number;
    spans?: SpanAnnotation[];
  };
  timestamp: string;
};

export function useAnnotatorAnnotations(annotator: string) {
  const [byArticle, setByArticle] = useState<Map<string, AnnotatorAnnotation>>(
    new Map(),
  );
  const [loading, setLoading] = useState<boolean>(Boolean(annotator));
  const [hasFetched, setHasFetched] = useState(false);

  const refetch = useCallback(async () => {
    if (!annotator) {
      setByArticle(new Map());
      setHasFetched(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.BASE_URL}api/save-annotation?annotator=${encodeURIComponent(annotator)}`,
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as ServerPayload[];
      const map = new Map<string, AnnotatorAnnotation>();
      for (const item of data) {
        if (item.annotatorId !== annotator) continue;
        map.set(item.articleId, {
          articleId: item.articleId,
          credibility: item.answers?.credibility,
          manipulativeness: item.answers?.manipulativeness,
          spans: item.answers?.spans ?? [],
          timestamp: item.timestamp,
        });
      }
      setByArticle(map);
    } catch (err) {
      console.error("Failed to fetch annotator annotations:", err);
    } finally {
      setHasFetched(true);
      setLoading(false);
    }
  }, [annotator]);

  useEffect(() => {
    setHasFetched(false);
    refetch();
  }, [refetch]);

  return { byArticle, loading, hasFetched, refetch };
}

export async function deleteAllAnnotationsForAnnotator(
  annotator: string,
): Promise<number> {
  const resp = await fetch(
    `${import.meta.env.BASE_URL}api/save-annotation?annotator=${encodeURIComponent(annotator)}`,
    { method: "DELETE" },
  );
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  return data.deleted ?? 0;
}
