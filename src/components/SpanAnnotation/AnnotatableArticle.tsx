import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import type {
  AnnotationType,
  PageRange,
  SpanAnnotation,
  Token,
} from "@/lib/spanAnnotation";
import {
  assignSpanLayers,
  buildTokenCharRanges,
  charRangeToWordRange,
  generateId,
  shadeColor,
  shadeColorByOption,
} from "@/lib/spanAnnotation";
import {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import SpanPopover from "./SpanPopover";

interface AnnotatableArticleProps {
  tokens: Token[];
  pageRange: PageRange;
  spans: SpanAnnotation[];
  types: AnnotationType[];
  activeTypeId: string | null;
  activeOptionId?: string | null;
  onAddSpan: (span: SpanAnnotation) => void;
  onUpdateSpan: (id: string, patch: Partial<SpanAnnotation>) => void;
  onRemoveSpan: (id: string) => void;
  fontSize: number;
  lineHeight: number;
  fontFamily?: string;
  textAlign?: "justify" | "left";
  pulseSpanId?: string | null;
  pulseKey?: number;
  granularity?: "word" | "char";
}

const TRACK_HEIGHT = 4;
const TRACK_GAP = 2;
const STROKE_WIDTH = 3;
const HIT_STROKE_WIDTH = 14;
const BASELINE_OFFSET = 5;
const HANDLE_RADIUS = 5;
const HANDLE_HIT_RADIUS = 10;
const DRAFT_ID = "__draft__";

type TokenGeom = {
  idx: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

type Line = {
  top: number;
  bottom: number;
  tokens: TokenGeom[];
};

type Draft = {
  typeId: string;
  startWord: number;
  endWord: number;
};

type Editing = {
  spanId: string;
  endpoint: "start" | "end";
};

// Rendered underline piece for a character span (one per visual line rect).
type CharSegment = {
  spanId: string;
  typeId: string;
  color: string;
  layer: number;
  left: number;
  right: number;
  y: number;
  value?: number;
  optionLabel?: string;
  isFirst: boolean;
  isDraft: false;
};

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace(/^#/, "");
  if (m.length !== 3 && m.length !== 6) return hex;
  const exp = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(exp.slice(0, 2), 16);
  const g = parseInt(exp.slice(2, 4), 16);
  const b = parseInt(exp.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function AnnotatableArticle({
  tokens,
  pageRange,
  spans,
  types,
  activeTypeId,
  activeOptionId,
  onAddSpan,
  onUpdateSpan,
  onRemoveSpan,
  fontSize,
  lineHeight,
  fontFamily,
  textAlign,
  pulseSpanId,
  pulseKey,
  granularity = "word",
}: AnnotatableArticleProps) {
  const charMode = granularity === "char";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLParagraphElement | null>(null);
  const tokenRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const geomRef = useRef<Map<number, TokenGeom>>(new Map());

  const [lines, setLines] = useState<Line[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [hoverTokenIdx, setHoverTokenIdx] = useState<number | null>(null);
  const [popoverAt, setPopoverAt] = useState<{
    x: number;
    y: number;
    spanIds: string[];
  } | null>(null);
  const [pulseActiveId, setPulseActiveId] = useState<string | null>(null);
  const [hoveredSpanId, setHoveredSpanId] = useState<string | null>(null);
  const [charSegmentsBySpan, setCharSegmentsBySpan] = useState<
    Map<string, CharSegment[]>
  >(() => new Map());

  const typeMap = useMemo(() => {
    const m = new Map<string, AnnotationType>();
    types.forEach((t) => m.set(t.id, t));
    return m;
  }, [types]);

  const activeType = activeTypeId ? typeMap.get(activeTypeId) ?? null : null;

  const tokenToSpans = useMemo(() => {
    const m = new Map<number, SpanAnnotation[]>();
    for (const s of spans) {
      for (let i = s.startWord; i <= s.endWord; i += 1) {
        const list = m.get(i) ?? [];
        list.push(s);
        m.set(i, list);
      }
    }
    return m;
  }, [spans]);

  const pageTokens = useMemo(
    () => tokens.slice(pageRange.start, pageRange.end),
    [tokens, pageRange.start, pageRange.end],
  );

  const tokenCharRanges = useMemo(
    () => buildTokenCharRanges(tokens, pageRange),
    [tokens, pageRange],
  );

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    setContainerSize({
      width: containerRect.width,
      height: containerRect.height,
    });

    const lineBuckets = new Map<number, TokenGeom[]>();
    const newGeom = new Map<number, TokenGeom>();
    for (let i = pageRange.start; i < pageRange.end; i += 1) {
      const el = tokenRefs.current.get(i);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      const g: TokenGeom = {
        idx: i,
        left: rect.left - containerRect.left,
        right: rect.right - containerRect.left,
        top: rect.top - containerRect.top,
        bottom: rect.bottom - containerRect.top,
      };
      newGeom.set(i, g);
      const key = Math.round(g.top);
      const arr = lineBuckets.get(key) ?? [];
      arr.push(g);
      lineBuckets.set(key, arr);
    }
    geomRef.current = newGeom;

    const nextLines: Line[] = [...lineBuckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, toks]) => {
        toks.sort((a, b) => a.left - b.left);
        const top = Math.min(...toks.map((t) => t.top));
        const bottom = Math.max(...toks.map((t) => t.bottom));
        return { top, bottom, tokens: toks };
      });

    setLines(nextLines);
  }, [pageRange.start, pageRange.end]);

  useLayoutEffect(() => {
    measure();
  }, [measure, pageTokens, fontSize, lineHeight, fontFamily, textAlign]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(containerRef.current);
    if (textRef.current) ro.observe(textRef.current);
    return () => ro.disconnect();
  }, [measure]);

  const findTokenByPoint = useCallback(
    (clientX: number, clientY: number): number | null => {
      const container = containerRef.current;
      if (!container || lines.length === 0) return null;
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      let bestLine: Line | null = null;
      const middles = lines.map((ln) => (ln.top + ln.bottom) / 2);
      if (y < middles[0]) {
        bestLine = lines[0];
      } else if (y >= middles[middles.length - 1]) {
        bestLine = lines[lines.length - 1];
      } else {
        for (let i = 0; i < lines.length - 1; i += 1) {
          if (y >= middles[i] && y < middles[i + 1]) {
            bestLine = lines[i];
            break;
          }
        }
      }
      if (!bestLine) return null;

      let bestTok = bestLine.tokens[0];
      let bestTokDist = Infinity;
      for (const t of bestLine.tokens) {
        if (x >= t.left && x <= t.right) return t.idx;
        const d = Math.min(Math.abs(x - t.left), Math.abs(x - t.right));
        if (d < bestTokDist) {
          bestTokDist = d;
          bestTok = t;
        }
      }
      return bestTok.idx;
    },
    [lines],
  );

  const draftSpan: SpanAnnotation | null = useMemo(() => {
    if (!draft) return null;
    return {
      id: DRAFT_ID,
      typeId: draft.typeId,
      startWord: Math.min(draft.startWord, draft.endWord),
      endWord: Math.max(draft.startWord, draft.endWord),
    };
  }, [draft]);

  const spansForLayout = useMemo(() => {
    if (!draftSpan) return spans;
    return [...spans, draftSpan];
  }, [spans, draftSpan]);

  const layerMap = useMemo(
    () => assignSpanLayers(spansForLayout),
    [spansForLayout],
  );

  const maxLayer = useMemo(() => {
    let m = -1;
    layerMap.forEach((v) => {
      if (v > m) m = v;
    });
    return m;
  }, [layerMap]);

  const paddingBottom =
    BASELINE_OFFSET + (maxLayer + 1) * (TRACK_HEIGHT + TRACK_GAP) + 6;

  type Segment = {
    spanId: string;
    typeId: string;
    color: string;
    layer: number;
    left: number;
    right: number;
    y: number;
    value?: number;
    optionLabel?: string;
    isFirst: boolean;
    isDraft: boolean;
  };

  const segmentsBySpan: Map<string, Segment[]> = useMemo(() => {
    const map = new Map<string, Segment[]>();
    if (lines.length === 0) return map;
    const wordSpans = spans.filter((s) => s.granularity !== "char");
    const renderList: SpanAnnotation[] = draftSpan
      ? [...wordSpans, draftSpan]
      : wordSpans;

    for (const span of renderList) {
      const isDraft = span.id === DRAFT_ID;
      const type = typeMap.get(span.typeId);
      if (!type) continue;
      const baseColor = type.color;
      let color = baseColor;
      if (!isDraft) {
        if (type.options && type.options.length > 0) {
          color = shadeColorByOption(baseColor, span.optionId, type.options);
        } else if (type.range) {
          color = shadeColor(baseColor, span.value, type.range);
        }
      }
      const layer = layerMap.get(span.id) ?? 0;
      const arr: Segment[] = [];
      const optionLabel =
        type.options && span.optionId
          ? type.options.find((o) => o.id === span.optionId)?.label
          : undefined;

      for (const line of lines) {
        let leftmost: TokenGeom | null = null;
        let rightmost: TokenGeom | null = null;
        for (const t of line.tokens) {
          if (t.idx < span.startWord || t.idx > span.endWord) continue;
          if (!leftmost || t.left < leftmost.left) leftmost = t;
          if (!rightmost || t.right > rightmost.right) rightmost = t;
        }
        if (!leftmost || !rightmost) continue;
        const y =
          line.bottom +
          BASELINE_OFFSET +
          layer * (TRACK_HEIGHT + TRACK_GAP) +
          TRACK_HEIGHT / 2;
        arr.push({
          spanId: span.id,
          typeId: span.typeId,
          color,
          layer,
          left: leftmost.left,
          right: rightmost.right,
          y,
          value: span.value,
          optionLabel,
          isFirst: arr.length === 0,
          isDraft,
        });
      }
      if (arr.length > 0) map.set(span.id, arr);
    }
    return map;
  }, [lines, spans, draftSpan, typeMap, layerMap]);

  // Character spans are positioned with DOM Range rects (partial-token precision)
  // rather than whole-token geometry. Recompute whenever layout or spans change.
  useLayoutEffect(() => {
    const container = containerRef.current;
    const charSpans = spans.filter(
      (s) =>
        s.granularity === "char" &&
        s.startChar !== undefined &&
        s.endChar !== undefined,
    );
    if (!container || charSpans.length === 0) {
      setCharSegmentsBySpan((prev) => (prev.size === 0 ? prev : new Map()));
      return;
    }
    const containerRect = container.getBoundingClientRect();

    const resolve = (offset: number, edge: "start" | "end") => {
      for (const [idx, r] of tokenCharRanges) {
        const inside =
          edge === "start"
            ? offset >= r.textStart && offset < r.textEnd
            : offset > r.textStart && offset <= r.textEnd;
        if (inside) {
          const node = tokenRefs.current.get(idx)?.firstChild ?? null;
          if (node) return { node, off: offset - r.textStart };
        }
      }
      // Boundary / whitespace gap: snap to the nearest token edge.
      if (edge === "start") {
        for (const [idx, r] of tokenCharRanges) {
          if (offset <= r.textStart) {
            const node = tokenRefs.current.get(idx)?.firstChild ?? null;
            if (node) return { node, off: 0 };
          }
        }
      } else {
        let last: { node: ChildNode; off: number } | null = null;
        for (const [idx, r] of tokenCharRanges) {
          if (r.textEnd <= offset) {
            const node = tokenRefs.current.get(idx)?.firstChild ?? null;
            if (node) last = { node, off: r.textEnd - r.textStart };
          }
        }
        return last;
      }
      return null;
    };

    const map = new Map<string, CharSegment[]>();
    for (const span of charSpans) {
      const type = typeMap.get(span.typeId);
      if (!type) continue;
      let color = type.color;
      if (type.options && type.options.length > 0) {
        color = shadeColorByOption(type.color, span.optionId, type.options);
      } else if (type.range) {
        color = shadeColor(type.color, span.value, type.range);
      }
      const layer = layerMap.get(span.id) ?? 0;
      const optionLabel =
        type.options && span.optionId
          ? type.options.find((o) => o.id === span.optionId)?.label
          : undefined;

      const start = resolve(span.startChar as number, "start");
      const end = resolve(span.endChar as number, "end");
      if (!start || !end) continue;
      let rects: DOMRectList;
      try {
        const range = document.createRange();
        range.setStart(start.node, start.off);
        range.setEnd(end.node, end.off);
        rects = range.getClientRects();
      } catch {
        continue;
      }
      const arr: CharSegment[] = [];
      for (let i = 0; i < rects.length; i += 1) {
        const rect = rects[i];
        if (rect.width === 0) continue;
        const y =
          rect.bottom -
          containerRect.top +
          BASELINE_OFFSET +
          layer * (TRACK_HEIGHT + TRACK_GAP) +
          TRACK_HEIGHT / 2;
        arr.push({
          spanId: span.id,
          typeId: span.typeId,
          color,
          layer,
          left: rect.left - containerRect.left,
          right: rect.right - containerRect.left,
          y,
          value: span.value,
          optionLabel,
          isFirst: arr.length === 0,
          isDraft: false,
        });
      }
      if (arr.length > 0) map.set(span.id, arr);
    }
    setCharSegmentsBySpan(map);
  }, [spans, lines, containerSize, typeMap, layerMap, tokenCharRanges]);

  const allSegments = useMemo(() => {
    const list: Segment[] = [];
    segmentsBySpan.forEach((arr) => list.push(...arr));
    charSegmentsBySpan.forEach((arr) => list.push(...arr));
    return list;
  }, [segmentsBySpan, charSegmentsBySpan]);

  const highlight = useMemo(() => {
    if (hoverTokenIdx === null) return null;
    if (!draft && !editing) return null;
    const g = geomRef.current.get(hoverTokenIdx);
    if (!g) return null;
    let color: string | null = null;
    if (draft) {
      const t = typeMap.get(draft.typeId);
      if (t) {
        const opts = t.options;
        color =
          opts && opts.length > 0
            ? shadeColorByOption(
                t.color,
                activeOptionId && opts.some((o) => o.id === activeOptionId)
                  ? activeOptionId
                  : opts[0].id,
                opts,
              )
            : t.color;
      }
    } else if (editing) {
      const span = spans.find((s) => s.id === editing.spanId);
      if (span) {
        const t = typeMap.get(span.typeId);
        if (t) {
          color =
            t.options && t.options.length > 0
              ? shadeColorByOption(t.color, span.optionId, t.options)
              : t.color;
        }
      }
    }
    if (!color) return null;
    return {
      x: g.left - 2,
      y: g.top - 1,
      w: g.right - g.left + 4,
      h: g.bottom - g.top + 2,
      color: hexToRgba(color, 0.25),
    };
  }, [hoverTokenIdx, draft, editing, spans, typeMap, activeOptionId]);

  const handleCharSelectionUp = useCallback(() => {
    if (!charMode || !activeType) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const container = containerRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) return;

    const mapNodeToChar = (node: Node, offset: number): number | null => {
      const el =
        node.nodeType === Node.TEXT_NODE
          ? node.parentElement
          : (node as Element);
      const tokenEl = el?.closest("[data-token-idx]") as HTMLElement | null;
      if (!tokenEl) return null;
      const idx = Number(tokenEl.dataset.tokenIdx);
      const r = tokenCharRanges.get(idx);
      if (!r) return null;
      const clamped = Math.max(0, Math.min(offset, r.textEnd - r.textStart));
      return r.textStart + clamped;
    };

    const a = mapNodeToChar(range.startContainer, range.startOffset);
    const b = mapNodeToChar(range.endContainer, range.endOffset);
    if (a === null || b === null) return;
    const startChar = Math.min(a, b);
    const endChar = Math.max(a, b);
    if (endChar - startChar < 1) return;
    const wr = charRangeToWordRange(startChar, endChar, tokenCharRanges);
    if (!wr) return;

    const targetOptionId =
      activeType.options && activeType.options.length > 0
        ? activeOptionId &&
          activeType.options.some((o) => o.id === activeOptionId)
          ? activeOptionId
          : activeType.options[0].id
        : undefined;

    onAddSpan({
      id: generateId(),
      typeId: activeType.id,
      granularity: "char",
      startChar,
      endChar,
      startWord: wr.startWord,
      endWord: wr.endWord,
      value: activeType.range ? activeType.range.min : undefined,
      optionId: targetOptionId,
    });
    sel.removeAllRanges();
  }, [charMode, activeType, activeOptionId, tokenCharRanges, onAddSpan]);

  const commitDraft = useCallback(
    (d: Draft) => {
      const start = Math.min(d.startWord, d.endWord);
      const end = Math.max(d.startWord, d.endWord);
      const type = typeMap.get(d.typeId);
      if (!type) return;

      const targetOptionId =
        type.options && type.options.length > 0
          ? (activeOptionId && type.options.some((o) => o.id === activeOptionId)
              ? activeOptionId
              : type.options[0].id)
          : undefined;

      const overlapping = spans.filter(
        (s) =>
          s.typeId === d.typeId &&
          s.optionId === targetOptionId &&
          !(s.endWord < start || s.startWord > end),
      );

      if (overlapping.length === 0) {
        onAddSpan({
          id: generateId(),
          typeId: d.typeId,
          startWord: start,
          endWord: end,
          value: type.range ? type.range.min : undefined,
          optionId: targetOptionId,
        });
        return;
      }

      const unionStart = Math.min(start, ...overlapping.map((s) => s.startWord));
      const unionEnd = Math.max(end, ...overlapping.map((s) => s.endWord));
      const keep = overlapping[0];
      onUpdateSpan(keep.id, { startWord: unionStart, endWord: unionEnd });
      for (let i = 1; i < overlapping.length; i += 1) {
        onRemoveSpan(overlapping[i].id);
      }
    },
    [activeOptionId, onAddSpan, onRemoveSpan, onUpdateSpan, spans, typeMap],
  );

  const mergeAfterEdit = useCallback(
    (spanId: string) => {
      const span = spans.find((s) => s.id === spanId);
      if (!span) return;
      const overlapping = spans.filter(
        (s) =>
          s.id !== spanId &&
          s.typeId === span.typeId &&
          s.optionId === span.optionId &&
          !(s.endWord < span.startWord || s.startWord > span.endWord),
      );
      if (overlapping.length === 0) return;
      const unionStart = Math.min(
        span.startWord,
        ...overlapping.map((s) => s.startWord),
      );
      const unionEnd = Math.max(
        span.endWord,
        ...overlapping.map((s) => s.endWord),
      );
      onUpdateSpan(spanId, { startWord: unionStart, endWord: unionEnd });
      for (const other of overlapping) onRemoveSpan(other.id);
    },
    [spans, onUpdateSpan, onRemoveSpan],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      const target = event.target as Element;

      const handleEl = target.closest("[data-handle-span]") as HTMLElement | null;
      if (handleEl) {
        const spanId = handleEl.dataset.handleSpan ?? "";
        const endpoint = (handleEl.dataset.handleEnd ?? "end") as
          | "start"
          | "end";
        event.preventDefault();
        event.stopPropagation();
        containerRef.current?.setPointerCapture(event.pointerId);
        setEditing({ spanId, endpoint });
        setPopoverAt(null);
        const idx = findTokenByPoint(event.clientX, event.clientY);
        if (idx !== null) setHoverTokenIdx(idx);
        return;
      }

      if (activeType && draft) {
        event.preventDefault();
        commitDraft(draft);
        setDraft(null);
        setHoverTokenIdx(null);
        return;
      }

      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;
        const STROKE_HIT_Y = (TRACK_HEIGHT + TRACK_GAP) / 2 + 0.5;
        let nearest: { spanId: string; dist: number } | null = null;
        for (const seg of allSegments) {
          if (seg.isDraft) continue;
          if (localX < seg.left - 4 || localX > seg.right + 4) continue;
          const dy = Math.abs(localY - seg.y);
          if (dy > STROKE_HIT_Y) continue;
          if (!nearest || dy < nearest.dist) {
            nearest = { spanId: seg.spanId, dist: dy };
          }
        }
        if (nearest) {
          event.preventDefault();
          setPopoverAt({
            x: event.clientX,
            y: event.clientY,
            spanIds: [nearest.spanId],
          });
          return;
        }
      }

      const idx = findTokenByPoint(event.clientX, event.clientY);
      if (idx !== null) {
        const list = tokenToSpans.get(idx);
        if (list && list.length > 0) {
          event.preventDefault();
          const sorted = [...list].sort(
            (a, b) => (layerMap.get(a.id) ?? 0) - (layerMap.get(b.id) ?? 0),
          );
          setPopoverAt({
            x: event.clientX,
            y: event.clientY,
            spanIds: sorted.map((s) => s.id),
          });
          return;
        }
      }

      if (activeType) {
        return;
      }

      setPopoverAt(null);
    },
    [
      activeType,
      draft,
      commitDraft,
      findTokenByPoint,
      tokenToSpans,
      layerMap,
      allSegments,
    ],
  );

  const handleDoubleClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!activeType || charMode) return;
      const target = event.target as Element;
      if (target.closest("[data-handle-span]")) return;
      if (target.closest("[data-stroke-span]")) return;
      const idx = findTokenByPoint(event.clientX, event.clientY);
      if (idx === null) return;
      event.preventDefault();
      setDraft({
        typeId: activeType.id,
        startWord: idx,
        endWord: idx,
      });
      setHoverTokenIdx(idx);
      setPopoverAt(null);
    },
    [activeType, charMode, findTokenByPoint],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (draft || editing) {
        const idx = findTokenByPoint(event.clientX, event.clientY);
        if (idx === null) return;
        setHoverTokenIdx(idx);
        if (draft) {
          setDraft((d) => (d ? { ...d, endWord: idx } : d));
          return;
        }
        if (editing) {
          const span = spans.find((s) => s.id === editing.spanId);
          if (!span) return;
          const anchor =
            editing.endpoint === "start" ? span.endWord : span.startWord;
          const start = Math.min(idx, anchor);
          const end = Math.max(idx, anchor);
          if (start === span.startWord && end === span.endWord) return;
          onUpdateSpan(editing.spanId, { startWord: start, endWord: end });
        }
        return;
      }

      const container = containerRef.current;
      if (!container) {
        setHoveredSpanId(null);
        return;
      }
      const rect = container.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const STROKE_HIT_Y = (TRACK_HEIGHT + TRACK_GAP) / 2 + 0.5;
      let nearest: { spanId: string; dist: number } | null = null;
      for (const seg of allSegments) {
        if (seg.isDraft) continue;
        if (localX < seg.left - 4 || localX > seg.right + 4) continue;
        const dy = Math.abs(localY - seg.y);
        if (dy > STROKE_HIT_Y) continue;
        if (!nearest || dy < nearest.dist) {
          nearest = { spanId: seg.spanId, dist: dy };
        }
      }
      setHoveredSpanId(nearest?.spanId ?? null);
    },
    [
      draft,
      editing,
      findTokenByPoint,
      onUpdateSpan,
      spans,
      allSegments,
    ],
  );

  const handlePointerLeave = useCallback(() => {
    setHoveredSpanId(null);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (editing) {
      mergeAfterEdit(editing.spanId);
      setEditing(null);
      setHoverTokenIdx(null);
    }
  }, [editing, mergeAfterEdit]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDraft(null);
        setEditing(null);
        setHoverTokenIdx(null);
        setPopoverAt(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!pulseSpanId) return;
    const span = spans.find((s) => s.id === pulseSpanId);
    if (!span) return;
    const el = tokenRefs.current.get(span.startWord);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setPulseActiveId(pulseSpanId);
    const t = window.setTimeout(() => setPulseActiveId(null), 1200);
    return () => window.clearTimeout(t);
  }, [pulseSpanId, pulseKey, spans]);

  const anchorVirtual = useMemo(() => {
    if (!popoverAt) return undefined;
    return {
      getBoundingClientRect: () =>
        ({
          x: popoverAt.x,
          y: popoverAt.y,
          left: popoverAt.x,
          right: popoverAt.x,
          top: popoverAt.y,
          bottom: popoverAt.y,
          width: 0,
          height: 0,
          toJSON: () => "",
        }) as DOMRect,
    };
  }, [popoverAt]);

  const popoverSpans = useMemo(() => {
    if (!popoverAt) return [];
    return popoverAt.spanIds
      .map((id) => spans.find((s) => s.id === id))
      .filter((s): s is SpanAnnotation => Boolean(s));
  }, [popoverAt, spans]);

  const cursor = charMode
    ? activeType
      ? "text"
      : "default"
    : activeType
      ? "crosshair"
      : editing
        ? "ew-resize"
        : "default";

  return (
    <div
      ref={containerRef}
      className={charMode ? "relative" : "relative select-none"}
      style={{
        cursor,
        touchAction: "none",
        userSelect: charMode ? "text" : undefined,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onDoubleClick={handleDoubleClick}
      onMouseUp={charMode ? handleCharSelectionUp : undefined}
    >
      <p
        ref={textRef}
        className="whitespace-normal text-foreground/80"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight,
          fontFamily,
          textAlign: textAlign ?? "left",
          paddingBottom: `${paddingBottom}px`,
        }}
      >
        {pageTokens.map((token) => {
          const idx = token.globalIdx;
          return (
            <span key={`tok-${idx}`}>
              {token.leadingWs}
              <span
                ref={(el) => {
                  if (el) tokenRefs.current.set(idx, el);
                  else tokenRefs.current.delete(idx);
                }}
                data-token-idx={idx}
              >
                {token.text}
              </span>
            </span>
          );
        })}
      </p>

      <svg
        className="pointer-events-none absolute left-0 top-0"
        width={containerSize.width}
        height={containerSize.height}
        style={{ overflow: "visible" }}
      >
        {highlight && (
          <rect
            x={highlight.x}
            y={highlight.y}
            width={highlight.w}
            height={highlight.h}
            rx={3}
            ry={3}
            fill={highlight.color}
            style={{ pointerEvents: "none" }}
          />
        )}

        {allSegments.map((seg, i) => {
          const opacity = seg.isDraft ? 0.55 : 1;
          const pulsing = !seg.isDraft && seg.spanId === pulseActiveId;
          const hovered = !seg.isDraft && seg.spanId === hoveredSpanId && !pulsing;
          return (
            <g key={`seg-${seg.spanId}-${i}`}>
              {hovered && (
                <line
                  x1={seg.left}
                  y1={seg.y}
                  x2={seg.right}
                  y2={seg.y}
                  stroke={seg.color}
                  strokeWidth={STROKE_WIDTH + 8}
                  strokeLinecap="round"
                  opacity={0.25}
                  style={{ pointerEvents: "none" }}
                />
              )}
              {pulsing && (
                <line
                  x1={seg.left}
                  y1={seg.y}
                  x2={seg.right}
                  y2={seg.y}
                  stroke={seg.color}
                  strokeWidth={STROKE_WIDTH + 8}
                  strokeLinecap="round"
                  opacity={0.35}
                  style={{
                    pointerEvents: "none",
                    animation: "spanPulse 1.2s ease-out",
                  }}
                />
              )}
              {!seg.isDraft && (
                <line
                  x1={seg.left}
                  y1={seg.y}
                  x2={seg.right}
                  y2={seg.y}
                  stroke="transparent"
                  strokeWidth={HIT_STROKE_WIDTH}
                  strokeLinecap="round"
                  data-stroke-span={seg.spanId}
                  style={{ pointerEvents: "stroke", cursor: "pointer" }}
                />
              )}
              <line
                x1={seg.left}
                y1={seg.y}
                x2={seg.right}
                y2={seg.y}
                stroke={seg.color}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                opacity={opacity}
                style={{ pointerEvents: "none" }}
              />
              {seg.isFirst && seg.optionLabel && !seg.isDraft && (
                <text
                  x={seg.left + 8}
                  y={seg.y - STROKE_WIDTH / 2 - 2}
                  fontSize={10}
                  fontWeight={600}
                  fill={seg.color}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                  opacity={opacity}
                >
                  {seg.optionLabel}
                </text>
              )}
            </g>
          );
        })}

        {[...segmentsBySpan.entries()].map(([spanId, segs]) => {
          if (segs.length === 0 || segs[0].isDraft) return null;
          const first = segs[0];
          const last = segs[segs.length - 1];
          const isEditing = editing?.spanId === spanId;
          return (
            <g key={`handles-${spanId}`}>
              {(["start", "end"] as const).map((endpoint) => {
                const pt =
                  endpoint === "start"
                    ? { x: first.left, y: first.y }
                    : { x: last.right, y: last.y };
                const dragging =
                  isEditing && editing?.endpoint === endpoint;
                return (
                  <g key={endpoint}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={HANDLE_HIT_RADIUS}
                      fill="transparent"
                      data-handle-span={spanId}
                      data-handle-end={endpoint}
                      style={{
                        pointerEvents: "all",
                        cursor: "ew-resize",
                      }}
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={dragging ? HANDLE_RADIUS + 1 : HANDLE_RADIUS}
                      fill="white"
                      stroke={first.color}
                      strokeWidth={2}
                      style={{ pointerEvents: "none" }}
                    />
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      <Popover
        open={popoverAt !== null}
        onOpenChange={(open) => {
          if (!open) setPopoverAt(null);
        }}
      >
        {anchorVirtual && (
          <PopoverAnchor
            virtualRef={{ current: anchorVirtual as unknown as HTMLElement }}
          />
        )}
        <PopoverContent
          align="center"
          className="w-auto border-0 bg-transparent p-0 shadow-none"
        >
          <div
            className="flex flex-col items-center gap-1.5"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {popoverSpans.map((sp) => (
              <SpanPopover
                key={sp.id}
                span={sp}
                types={types}
                tokens={tokens}
                onChangeValue={(value) => onUpdateSpan(sp.id, { value })}
                onChangeOption={(optionId) => {
                  if (optionId === sp.optionId) return;
                  const overlapping = spans.filter(
                    (s) =>
                      s.id !== sp.id &&
                      s.typeId === sp.typeId &&
                      s.optionId === optionId &&
                      !(s.endWord < sp.startWord || s.startWord > sp.endWord),
                  );
                  if (overlapping.length === 0) {
                    onUpdateSpan(sp.id, { optionId });
                    return;
                  }
                  const unionStart = Math.min(
                    sp.startWord,
                    ...overlapping.map((s) => s.startWord),
                  );
                  const unionEnd = Math.max(
                    sp.endWord,
                    ...overlapping.map((s) => s.endWord),
                  );
                  onUpdateSpan(sp.id, {
                    optionId,
                    startWord: unionStart,
                    endWord: unionEnd,
                  });
                  for (const other of overlapping) onRemoveSpan(other.id);
                  setPopoverAt((prev) => {
                    if (!prev) return null;
                    const removedIds = new Set(overlapping.map((o) => o.id));
                    const remaining = prev.spanIds.filter(
                      (id) => !removedIds.has(id),
                    );
                    return remaining.length === 0
                      ? null
                      : { ...prev, spanIds: remaining };
                  });
                }}
                onChangeType={(typeId) => {
                  if (typeId === sp.typeId) return;
                  const newType = typeMap.get(typeId);
                  const newOptionId =
                    newType?.options && newType.options.length > 0
                      ? newType.options[0].id
                      : undefined;
                  const overlapping = spans.filter(
                    (s) =>
                      s.id !== sp.id &&
                      s.typeId === typeId &&
                      s.optionId === newOptionId &&
                      !(s.endWord < sp.startWord || s.startWord > sp.endWord),
                  );
                  const unionStart = Math.min(
                    sp.startWord,
                    ...overlapping.map((s) => s.startWord),
                  );
                  const unionEnd = Math.max(
                    sp.endWord,
                    ...overlapping.map((s) => s.endWord),
                  );
                  const patch: Partial<SpanAnnotation> = {
                    typeId,
                    startWord: unionStart,
                    endWord: unionEnd,
                  };
                  patch.value = newType?.range ? newType.range.min : undefined;
                  patch.optionId =
                    newType?.options && newType.options.length > 0
                      ? newType.options[0].id
                      : undefined;
                  onUpdateSpan(sp.id, patch);
                  for (const other of overlapping) onRemoveSpan(other.id);
                  if (overlapping.length > 0) {
                    setPopoverAt((prev) => {
                      if (!prev) return null;
                      const removedIds = new Set(overlapping.map((o) => o.id));
                      const remaining = prev.spanIds.filter(
                        (id) => !removedIds.has(id),
                      );
                      return remaining.length === 0
                        ? null
                        : { ...prev, spanIds: remaining };
                    });
                  }
                }}
                onDelete={() => {
                  onRemoveSpan(sp.id);
                  setPopoverAt((prev) => {
                    if (!prev) return null;
                    const remaining = prev.spanIds.filter((id) => id !== sp.id);
                    return remaining.length === 0
                      ? null
                      : { ...prev, spanIds: remaining };
                  });
                }}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
