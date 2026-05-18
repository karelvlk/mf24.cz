import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AnnotationType } from "@/lib/spanAnnotation";
import { autoPickColor, generateId } from "@/lib/spanAnnotation";
import { useEffect, useState } from "react";

interface TypeFormPopoverProps {
  initial?: AnnotationType;
  existingTypeCount: number;
  onSave: (next: AnnotationType) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function TypeFormPopover({
  initial,
  existingTypeCount,
  onSave,
  onCancel,
  onDelete,
}: TypeFormPopoverProps) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? autoPickColor(existingTypeCount));
  const [hasRange, setHasRange] = useState(Boolean(initial?.range));
  const [min, setMin] = useState(initial?.range?.min ?? 1);
  const [max, setMax] = useState(initial?.range?.max ?? 5);
  const [step, setStep] = useState(initial?.range?.step ?? 1);
  const [lowLabel, setLowLabel] = useState(initial?.range?.lowLabel ?? "");
  const [highLabel, setHighLabel] = useState(initial?.range?.highLabel ?? "");

  useEffect(() => {
    if (!initial) {
      setColor(autoPickColor(existingTypeCount));
    }
  }, [existingTypeCount, initial]);

  const trimmedName = name.trim();
  const canSave =
    trimmedName.length > 0 &&
    (!hasRange || (max > min && step > 0));

  const handleSave = () => {
    if (!canSave) return;
    const next: AnnotationType = {
      id: initial?.id ?? generateId(),
      name: trimmedName,
      color,
      source: initial?.source ?? "user",
      range: hasRange
        ? {
            min,
            max,
            step,
            lowLabel: lowLabel.trim() || undefined,
            highLabel: highLabel.trim() || undefined,
          }
        : undefined,
    };
    onSave(next);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="span-type-name" className="text-xs">Název</Label>
        <Input
          id="span-type-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="např. zaujatost"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="span-type-color" className="text-xs">Barva</Label>
        <div className="flex items-center gap-2">
          <input
            id="span-type-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent"
          />
          <Input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="font-mono text-xs"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="span-type-has-range" className="text-xs">Rozsah hodnot</Label>
        <Switch
          id="span-type-has-range"
          checked={hasRange}
          onCheckedChange={setHasRange}
        />
      </div>

      {hasRange && (
        <div className="space-y-2 rounded-md border border-border bg-muted/20 p-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="span-type-min" className="text-xs">Min</Label>
              <Input
                id="span-type-min"
                type="number"
                value={min}
                onChange={(e) => setMin(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="span-type-max" className="text-xs">Max</Label>
              <Input
                id="span-type-max"
                type="number"
                value={max}
                onChange={(e) => setMax(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="span-type-step" className="text-xs">Krok</Label>
              <Input
                id="span-type-step"
                type="number"
                value={step}
                onChange={(e) => setStep(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="span-type-low-label" className="text-xs">Popisek nízký</Label>
              <Input
                id="span-type-low-label"
                value={lowLabel}
                onChange={(e) => setLowLabel(e.target.value)}
                placeholder="světlý odstín"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="span-type-high-label" className="text-xs">Popisek vysoký</Label>
              <Input
                id="span-type-high-label"
                value={highLabel}
                onChange={(e) => setHighLabel(e.target.value)}
                placeholder="sytý odstín"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        {isEdit && onDelete && initial?.source !== "seed" ? (
          <Button variant="destructive" size="sm" onClick={onDelete}>
            Smazat
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Zrušit
          </Button>
          <Button size="sm" disabled={!canSave} onClick={handleSave}>
            Uložit
          </Button>
        </div>
      </div>
    </div>
  );
}
