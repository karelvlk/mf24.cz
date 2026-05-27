import { SEED_ANNOTATION_TYPES } from "@/data/annotationSeeds";
import type { AnnotationType } from "@/lib/spanAnnotation";
import { useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX = "annotation_types_";

function storageKey(participantId: string) {
  return `${STORAGE_PREFIX}${participantId}`;
}

function loadTypes(participantId: string): AnnotationType[] {
  const seeds = [...SEED_ANNOTATION_TYPES];
  if (!participantId) return seeds;
  try {
    const raw = localStorage.getItem(storageKey(participantId));
    if (!raw) return seeds;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return seeds;
    const seedIds = new Set(seeds.map((s) => s.id));
    const userTypes = parsed.filter(
      (t): t is AnnotationType =>
        t &&
        typeof t.id === "string" &&
        typeof t.name === "string" &&
        typeof t.color === "string" &&
        t.source !== "seed" &&
        !seedIds.has(t.id),
    ).map((t) => ({ ...t, category: t.category ?? "custom" as const }));
    return [...seeds, ...userTypes];
  } catch {
    return seeds;
  }
}

export function useAnnotationTypes(participantId: string) {
  const [types, setTypes] = useState<AnnotationType[]>(() => loadTypes(participantId));

  useEffect(() => {
    setTypes(loadTypes(participantId));
  }, [participantId]);

  useEffect(() => {
    if (!participantId) return;
    try {
      const userOnly = types.filter((t) => t.source !== "seed");
      localStorage.setItem(storageKey(participantId), JSON.stringify(userOnly));
    } catch {
      // ignore quota errors
    }
  }, [participantId, types]);

  const addType = useCallback((next: AnnotationType) => {
    const withCategory: AnnotationType = {
      ...next,
      category: next.category ?? "custom",
      source: next.source ?? "user",
    };
    setTypes((prev) => [...prev, withCategory]);
  }, []);

  const updateType = useCallback((id: string, patch: Partial<AnnotationType>) => {
    setTypes((prev) =>
      prev.map((t) => (t.id === id && !t.locked ? { ...t, ...patch } : t)),
    );
  }, []);

  const removeType = useCallback((id: string) => {
    setTypes((prev) => prev.filter((t) => t.id !== id || t.locked));
  }, []);

  return { types, addType, updateType, removeType };
}
