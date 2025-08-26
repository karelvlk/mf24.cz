import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";

interface ArticleRatingProps {
  articleId?: string;
  onRatingChange?: (rating: 'credible' | 'not-credible' | 'unsure') => void;
}

export default function ArticleRating({ articleId, onRatingChange }: ArticleRatingProps) {
  const [selectedRating, setSelectedRating] = useState<string | null>(null);

  const handleRating = useCallback((rating: 'credible' | 'not-credible' | 'unsure') => {
    setSelectedRating(rating);
    onRatingChange?.(rating);
    console.log(`Article ${articleId} rated as: ${rating}`);
  }, [articleId, onRatingChange]);

  return (
    <div className="bg-muted/30 rounded-lg p-4 mt-6 border border-separator/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
          <span className="text-sm font-medium text-foreground">
            Ohodnoťte věrohodnost článku
          </span>
        </div>

        <div className="flex gap-3 flex-shrink-0">
          <Button
            variant={selectedRating === 'credible' ? 'default' : 'outline'}
            size="sm"
            className="min-w-[100px] h-9 text-xs font-medium transition-all duration-150"
            onClick={() => handleRating('credible')}
          >
            ✓ Věřím
          </Button>
          <Button
            variant={selectedRating === 'not-credible' ? 'default' : 'outline'}
            size="sm"
            className="min-w-[100px] h-9 text-xs font-medium transition-all duration-150"
            onClick={() => handleRating('not-credible')}
          >
            ✗ Nevěřím
          </Button>
          <Button
            variant={selectedRating === 'unsure' ? 'default' : 'outline'}
            size="sm"
            className="min-w-[100px] h-9 text-xs font-medium transition-all duration-150"
            onClick={() => handleRating('unsure')}
          >
            ? Nejsem si jistý
          </Button>
        </div>
            </div>
    </div>
  );
}
