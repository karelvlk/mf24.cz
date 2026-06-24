import annotatorConfig from "../../data/annotator.config.json";
import { LabelConfigSchema, buildSeedTypes } from "@/lib/labelConfig";
import type { AnnotationType } from "@/lib/spanAnnotation";

// Build-time default, parsed from the bundled config. Used as a fallback when
// /api/labels is unavailable (e.g. static preview without the middleware).
export const DEFAULT_LABEL_CONFIG = LabelConfigSchema.parse(annotatorConfig.labels);

export const SEED_ANNOTATION_TYPES: AnnotationType[] = buildSeedTypes(DEFAULT_LABEL_CONFIG);
