import type { SpanAnnotation } from "@/lib/spanAnnotation";

// Backward-compatibility map for span label option ids.
//
// Labels were renamed (see data/annotator.config.json). Annotations saved
// before the rename still carry the OLD option ids. This map upgrades an old
// id to its current one so legacy spans keep their label + color, and get
// re-saved under the new id. Ids not listed here are already current.
export const OPTION_ID_ALIASES: Record<string, string> = {
  // expr
  E: "Em",
  "E+": "EmPos",
  "E-": "EmNeg",
  Efear: "EmNegFear",
  Erid: "EmNegRid",
  // appeal
  EmApp: "AppEmo",
  UrApp: "AppUrg",
  AuApp: "AppAuth",
  UvTApp: "AppUsvsthem",
  BaApp: "AppBa",
  // question
  LeQ: "QuestLead",
  DBQ: "QuestDoublebarr",
  HyQ: "QuestHypoth",
  FPQ: "QuestFalsepremise",
  LQ: "QuestLoaded",
  // untruth
  FalseSource: "FalseSrcDubious",
  FalseUnkSrc: "FalseSrcUnspec",
  // legit
  LTA: "LegitbyAuthority",
  LTME: "LegitbyMoral",
  LTR: "LegitbyRational",
  LTM: "LegitbyMythos",
};

// Resolve an option id to its current value (identity if already current).
export function migrateOptionId(optionId: string | undefined): string | undefined {
  if (!optionId) return optionId;
  return OPTION_ID_ALIASES[optionId] ?? optionId;
}

// Upgrade any legacy option ids in a span list to their current ids.
export function migrateSpans(spans: SpanAnnotation[]): SpanAnnotation[] {
  return spans.map((s) =>
    s.optionId && OPTION_ID_ALIASES[s.optionId]
      ? { ...s, optionId: OPTION_ID_ALIASES[s.optionId] }
      : s
  );
}
