import ReadingCheck from "@/components/ReadingCheck";
import { Button } from "@/components/ui/button";
import type { QA } from "@/data/news";
import { useCallback, useEffect, useState } from "react";

interface ArticleRatingProps {
  articleId?: string;
  onRatingChange?: (rating: "credible" | "not-credible" | "unsure") => void;
  questions?: QA[];
  showRating?: boolean;
  onQuestionsCompletionChange?: (completed: boolean) => void;
}

export default function ArticleRating({
  articleId,
  onRatingChange,
  questions,
  showRating = true,
  onQuestionsCompletionChange,
}: ArticleRatingProps) {
  const [selectedRating, setSelectedRating] = useState<string | null>(null);
  const hasQuestions = Array.isArray(questions) && questions.length > 0;

  const handleCompletionChange = useCallback(
    (completed: boolean) => {
      onQuestionsCompletionChange?.(completed);
    },
    [onQuestionsCompletionChange]
  );

  useEffect(() => {
    if (!hasQuestions) {
      onQuestionsCompletionChange?.(true);
    }
  }, [hasQuestions, onQuestionsCompletionChange]);

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
    <div className="flex h-full w-full flex-col gap-4 rounded-lg border border-separator/40 bg-white/80 px-5 py-4 md:px-8 md:py-6">
      {showRating && (
        <div className="flex flex-col gap-4 rounded-xl bg-white/70 px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between md:gap-6 md:px-6">
          <div className="flex items-center gap-3 md:min-w-[240px]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              ✓
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Hodnocení
              </span>
              <span className="text-base font-medium text-foreground">
                Ohodnoťte věrohodnost článku
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            <Button
              variant={selectedRating === "credible" ? "default" : "outline"}
              size="sm"
              className="h-9 min-w-[110px] rounded-full px-4 text-xs font-semibold uppercase tracking-wide"
              onClick={() => handleRating("credible")}
            >
              Věřím
            </Button>
            <Button
              variant={selectedRating === "not-credible" ? "default" : "outline"}
              size="sm"
              className="h-9 min-w-[110px] rounded-full px-4 text-xs font-semibold uppercase tracking-wide"
              onClick={() => handleRating("not-credible")}
            >
              Nevěřím
            </Button>
            <Button
              variant={selectedRating === "unsure" ? "default" : "outline"}
              size="sm"
              className="h-9 min-w-[110px] rounded-full px-4 text-xs font-semibold uppercase tracking-wide"
              onClick={() => handleRating("unsure")}
            >
              Nejsem si jistý
            </Button>
          </div>
        </div>
      )}

      {hasQuestions && (
        <div className="flex-1 rounded-xl bg-white/70 px-4 py-4 shadow-sm md:px-6 md:py-6">
          <ReadingCheck
            questions={questions}
            variant="embedded"
            onCompletionChange={handleCompletionChange}
          />
        </div>
      )}
    </div>
  );
}
