import { z } from "zod";
import type { AnnotationType } from "@/lib/spanAnnotation";

// Schema for the `labels` section of data/annotator.config.json (served via /api/labels).
export const LabelOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  hint: z.string().optional(),
});

export const LabelCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "color must be a hex string"),
  hint: z.string().optional(),
  locked: z.boolean().optional().default(true),
  options: z.array(LabelOptionSchema).default([]),
  range: z
    .object({
      min: z.number(),
      max: z.number(),
      step: z.number(),
      lowLabel: z.string().optional(),
      highLabel: z.string().optional(),
    })
    .optional(),
});

export const LabelConfigSchema = z.object({
  categories: z.array(LabelCategorySchema).min(1),
});

export type LabelConfig = z.infer<typeof LabelConfigSchema>;
export type LabelCategory = z.infer<typeof LabelCategorySchema>;

// Convert a validated label config into the AnnotationType[] the UI consumes.
export function buildSeedTypes(config: LabelConfig): AnnotationType[] {
  return config.categories.map((cat): AnnotationType => ({
    id: `seed:${cat.id}`,
    name: cat.name,
    color: cat.color,
    source: "seed",
    category: cat.id,
    hint: cat.hint,
    locked: cat.locked,
    options:
      cat.options.length > 0
        ? cat.options.map((o) => ({ id: o.id, label: o.label, hint: o.hint }))
        : undefined,
    range: cat.range as AnnotationType["range"],
  }));
}

// Parse unknown JSON (e.g. from /api/labels) into seed types, or throw with a readable message.
export function parseLabelConfig(raw: unknown): AnnotationType[] {
  return buildSeedTypes(LabelConfigSchema.parse(raw));
}
