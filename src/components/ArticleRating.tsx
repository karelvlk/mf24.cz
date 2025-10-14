import ReadingCheck from "@/components/ReadingCheck";
import { Button } from "@/components/ui/button";
import type { QA } from "@/data/news";
import { useCallback, useState } from "react";

interface ArticleRatingProps {
  articleId?: string;
  onRatingChange?: (rating: "credible" | "not-credible" | "unsure") => void;
  questions?: QA[];
  showRating?: boolean;
}

export default function ArticleRating({
  articleId,
  onRatingChange,
  questions,
  showRating = true
}: ArticleRatingProps) {
  const [selectedRating, setSelectedRating] = useState<string | null>(null);
  const hasQuestions = Array.isArray(questions) && questions.length > 0;

  if (!showRating && !hasQuestions) {
    return null;
  }

  const handleRating = useCallback(
    (rating: "credible" | "not-credible" | "unsure") => {
      setSelectedRating(rating);
      onRatingChange?.(rating);
      console.log(`Article ${articleId} rated as: ${rating}`);
    },
    [articleId, onRatingChange]
  );

  return (
    <div className="w-full rounded-lg border border-separator/50 bg-muted/20 px-4 py-3 md:px-5 md:py-4">
      {showRating && (
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 md:min-w-[220px]">
            <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
            <span className="text-sm font-medium text-foreground">
              Ohodnoťte věrohodnost článku
            </span>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            <Button
              variant={selectedRating === "credible" ? "default" : "outline"}
              size="sm"
              className="h-8 min-w-[96px] px-3 text-xs font-medium"
              onClick={() => handleRating("credible")}
            >
              ✓ Věřím
            </Button>
            <Button
              variant={selectedRating === "not-credible" ? "default" : "outline"}
              size="sm"
              className="h-8 min-w-[96px] px-3 text-xs font-medium"
              onClick={() => handleRating("not-credible")}
            >
              ✗ Nevěřím
            </Button>
            <Button
              variant={selectedRating === "unsure" ? "default" : "outline"}
              size="sm"
              className="h-8 min-w-[96px] px-3 text-xs font-medium"
              onClick={() => handleRating("unsure")}
            >
              ? Nejsem si jistý
            </Button>
          </div>
        </div>
      )}

      {hasQuestions && (
        <div className={showRating ? "border-t border-separator/40 pt-3" : undefined}>
          <div className="flex items-center gap-2">
            {!showRating && (
              <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
            )}
          </div>
          <ReadingCheck questions={questions} variant="embedded" />
        </div>
      )}
    </div>
  );
}
