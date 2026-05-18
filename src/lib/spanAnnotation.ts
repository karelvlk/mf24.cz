export type AnnotationType = {
  id: string;
  name: string;
  color: string;
  source: "seed" | "user";
  range?: {
    min: number;
    max: number;
    step: number;
    lowLabel?: string;
    highLabel?: string;
  };
};

export type SpanAnnotation = {
  id: string;
  typeId: string;
  startWord: number;
  endWord: number;
  value?: number;
};

export type Token = {
  globalIdx: number;
  text: string;
  leadingWs: string;
};

export type PageRange = {
  start: number;
  end: number;
};

export function normalizePageText(text: string): string {
  return text
    .replace(/\n+/g, " ")
    .replace(/\b([kKsSvVzZ])\s+/g, "$1 ")
    .trim();
}

export function tokenizePages(pages: string[]): {
  tokens: Token[];
  pageRanges: PageRange[];
} {
  const tokens: Token[] = [];
  const pageRanges: PageRange[] = [];

  for (const rawPage of pages) {
    const normalized = normalizePageText(rawPage);
    const start = tokens.length;

    if (normalized.length === 0) {
      pageRanges.push({ start, end: start });
      continue;
    }

    const re = /(\s*)(\S+)/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(normalized)) !== null) {
      tokens.push({
        globalIdx: tokens.length,
        leadingWs: match[1],
        text: match[2],
      });
    }

    pageRanges.push({ start, end: tokens.length });
  }

  return { tokens, pageRanges };
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const PALETTE_HUE_STEP = 137.508;

export function autoPickColor(existingTypeCount: number): string {
  const hue = (existingTypeCount * PALETTE_HUE_STEP) % 360;
  return hslToHex(hue, 65, 50);
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) =>
    lNorm - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace(/^#/, "");
  if (m.length !== 3 && m.length !== 6) return null;
  const expanded =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m;
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
}

export function shadeColor(baseHex: string, value: number | undefined, range?: AnnotationType["range"]): string {
  const parsed = parseHex(baseHex);
  if (!parsed) return baseHex;
  if (!range || value === undefined) {
    return baseHex;
  }
  const span = range.max - range.min;
  const t = span === 0 ? 1 : (value - range.min) / span;
  const mix = 0.3 + Math.max(0, Math.min(1, t)) * 0.7;
  const r = Math.round(255 - (255 - parsed.r) * mix);
  const g = Math.round(255 - (255 - parsed.g) * mix);
  const b = Math.round(255 - (255 - parsed.b) * mix);
  const toHex = (x: number) => x.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export type AnnotationStats = {
  totalSpans: number;
  totalCoveredWords: number;
  totalWords: number;
  coveragePct: number;
  perType: Array<{
    typeId: string;
    spanCount: number;
    coveredWords: number;
    coveragePct: number;
  }>;
};

export function computeStats(
  spans: SpanAnnotation[],
  totalWords: number,
  types: AnnotationType[],
): AnnotationStats {
  const allCovered = new Set<number>();
  const perTypeCovered = new Map<string, Set<number>>();
  const perTypeCount = new Map<string, number>();

  for (const span of spans) {
    perTypeCount.set(span.typeId, (perTypeCount.get(span.typeId) ?? 0) + 1);
    const set = perTypeCovered.get(span.typeId) ?? new Set<number>();
    for (let i = span.startWord; i <= span.endWord; i += 1) {
      allCovered.add(i);
      set.add(i);
    }
    perTypeCovered.set(span.typeId, set);
  }

  const totalCoveredWords = allCovered.size;
  const coveragePct = totalWords > 0 ? (totalCoveredWords / totalWords) * 100 : 0;

  const perType = types
    .map((t) => {
      const covered = perTypeCovered.get(t.id)?.size ?? 0;
      return {
        typeId: t.id,
        spanCount: perTypeCount.get(t.id) ?? 0,
        coveredWords: covered,
        coveragePct: totalWords > 0 ? (covered / totalWords) * 100 : 0,
      };
    })
    .filter((r) => r.spanCount > 0);

  return {
    totalSpans: spans.length,
    totalCoveredWords,
    totalWords,
    coveragePct,
    perType,
  };
}

export function getSpanSnippet(
  span: SpanAnnotation,
  tokens: Token[],
  maxWords = 8,
): string {
  const start = Math.max(0, span.startWord);
  const end = Math.min(tokens.length - 1, span.endWord);
  const len = end - start + 1;
  if (len <= maxWords) {
    return tokens
      .slice(start, end + 1)
      .map((t, i) => (i === 0 ? "" : t.leadingWs) + t.text)
      .join("");
  }
  const head = tokens
    .slice(start, start + Math.ceil(maxWords / 2))
    .map((t, i) => (i === 0 ? "" : t.leadingWs) + t.text)
    .join("");
  const tail = tokens
    .slice(end - Math.floor(maxWords / 2) + 1, end + 1)
    .map((t) => t.leadingWs + t.text)
    .join("");
  return `${head} … ${tail.trim()}`;
}

export function assignSpanLayers(spans: SpanAnnotation[]): Map<string, number> {
  const layers = new Map<string, number>();
  const sorted = [...spans].sort((a, b) => {
    if (a.startWord !== b.startWord) return a.startWord - b.startWord;
    return a.endWord - b.endWord;
  });

  const layerEnds: number[] = [];
  for (const span of sorted) {
    let assigned = -1;
    for (let i = 0; i < layerEnds.length; i += 1) {
      if (layerEnds[i] < span.startWord) {
        assigned = i;
        break;
      }
    }
    if (assigned === -1) {
      assigned = layerEnds.length;
      layerEnds.push(span.endWord);
    } else {
      layerEnds[assigned] = span.endWord;
    }
    layers.set(span.id, assigned);
  }
  return layers;
}
