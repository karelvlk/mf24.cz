import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AnnotationType } from "@/lib/spanAnnotation";
import { Check, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import TypeFormPopover from "./TypeFormPopover";

interface AnnotateToolbarProps {
  types: AnnotationType[];
  activeTypeId: string | null;
  onActivate: (id: string | null) => void;
  onAddType: (next: AnnotationType) => void;
  onUpdateType: (id: string, patch: Partial<AnnotationType>) => void;
  onRemoveType: (id: string) => void;
  saveStatus: "idle" | "saving" | "saved";
}

export default function AnnotateToolbar({
  types,
  activeTypeId,
  onActivate,
  onAddType,
  onUpdateType,
  onRemoveType,
  saveStatus,
}: AnnotateToolbarProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const statusLabel =
    saveStatus === "saving"
      ? "Ukládám…"
      : saveStatus === "saved"
        ? "Uloženo"
        : "";

  return (
    <div className="flex items-center gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
        Typy
      </span>

      <div className="flex flex-wrap items-stretch gap-1">
        {types.map((type) => {
          const isActive = type.id === activeTypeId;
          return (
            <div
              key={type.id}
              className={
                "group flex items-center overflow-hidden rounded-sm border transition-colors " +
                (isActive
                  ? "border-primary bg-white shadow-sm ring-1 ring-primary"
                  : "border-zinc-200 bg-white hover:border-zinc-400")
              }
            >
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
                {isActive && (
                  <span className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-2.5 w-2.5" />
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

        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 rounded-sm border border-dashed border-zinc-400 bg-white px-2 py-1 text-sm font-medium text-zinc-600 hover:border-primary hover:text-primary"
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
                onAddType(next);
                setAddOpen(false);
                onActivate(next.id);
              }}
              onCancel={() => setAddOpen(false)}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="ml-auto flex items-center gap-3 text-[11px] text-zinc-500">
        {activeTypeId && (
          <span className="hidden md:inline">
            Dvojklik = začátek, pohyb = rozšíř, klik = potvrď. ESC zruší.
          </span>
        )}
        {statusLabel && (
          <span className="rounded bg-zinc-200/70 px-1.5 py-0.5 text-zinc-700">
            {statusLabel}
          </span>
        )}
      </div>
    </div>
  );
}
