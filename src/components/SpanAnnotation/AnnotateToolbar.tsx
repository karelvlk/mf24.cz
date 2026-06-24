import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AnnotationType } from "@/lib/spanAnnotation";
import { shadeColorByOption } from "@/lib/spanAnnotation";
import { Check, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import TypeFormPopover from "./TypeFormPopover";

interface AnnotateToolbarProps {
  types: AnnotationType[];
  activeTypeId: string | null;
  activeOptionId: string | null;
  onActivate: (id: string | null) => void;
  onActivateOption: (id: string | null) => void;
  onAddType: (next: AnnotationType) => void;
  onUpdateType: (id: string, patch: Partial<AnnotationType>) => void;
  onRemoveType: (id: string) => void;
  saveStatus: "saved" | "saving" | "unsaved" | "error";
  granularity: "word" | "char";
  onGranularityChange: (g: "word" | "char") => void;
}

const STATUS_UI: Record<
  AnnotateToolbarProps["saveStatus"],
  { label: string; className: string }
> = {
  saved: { label: "Uloženo", className: "bg-emerald-100 text-emerald-700" },
  saving: { label: "Ukládám…", className: "bg-zinc-200/70 text-zinc-700" },
  unsaved: { label: "Neuloženo", className: "bg-amber-100 text-amber-800" },
  error: {
    label: "Chyba ukládání — opakuji",
    className: "bg-red-100 text-red-700",
  },
};

export default function AnnotateToolbar({
  types,
  activeTypeId,
  activeOptionId,
  onActivate,
  onActivateOption,
  onAddType,
  onUpdateType,
  onRemoveType,
  saveStatus,
  granularity,
  onGranularityChange,
}: AnnotateToolbarProps) {
  const activeType = types.find((t) => t.id === activeTypeId) ?? null;
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const statusUi = STATUS_UI[saveStatus];

  return (
    <div className="flex flex-col border-b border-zinc-200 bg-zinc-50">
    <div className="flex items-center gap-3 px-4 py-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
        Typy
      </span>

      <div className="flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto whitespace-nowrap">
        {types.map((type) => {
          const isActive = type.id === activeTypeId;
          const chipButton = (
            <button
              type="button"
              onClick={() => onActivate(isActive ? null : type.id)}
              className="flex items-center gap-1.5 px-2 py-1 text-left"
            >
              <span
                className="inline-block h-3 w-3 rounded-sm border border-black/10"
                style={{ backgroundColor: type.color }}
                aria-hidden
              />
              <span className="text-sm font-medium text-zinc-800">
                {type.name}
              </span>
              {type.options && type.options.length > 0 && (
                <span className="rounded bg-zinc-100 px-1 text-[10px] text-zinc-600">
                  {type.options.length}
                </span>
              )}
              {isActive && (
                <span className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-2.5 w-2.5" />
                </span>
              )}
            </button>
          );
          return (
            <div
              key={type.id}
              className={
                "group flex shrink-0 items-center overflow-hidden rounded-sm border transition-colors " +
                (isActive
                  ? "border-primary bg-white shadow-sm ring-1 ring-primary"
                  : "border-zinc-200 bg-white hover:border-zinc-400")
              }
            >
              {type.hint ? (
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>{chipButton}</TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    {type.hint}
                  </TooltipContent>
                </Tooltip>
              ) : (
                chipButton
              )}
              {!type.locked && (
                <Popover
                  open={editingId === type.id}
                  onOpenChange={(open) => setEditingId(open ? type.id : null)}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center justify-center border-l border-zinc-200 px-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                      aria-label={`Upravit ${type.name}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="z-[60] w-80 border border-zinc-200 bg-white p-3 shadow-xl"
                  >
                    <TypeFormPopover
                      initial={type}
                      existingTypeCount={types.length}
                      onSave={(next) => {
                        onUpdateType(type.id, next);
                        setEditingId(null);
                      }}
                      onCancel={() => setEditingId(null)}
                      onDelete={() => {
                        onRemoveType(type.id);
                        setEditingId(null);
                        if (activeTypeId === type.id) onActivate(null);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          );
        })}

        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex shrink-0 items-center gap-1 rounded-sm border border-dashed border-zinc-400 bg-white px-2 py-1 text-sm font-medium text-zinc-600 hover:border-primary hover:text-primary"
            >
              <Plus className="h-3 w-3" />
              Nový typ
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="z-[60] w-80 border border-zinc-200 bg-white p-3 shadow-xl"
          >
            <TypeFormPopover
              existingTypeCount={types.length}
              onSave={(next) => {
                onAddType({ ...next, category: "custom" });
                setAddOpen(false);
                onActivate(next.id);
              }}
              onCancel={() => setAddOpen(false)}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="ml-auto flex items-center gap-3 text-[11px] text-zinc-500">
        <div className="inline-flex shrink-0 overflow-hidden rounded-sm border border-zinc-300">
          {(["word", "char"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onGranularityChange(g)}
              className={
                "px-2 py-0.5 text-[11px] font-medium transition-colors " +
                (granularity === g
                  ? "bg-primary text-primary-foreground"
                  : "bg-white text-zinc-600 hover:bg-zinc-100")
              }
              aria-pressed={granularity === g}
            >
              {g === "word" ? "Slova" : "Znaky"}
            </button>
          ))}
        </div>
        {activeTypeId && (
          <span className="hidden md:inline">
            {granularity === "char"
              ? "Označte text myší = vytvoří span. ESC zruší."
              : "Dvojklik = začátek, pohyb = rozšíř, klik = potvrď. ESC zruší."}
          </span>
        )}
        <span
          className={
            "inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium " +
            statusUi.className
          }
        >
          {saveStatus === "saving" && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          )}
          {statusUi.label}
        </span>
      </div>
    </div>

    {activeType && activeType.options && activeType.options.length > 0 && (
      <div className="flex items-center gap-2 border-t border-zinc-200/70 bg-white px-4 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
          Varianta
        </span>
        <div className="flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto whitespace-nowrap">
          {activeType.options.map((opt) => {
            const active = opt.id === activeOptionId;
            const shade = shadeColorByOption(
              activeType.color,
              opt.id,
              activeType.options,
            );
            return (
              <Tooltip key={opt.id} delayDuration={200}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() =>
                      onActivateOption(active ? null : opt.id)
                    }
                    className={
                      "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition-colors " +
                      (active
                        ? "text-white"
                        : "text-zinc-700 hover:bg-zinc-100")
                    }
                    style={
                      active ? { backgroundColor: shade } : undefined
                    }
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm border border-black/10"
                      style={{ backgroundColor: shade }}
                      aria-hidden
                    />
                    {opt.label}
                  </button>
                </TooltipTrigger>
                {opt.hint && (
                  <TooltipContent side="bottom" className="max-w-xs">
                    {opt.hint}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
      </div>
    )}
    </div>
  );
}
