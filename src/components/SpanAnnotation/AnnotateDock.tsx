import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { NewsArticle } from "@/data/news";
import type { AnnotatorAnnotation } from "@/hooks/useAnnotatorAnnotations";
import { Trash2 } from "lucide-react";

interface AnnotateDockProps {
  articles: NewsArticle[];
  currentArticleId: string;
  byArticle: Map<string, AnnotatorAnnotation>;
  annotator: string;
  onJump: (articleId: string) => void;
  onResetAll: () => void;
}

export default function AnnotateDock({
  articles,
  currentArticleId,
  byArticle,
  annotator,
  onJump,
  onResetAll,
}: AnnotateDockProps) {
  const annotatedCount = byArticle.size;
  const total = articles.length;

  return (
    <div className="sticky bottom-0 z-30 flex items-center gap-2 border-t border-zinc-200 bg-white/95 px-3 py-2 backdrop-blur">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
        {annotator}
      </span>
      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700">
        {annotatedCount} / {total}
      </span>

      <div className="flex flex-1 items-center gap-1 overflow-x-auto">
        {articles.map((a, i) => {
          const ann = byArticle.get(a.id);
          const isCurrent = a.id === currentArticleId;
          const isAnnotated = Boolean(ann);
          return (
            <Tooltip key={a.id} delayDuration={150}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onJump(a.id)}
                  className={
                    "relative h-6 w-6 shrink-0 rounded transition-transform hover:scale-110 " +
                    (isAnnotated
                      ? "bg-primary"
                      : "border border-zinc-300 bg-white") +
                    (isCurrent ? " ring-2 ring-zinc-900 ring-offset-1" : "")
                  }
                  aria-label={a.title}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-zinc-600">
                    {isAnnotated ? "" : i + 1}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">{a.title}</span>
                  {ann ? (
                    <>
                      <span className="text-zinc-300">
                        {ann.spans.length} anotac
                        {ann.spans.length === 1 ? "e" : "í"}
                      </span>
                      {ann.credibility !== undefined && (
                        <span className="text-zinc-300">
                          Věrohodnost: {ann.credibility} / 5
                        </span>
                      )}
                      {ann.manipulativeness !== undefined && (
                        <span className="text-zinc-300">
                          Manipulativnost: {ann.manipulativeness} / 5
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-400">
                        {new Date(ann.timestamp).toLocaleString("cs-CZ")}
                      </span>
                    </>
                  ) : (
                    <span className="text-zinc-300">Neanotováno</span>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onResetAll}
            className="inline-flex h-7 items-center gap-1 rounded border border-zinc-200 bg-white px-2 text-[11px] font-medium text-zinc-600 hover:border-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
            Reset
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Smazat všechny moje anotace (server + local)
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
