import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

export const RATING_SHORTCUTS = [
  { key: "1", rating: "credible" as const },
  { key: "2", rating: "not-credible" as const },
  { key: "3", rating: "unsure" as const }
] as const;

export const RATING_LABELS: Record<
  (typeof RATING_SHORTCUTS)[number]["rating"],
  string
> = {
  credible: "Věřím",
  "not-credible": "Nevěřím",
  unsure: "Nejsem si jistý"
};

const KEYCAP_CLASS =
  "rounded-md border border-border bg-muted/40 px-1.5 py-[2px] text-[11px] font-semibold uppercase tracking-wide text-foreground shadow-sm";

interface ArticleRatingProps {
  articleId?: string;
  onRatingChange?: (rating: "credible" | "not-credible" | "unsure") => void;
  showRating?: boolean;
  active?: boolean;
}

export default function ArticleRating({
  articleId,
  onRatingChange,
  showRating = true,
  active = false
}: ArticleRatingProps) {
  const [selectedRating, setSelectedRating] = useState<string | null>(null);
  const answerKeys = useMemo(
    () => RATING_SHORTCUTS.map((shortcut) => shortcut.key),
    []
  );

  const handleRating = useCallback(
    (rating: "credible" | "not-credible" | "unsure") => {
      setSelectedRating(rating);
      onRatingChange?.(rating);
      console.log(`Article ${articleId} rated as: ${rating}`);
    },
    [articleId, onRatingChange]
  );

  useEffect(() => {
    setSelectedRating(null);
  }, [showRating]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const pressedKey = event.key.toLowerCase();
      const shortcut = RATING_SHORTCUTS.find((item) => item.key === pressedKey);

      if (!shortcut) {
        return;
      }

      event.preventDefault();
      handleRating(shortcut.rating);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, handleRating]);

  if (!showRating) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 rounded-lg border border-separator/40 bg-white/80 px-5 py-4 md:px-8 md:py-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <span>Hodnocení</span>
          <div className="flex items-center gap-1 text-[11px] font-medium normal-case">
            <span>Zvolte klávesu</span>
            <div className="flex items-center gap-1">
              {answerKeys.map((key) => (
                <kbd key={`rating-key-${key}`} className={KEYCAP_CLASS}>
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        </div>
        <p className="text-base font-semibold text-foreground md:text-lg">
          Ohodnoťte věrohodnost článku
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {RATING_SHORTCUTS.map(({ rating, key }) => {
          const isSelected = selectedRating === rating;
          const variant: "default" | "outline" = isSelected ? "default" : "outline";

          return (
            <Button
              key={`rating-${rating}`}
              variant={variant}
              size="lg"
              className={cn(
                "h-auto min-h-[48px] justify-start gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium md:px-5 md:py-4 md:text-base",
                isSelected && "ring-2 ring-offset-2"
              )}
              onClick={() => handleRating(rating)}
            >
              <kbd className="rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold uppercase text-foreground shadow-sm">
                {key}
              </kbd>
              <span>{RATING_LABELS[rating]}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
