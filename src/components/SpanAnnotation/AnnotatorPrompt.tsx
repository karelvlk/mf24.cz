import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormEvent, useState } from "react";

interface AnnotatorPromptProps {
  onSubmit: (annotator: string) => void;
}

export default function AnnotatorPrompt({ onSubmit }: AnnotatorPromptProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="flex w-[420px] flex-col gap-4 rounded-lg border border-border bg-background p-6 shadow-xl"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground">
            Anotace článků
          </h2>
          <p className="text-sm text-muted-foreground">
            Zadejte jméno anotátora. Bude přidáno do URL a použito pro ukládání
            postupu.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="annotator-name">Jméno anotátora</Label>
          <Input
            id="annotator-name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="např. karel"
            autoFocus
          />
        </div>
        <Button type="submit" disabled={value.trim().length === 0}>
          Pokračovat
        </Button>
      </form>
    </div>
  );
}
