import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AnnotationType } from "@/lib/spanAnnotation";
import { Check, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import TypeFormPopover from "./TypeFormPopover";

interface TypeToolbarProps {
  types: AnnotationType[];
  activeTypeId: string | null;
  onActivate: (id: string | null) => void;
  onAddType: (next: AnnotationType) => void;
  onUpdateType: (id: string, patch: Partial<AnnotationType>) => void;
  onRemoveType: (id: string) => void;
}

export default function TypeToolbar({
  types,
  activeTypeId,
  onActivate,
  onAddType,
  onUpdateType,
  onRemoveType,
}: TypeToolbarProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="rounded-md border border-zinc-300 bg-zinc-100 shadow-sm">
      <div className="flex items-center gap-3 border-b border-zinc-200 bg-white/60 px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
          Anotace
        </span>
        <span className="text-[11px] text-zinc-500">
          {activeTypeId
            ? "Dvojklik = začátek anotace, pohyb myší rozšiř, klik = potvrď. ESC zruší."
            : types.length === 0
              ? "Vytvořte první typ anotace tlačítkem +"
              : "Klikněte na typ pro aktivaci"}
        </span>
      </div>

      <div className="flex flex-wrap items-stretch gap-1 p-2">
        {types.map((type) => {
          const isActive = type.id === activeTypeId;
          return (
            <div
              key={type.id}
              className={
                "group relative flex items-center overflow-hidden rounded-sm border transition-colors " +
                (isActive
                  ? "border-primary bg-white shadow-sm ring-1 ring-primary"
                  : "border-zinc-200 bg-white hover:border-zinc-400")
              }
            >
              <button
                type="button"
                onClick={() => onActivate(isActive ? null : type.id)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-left"
                title={
                  type.range
                    ? `${type.name} (rozsah ${type.range.min}–${type.range.max})`
                    : type.name
                }
              >
                <span
                  className="inline-block h-3.5 w-3.5 rounded-sm border border-black/10"
                  style={{ backgroundColor: type.color }}
                  aria-hidden
                />
                <span className="text-sm font-medium text-zinc-800">
                  {type.name}
                </span>
                {type.range && (
                  <span className="rounded-sm bg-zinc-100 px-1 text-[10px] font-medium text-zinc-600">
                    {type.range.min}–{type.range.max}
                  </span>
                )}
                {isActive && (
                  <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>

              <Popover
                open={editingId === type.id}
                onOpenChange={(open) => setEditingId(open ? type.id : null)}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-center border-l border-zinc-200 px-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                    aria-label={`Upravit anotaci ${type.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-2">
                  <TypeFormPopover
                    initial={type}
                    existingTypeCount={types.length}
                    onSave={(next) => {
                      onUpdateType(type.id, next);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                    onDelete={
                      type.source === "seed"
                        ? undefined
                        : () => {
                            onRemoveType(type.id);
                            setEditingId(null);
                            if (activeTypeId === type.id) onActivate(null);
                          }
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          );
        })}

        {types.length > 0 && (
          <span className="mx-1 self-stretch border-l border-zinc-300" />
        )}

        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-sm border border-dashed border-zinc-400 bg-white px-2.5 py-1.5 text-sm font-medium text-zinc-600 hover:border-primary hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              Nová anotace
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-2">
            <TypeFormPopover
              existingTypeCount={types.length}
              onSave={(next) => {
                onAddType(next);
                setAddOpen(false);
                onActivate(next.id);
              }}
              onCancel={() => setAddOpen(false)}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
