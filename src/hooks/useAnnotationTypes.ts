import { SEED_ANNOTATION_TYPES } from "@/data/annotationSeeds";
import type { AnnotationType } from "@/lib/spanAnnotation";
import { useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX = "annotation_types_";

function storageKey(participantId: string) {
  return `${STORAGE_PREFIX}${participantId}`;
}

function loadTypes(participantId: string): AnnotationType[] {
  if (!participantId) return [...SEED_ANNOTATION_TYPES];
  try {
    const raw = localStorage.getItem(storageKey(participantId));
    if (!raw) {
      return [...SEED_ANNOTATION_TYPES];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...SEED_ANNOTATION_TYPES];
    const userTypes = parsed.filter(
      (t): t is AnnotationType =>
        t && typeof t.id === "string" && typeof t.name === "string" && typeof t.color === "string",
    );
    const seeds = SEED_ANNOTATION_TYPES.filter(
      (s) => !userTypes.some((u) => u.id === s.id),
    );
    return [...seeds, ...userTypes];
  } catch {
    return [...SEED_ANNOTATION_TYPES];
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
      localStorage.setItem(storageKey(participantId), JSON.stringify(types));
    } catch {
      // ignore quota errors
    }
  }, [participantId, types]);

  const addType = useCallback((next: AnnotationType) => {
    setTypes((prev) => [...prev, next]);
  }, []);

  const updateType = useCallback((id: string, patch: Partial<AnnotationType>) => {
    setTypes((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const removeType = useCallback((id: string) => {
    setTypes((prev) => prev.filter((t) => t.id !== id || t.source === "seed"));
  }, []);

  return { types, addType, updateType, removeType };
}
