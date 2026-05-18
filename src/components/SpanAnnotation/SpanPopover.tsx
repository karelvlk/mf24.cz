import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AnnotationType, SpanAnnotation, Token } from "@/lib/spanAnnotation";
import { getSpanSnippet } from "@/lib/spanAnnotation";
import { Check, Trash2 } from "lucide-react";
import { ReactNode } from "react";

function Hint({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

interface SpanPopoverProps {
  span: SpanAnnotation;
  types: AnnotationType[];
  tokens: Token[];
  onChangeValue: (value: number) => void;
  onChangeType: (typeId: string) => void;
  onDelete: () => void;
}

export default function SpanPopover({
  span,
  types,
  tokens,
  onChangeValue,
  onChangeType,
  onDelete,
}: SpanPopoverProps) {
  const type = types.find((t) => t.id === span.typeId) ?? null;
  if (!type) return null;

  const range = type.range;
  const currentValue = span.value ?? range?.min;
  const valueOptions: number[] = range
    ? Array.from(
        { length: Math.floor((range.max - range.min) / range.step) + 1 },
        (_, i) => range.min + i * range.step,
      )
    : [];

  const snippet = getSpanSnippet(span, tokens, 6);

  return (
    <div
      className="flex flex-col items-center gap-0.5"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="max-w-[280px] truncate rounded bg-zinc-900/85 px-1.5 py-0.5 text-[10px] font-medium text-white shadow">
        {snippet}
      </span>
      <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-lg">
      <div className="flex items-center gap-0.5 px-1">
        {types.map((t) => {
          const active = t.id === span.typeId;
          return (
            <Hint
              key={t.id}
              label={active ? `${t.name} (aktivní)` : `Změnit typ: ${t.name}`}
            >
              <button
                type="button"
                onClick={() => onChangeType(t.id)}
                className={
                  "relative inline-flex h-7 w-7 items-center justify-center rounded-full border-2 transition-transform " +
                  (active
                    ? "scale-110 border-zinc-900"
                    : "border-transparent hover:scale-110")
                }
              >
                <span
                  className="inline-block h-5 w-5 rounded-full border border-black/10"
                  style={{ backgroundColor: t.color }}
                  aria-hidden
                />
                {active && (
                  <Check className="absolute h-3 w-3 text-white drop-shadow" />
                )}
              </button>
            </Hint>
          );
        })}
      </div>

      {range && (
        <>
          <span className="h-6 w-px bg-zinc-200" />
          <div className="flex items-center gap-0.5 px-1">
            {valueOptions.map((v) => {
              const active = v === currentValue;
              const isMin = v === range.min;
              const isMax = v === range.max;
              const labelLow = range.lowLabel ?? `min (${range.min})`;
              const labelHigh = range.highLabel ?? `max (${range.max})`;
              const hint = isMin
                ? `${v} — ${labelLow}`
                : isMax
                  ? `${v} — ${labelHigh}`
                  : `Hodnota ${v}`;
              return (
                <Hint key={v} label={hint}>
                  <button
                    type="button"
                    onClick={() => onChangeValue(v)}
                    className={
                      "inline-flex h-7 min-w-[28px] items-center justify-center rounded-full px-2 text-xs font-semibold transition-colors " +
                      (active
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-600 hover:bg-zinc-100")
                    }
                  >
                    {v}
                  </button>
                </Hint>
              );
            })}
          </div>
        </>
      )}

      <span className="h-6 w-px bg-zinc-200" />
      <Hint label="Smazat anotaci">
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 hover:bg-destructive/10 hover:text-destructive"
          aria-label="Smazat anotaci"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </Hint>
      </div>
    </div>
  );
}
