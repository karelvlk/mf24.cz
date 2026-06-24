import { SEED_ANNOTATION_TYPES } from "@/data/annotationSeeds";
import { parseLabelConfig } from "@/lib/labelConfig";
import type { AnnotationType } from "@/lib/spanAnnotation";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_PREFIX = "annotation_types_";

function storageKey(participantId: string) {
  return `${STORAGE_PREFIX}${participantId}`;
}

async function fetchSeedTypes(): Promise<AnnotationType[]> {
  const resp = await fetch(`${import.meta.env.BASE_URL}api/labels`);
  if (!resp.ok) throw new Error(`Failed to load labels: ${resp.status}`);
  return parseLabelConfig(await resp.json());
}

function loadUserTypes(
  participantId: string,
  seeds: AnnotationType[],
): AnnotationType[] {
  if (!participantId) return [];
  try {
    const raw = localStorage.getItem(storageKey(participantId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seedIds = new Set(seeds.map((s) => s.id));
    return parsed
      .filter(
        (t): t is AnnotationType =>
          t &&
          typeof t.id === "string" &&
          typeof t.name === "string" &&
          typeof t.color === "string" &&
          t.source !== "seed" &&
          !seedIds.has(t.id),
      )
      .map((t) => ({ ...t, category: t.category ?? "custom" }));
  } catch {
    return [];
  }
}

export function useAnnotationTypes(participantId: string) {
  // Seed (predefined) types come from the server config, falling back to the
  // bundled default when the labels endpoint is unavailable.
  const { data: seeds = SEED_ANNOTATION_TYPES } = useQuery({
    queryKey: ["labels"],
    queryFn: fetchSeedTypes,
    staleTime: Infinity,
    placeholderData: SEED_ANNOTATION_TYPES,
  });

  const [userTypes, setUserTypes] = useState<AnnotationType[]>([]);

  useEffect(() => {
    setUserTypes(loadUserTypes(participantId, seeds));
  }, [participantId, seeds]);

  useEffect(() => {
    if (!participantId) return;
    try {
      localStorage.setItem(storageKey(participantId), JSON.stringify(userTypes));
    } catch {
      // ignore quota errors
    }
  }, [participantId, userTypes]);

  const types = useMemo(() => [...seeds, ...userTypes], [seeds, userTypes]);

  const addType = useCallback((next: AnnotationType) => {
    const withCategory: AnnotationType = {
      ...next,
      category: next.category ?? "custom",
      source: next.source ?? "user",
    };
    setUserTypes((prev) => [...prev, withCategory]);
  }, []);

  const updateType = useCallback((id: string, patch: Partial<AnnotationType>) => {
    setUserTypes((prev) =>
      prev.map((t) => (t.id === id && !t.locked ? { ...t, ...patch } : t)),
    );
  }, []);

  const removeType = useCallback((id: string) => {
    setUserTypes((prev) => prev.filter((t) => t.id !== id || t.locked));
  }, []);

  return { types, addType, updateType, removeType };
}
