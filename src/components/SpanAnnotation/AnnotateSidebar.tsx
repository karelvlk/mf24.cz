import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { AnnotateAnswers } from "@/hooks/useAnnotateDraft";
import type {
  AnnotationStats,
  AnnotationType,
  SpanAnnotation,
  Token,
} from "@/lib/spanAnnotation";
import { getSpanSnippet, shadeColor, shadeColorByOption } from "@/lib/spanAnnotation";
import { Trash2 } from "lucide-react";
import { useMemo } from "react";

interface AnnotateSidebarProps {
  spans: SpanAnnotation[];
  types: AnnotationType[];
  tokens: Token[];
  stats: AnnotationStats;
  answers: AnnotateAnswers;
  onAnswersChange: (patch: Partial<AnnotateAnswers>) => void;
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: () => void;
  onJumpToSpan: (spanId: string) => void;
  onRemoveSpan: (spanId: string) => void;
}

export default function AnnotateSidebar({
  spans,
  types,
  tokens,
  stats,
  answers,
  onAnswersChange,
  canSubmit,
  submitting,
  onSubmit,
  onJumpToSpan,
  onRemoveSpan,
}: AnnotateSidebarProps) {
  const typeMap = useMemo(() => {
    const m = new Map<string, AnnotationType>();
    types.forEach((t) => m.set(t.id, t));
    return m;
  }, [types]);

  const spansByType = useMemo(() => {
    const m = new Map<string, SpanAnnotation[]>();
    for (const s of spans) {
      const arr = m.get(s.typeId) ?? [];
      arr.push(s);
      m.set(s.typeId, arr);
    }
    m.forEach((arr) => arr.sort((a, b) => a.startWord - b.startWord));
    return m;
  }, [spans]);

  const visibleTypes = types.filter((t) => (spansByType.get(t.id)?.length ?? 0) > 0);

  return (
    <aside className="flex h-full w-80 flex-col border-l border-zinc-200 bg-zinc-50">
      <div className="border-b border-zinc-200 p-3">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
          Statistiky
        </h3>
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md bg-white p-2 shadow-sm">
            <dt className="text-zinc-500">Anotací</dt>
            <dd className="text-base font-semibold text-foreground">
              {stats.totalSpans}
            </dd>
          </div>
          <div className="rounded-md bg-white p-2 shadow-sm">
            <dt className="text-zinc-500">Pokryto</dt>
            <dd className="text-base font-semibold text-foreground">
              {stats.coveragePct.toFixed(1)}%
            </dd>
          </div>
          <div className="col-span-2 rounded-md bg-white p-2 shadow-sm">
            <dt className="text-zinc-500">Slov / celkem</dt>
            <dd className="text-base font-semibold text-foreground">
              {stats.totalCoveredWords} / {stats.totalWords}
            </dd>
          </div>
        </dl>
      </div>

      <div className="border-b border-zinc-200 p-3">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
          Hodnocení článku
        </h3>
        <div className="flex flex-col gap-4">
          <SidebarScale
            label="Zavádějící?"
            low="Věrohodný"
            high="Zavádějící"
            value={answers.credibility}
            onChange={(v) => onAnswersChange({ credibility: v })}
          />
          <SidebarScale
            label="Manipulativní?"
            low="Ne"
            high="Ano"
            value={answers.manipulativeness}
            onChange={(v) => onAnswersChange({ manipulativeness: v })}
          />
          <Button
            onClick={onSubmit}
            disabled={!canSubmit || submitting}
            className="w-full"
            size="sm"
          >
            {submitting ? "Odesílám…" : "Odeslat a další článek"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
          Anotace podle typu
        </h3>
        {visibleTypes.length === 0 && (
          <p className="text-xs text-zinc-500">Žádné anotace zatím nejsou.</p>
        )}
        <div className="flex flex-col gap-3">
          {visibleTypes.map((type) => {
            const list = spansByType.get(type.id) ?? [];
            return (
              <div key={type.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-sm border border-black/10"
                    style={{ backgroundColor: type.color }}
                    aria-hidden
                  />
                  <span className="text-sm font-medium text-foreground">
                    {type.name}
                  </span>
                  <span className="ml-auto rounded bg-zinc-200/70 px-1.5 py-0.5 text-[10px] text-zinc-700">
                    {list.length}
                  </span>
                </div>
                <ul className="flex flex-col gap-1">
                  {list.map((span) => {
                    const color =
                      type.options && type.options.length > 0
                        ? shadeColorByOption(type.color, span.optionId, type.options)
                        : type.range
                          ? shadeColor(type.color, span.value, type.range)
                          : type.color;
                    const optionLabel =
                      type.options && span.optionId
                        ? type.options.find((o) => o.id === span.optionId)?.label
                        : undefined;
                    const snippet = getSpanSnippet(span, tokens);
                    return (
                      <li key={span.id} className="group flex items-stretch gap-1">
                        <button
                          type="button"
                          onClick={() => onJumpToSpan(span.id)}
                          className="flex flex-1 items-start gap-2 rounded border border-zinc-200 bg-white px-2 py-1.5 text-left text-xs hover:border-primary"
                        >
                          <span
                            className="mt-1 inline-block h-2 w-2 shrink-0 rounded-sm"
                            style={{ backgroundColor: color }}
                            aria-hidden
                          />
                          <span className="flex-1 text-zinc-700">
                            {optionLabel && (
                              <span
                                className="mr-1 rounded px-1 text-[10px] font-semibold text-white"
                                style={{ backgroundColor: color }}
                              >
                                {optionLabel}
                              </span>
                            )}
                            {snippet}
                            {type.range && span.value !== undefined && (
                              <span className="ml-1 rounded bg-zinc-100 px-1 text-[10px] text-zinc-600">
                                {span.value}
                              </span>
                            )}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveSpan(span.id)}
                          className="rounded border border-zinc-200 bg-white px-1.5 text-zinc-400 opacity-0 transition-opacity hover:border-destructive hover:text-destructive group-hover:opacity-100"
                          aria-label="Smazat anotaci"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function SidebarScale({
  label,
  low,
  high,
  value,
  onChange,
}: {
  label: string;
  low: string;
  high: string;
  value?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <Slider
        min={1}
        max={5}
        step={1}
        value={[value ?? 3]}
        onValueChange={(vals) => onChange(vals[0])}
      />
      <div className="flex items-center justify-between text-[10px] text-zinc-500">
        <span>{low}</span>
        <span className="font-semibold text-foreground">
          {value === undefined ? "—" : value}
        </span>
        <span>{high}</span>
      </div>
    </div>
  );
}
