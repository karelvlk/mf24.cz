import type {
  AnnotationCategory,
  AnnotationOption,
  AnnotationType,
} from "@/lib/spanAnnotation";

export const CATEGORY_LABELS: Record<AnnotationCategory, string> = {
  expr: "Expresivita",
  appeal: "Apely",
  question: "Manipulativní otázky",
  untruth: "Nepravdivost",
  legit: "Legitimizace",
  custom: "Vlastní",
};

export const CATEGORY_ORDER: AnnotationCategory[] = [
  "expr",
  "appeal",
  "question",
  "untruth",
  "legit",
  "custom",
];

const CATEGORY_COLORS: Record<Exclude<AnnotationCategory, "custom">, string> = {
  expr: "#f59e0b",
  appeal: "#f43f5e",
  question: "#8b5cf6",
  untruth: "#10b981",
  legit: "#0ea5e9",
};

const CATEGORY_HINTS: Record<Exclude<AnnotationCategory, "custom">, string> = {
  expr: "Spans naznačující/dokládající manipulativitu skrze expresivitu",
  appeal: "Apely / pobízení k akci",
  question: "Manipulativní otázky (často obsahují odpověď)",
  untruth: "Příznaky naznačující/dokládající nepravdivost",
  legit: "Legitimizace textu (způsoby)",
};

const SEED_OPTIONS: Partial<Record<Exclude<AnnotationCategory, "custom">, AnnotationOption[]>> = {
  expr: [
    { id: "E", label: "E", hint: "Expresivní – vyvolává emoce" },
    { id: "E+", label: "E+", hint: "Pozitivní emoce" },
    { id: "Efear", label: "Efear", hint: "Strach" },
    { id: "Erid", label: "Erid", hint: "Posměch, sarkasmus, ironie, dehonestace" },
  ],
  appeal: [
    { id: "EmApp", label: "EmApp", hint: "Emocionální apel" },
    { id: "UrApp", label: "UrApp", hint: "Apel na naléhavost (urgency)" },
    { id: "AuApp", label: "AuApp", hint: "Apel na autoritu" },
    { id: "UvTApp", label: "UvTApp", hint: "Us vs. Them – vytváření falešného rozdělení mezi lidmi na základě problematického znaku (etnicita, názorový proud apod.)" },
    { id: "BaApp", label: "BaApp", hint: "Bandwagon – přidejte se k většině / k vítězi (oproti UvTApp nastává až konsekventně)" },
  ],
  question: [
    { id: "LeQ", label: "LeQ", hint: "Návodná otázka (nucení k potvrzení, očekávání souhlasu)" },
    { id: "DBQ", label: "DBQ", hint: "Dvojí otázka – redukce na 2 možnosti, umělé dilema" },
    { id: "HyQ", label: "HyQ", hint: "Hypotetická otázka – irelevantní scénáře" },
    { id: "FPQ", label: "FPQ", hint: "Falešný předpoklad v otázce" },
    { id: "LQ", label: "LQ", hint: "Loaded – v podtextu předsudek vůči někomu" },
  ],
  untruth: [
    { id: "FalseFab", label: "FalseFab", hint: "Výmysl, odkaz na neexistující entitu" },
    { id: "FalseWrong", label: "FalseWrong", hint: "Nesprávný údaj" },
    { id: "FalseUnver", label: "FalseUnver", hint: "Nedoložitelný údaj" },
    { id: "FalseIncons", label: "FalseIncons", hint: "Inkonzistence tvrzení v rámci textu samotného" },
    { id: "FalseExagg", label: "FalseExagg", hint: "Přehánění a zkreslování (superlativy, absolutní tvrzení)" },
    { id: "FalseContext", label: "FalseContext", hint: "Chybějící kontext (údaj pravdivý v jiném kontextu, který zde chybí)" },
    { id: "FalseRepe", label: "FalseRepe", hint: "Opakování a propagandistické fráze" },
    { id: "FalseSource", label: "FalseSource", hint: "Pochybný zdroj informace (neznámý nebo nedůvěryhodný)" },
    { id: "FalseUnkSrc", label: "FalseUnkSrc", hint: "Nejasné autorství/reference – „my“ místo konkrétního subjektu" },
  ],
  legit: [
    { id: "LTA", label: "LTA", hint: "Autorizace – odvolání se na autoritu (bez pobídky k akci)" },
    { id: "LTME", label: "LTME", hint: "Morální hodnocení" },
    { id: "LTR", label: "LTR", hint: "Racionalizace – (pseudo)vědecká fakta, tabulky, odborné texty" },
    { id: "LTM", label: "LTM", hint: "Mythopoesis – legitimizace příběhem, dramatizace" },
  ],
};

export const SEED_ANNOTATION_TYPES: AnnotationType[] = (
  Object.keys(SEED_OPTIONS) as Array<Exclude<AnnotationCategory, "custom">>
).map((cat) => ({
  id: `seed:${cat}`,
  name: CATEGORY_LABELS[cat],
  color: CATEGORY_COLORS[cat],
  source: "seed",
  category: cat,
  hint: CATEGORY_HINTS[cat],
  locked: true,
  options: SEED_OPTIONS[cat]!,
}));
