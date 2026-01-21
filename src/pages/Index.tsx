import NewsCard from "@/components/NewsCard";
import NewsHeader from "@/components/NewsHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useExperimentMode } from "@/context/ExperimentModeContext";
import { getEmptyFillerArticles, newsData, type NewsArticle } from "@/data/news";
import { FlaskConical } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const {
    isActive,
    mode,
    participantId,
    articleOrder,
    remainingArticleIds,
    currentArticleId,
    startExperiment,
    startAnnotation,
    endExperiment,
  } = useExperimentMode();

  const [participantInput, setParticipantInput] = useState(participantId);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [startPositionInput, setStartPositionInput] = useState("1");
  const [selectedMode, setSelectedMode] = useState<'none' | 'annotate' | 'experiment'>('none');
  const DEFAULT_TEST_PARTICIPANT = "test-user";

  useEffect(() => {
    setParticipantInput(participantId);
  }, [participantId]);

  const allArticles = useMemo<NewsArticle[]>(
    () => [
      ...newsData["zahranicni-politika"],
      ...newsData["ceska-politika"],
      ...newsData["zdravi"],
      ...newsData["priroda"],
      ...getEmptyFillerArticles(),
    ],
    []
  );

  const articleDictionary = useMemo(() => {
    return allArticles.reduce((acc, article) => {
      acc.set(article.id, article);
      return acc;
    }, new Map<string, NewsArticle>());
  }, [allArticles]);

  const articlesForRendering = useMemo(() => {
    if (!isActive) {
      return allArticles;
    }

    const remaining = remainingArticleIds
      .map((id) => articleDictionary.get(id))
      .filter((article): article is NewsArticle => Boolean(article));

    if (mode === 'annotate' && remaining.length > 0) {
      return [remaining[0]];
    }

    return remaining;
  }, [allArticles, articleDictionary, isActive, remainingArticleIds, mode]);

  const totalArticles = allArticles.length;
  const parsedStartPosition = Number.parseInt(startPositionInput, 10);
  const safeStartPosition =
    totalArticles > 0
      ? Math.min(
          Math.max(Number.isNaN(parsedStartPosition) ? 1 : parsedStartPosition, 1),
          totalArticles
        )
      : 1;
  const selectedStartArticle =
    totalArticles > 0 ? allArticles[safeStartPosition - 1] : undefined;
  const currentArticle = currentArticleId
    ? articleDictionary.get(currentArticleId)
    : undefined;
  const totalPlannedArticles = isActive ? articleOrder.length : totalArticles;
  const completedCount = isActive
    ? Math.max(0, totalPlannedArticles - remainingArticleIds.length)
    : 0;

  const handleStartExperiment = () => {
    const trimmedId = participantInput.trim();
    if (!trimmedId || totalArticles === 0) {
      return;
    }

    const orderedIds = allArticles.map((article) => article.id);
    const startIndex = Math.max(0, Math.min(orderedIds.length, safeStartPosition - 1));

    startExperiment(trimmedId, orderedIds, startIndex);
    setIsConfigOpen(false);
  };

  const handleQuickStartExperiment = () => {
    if (totalArticles === 0) return;
    const testId = DEFAULT_TEST_PARTICIPANT;
    const orderedIds = allArticles.map((article) => article.id);
    setParticipantInput(testId);
    startExperiment(testId, orderedIds, 0);
    setSelectedMode('experiment');
  };

  const handleStartAnnotation = () => {
    const trimmedId = participantInput.trim();
    if (!trimmedId || totalArticles === 0) {
      return;
    }

    // Static order for annotation - sort by ID to be deterministic
    const orderedIds = allArticles
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((article) => article.id);

    startAnnotation(trimmedId, orderedIds);
  };

  const handleExitExperiment = () => {
    endExperiment();
    setSelectedMode('none');
  };

  useEffect(() => {
    if (!isConfigOpen) {
      return;
    }

    if (isActive) {
      if (currentArticleId) {
        const currentIndex = articleOrder.indexOf(currentArticleId);
        if (currentIndex >= 0) {
          setStartPositionInput(String(currentIndex + 1));
          return;
        }
      }

      const fallbackPosition = articleOrder.length > 0 ? articleOrder.length : 1;
      setStartPositionInput(String(fallbackPosition));
      return;
    }

    setStartPositionInput("1");
  }, [isConfigOpen, isActive, currentArticleId, articleOrder]);

  useEffect(() => {
    if (typeof document === "undefined" || !isActive) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isActive]);

  useEffect(() => {
    if (isActive) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" && articlesForRendering.length > 0) {
        event.preventDefault();
        navigate(`/article/${articlesForRendering[0].id}`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [articlesForRendering, isActive, navigate]);

  if (!isActive && selectedMode === 'none') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-4 text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold tracking-tight text-primary">DEZIPER</h1>
          <p className="text-xl text-muted-foreground">
            Děkujeme za Váš čas, poskytnuté anotace a zpětnou vazbu.
          </p>
        </div>

        <div className="flex gap-4 mt-4">
          <Button
            size="lg"
            className="h-32 w-64 text-2xl"
            onClick={() => setSelectedMode('annotate')}
          >
            Anotovat
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-32 w-64 text-2xl"
            onClick={handleQuickStartExperiment}
          >
            Experiment
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-32 w-64 text-2xl"
            onClick={() => navigate('/analysis')}
          >
            Analýza
          </Button>
        </div>
      </div>
    );
  }

  if (!isActive && selectedMode === 'annotate') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-4">
        <div className="flex w-full max-w-md flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Anotace</h1>
            <Button variant="ghost" onClick={() => setSelectedMode('none')}>Zpět</Button>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="annotator-name">Jméno anotátora</Label>
            <Input
              id="annotator-name"
              value={participantInput}
              onChange={(e) => setParticipantInput(e.target.value)}
              placeholder="Zadejte jméno..."
            />
          </div>

          <Button onClick={handleStartAnnotation} disabled={!participantInput.trim()}>
            Začít anotovat
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NewsHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="headline-primary mb-8">Hlavní zprávy</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Stiskněte klávesu <kbd className="rounded-md border border-border bg-muted/40 px-1.5 py-[2px] text-[11px] font-semibold text-foreground shadow-sm">→</kbd> pro otevření článku.
          </p>
          <div>
            {articlesForRendering.map((article) => {
              const orderPosition = isActive
                ? articleOrder.indexOf(article.id) + 1
                : undefined;
              const isInteractive = !isActive || article.id === currentArticleId;

              return (
                <NewsCard
                  key={article.id}
                  article={article}
                  variant="minimal"
                  disabled={!isInteractive}
                  muted={isActive && !isInteractive}
                  orderLabel={
                    typeof orderPosition === "number" && orderPosition > 0
                      ? `#${orderPosition}`
                      : undefined
                  }
                />
              );
            })}
            {isActive && articlesForRendering.length === 0 && (
              <div className="rounded-md border border-dashed border-muted-foreground/40 px-4 py-6 text-center text-sm text-muted-foreground">
                V tomto režimu již nezbývají žádné články k přečtení.
              </div>
            )}
          </div>
        </div>
      </main>

      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-4">
          <DialogTrigger asChild>
            <Button
              type="button"
              variant={isActive ? "default" : "outline"}
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg"
            >
              <FlaskConical className="h-5 w-5" />
              <span className="sr-only">Otevřít nastavení experimentu</span>
            </Button>
          </DialogTrigger>
          {mode === 'annotate' && (
            <div className="flex items-center gap-3 rounded-full border border-separator bg-white/90 px-4 py-2 shadow-lg backdrop-blur-sm">
              <span className="text-sm font-medium text-foreground">
                {participantId}
              </span>
              <div className="h-4 w-px bg-border" />
              <button
                onClick={handleExitExperiment}
                className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
              >
                Odhlásit
              </button>
            </div>
          )}
        </div>

        {isActive ? (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Správa experimentu</DialogTitle>
              <DialogDescription>
                Experimentální režim je aktivní. Nastavení lze změnit až po jeho ukončení.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Účastník:</span>{" "}
                {participantId || "nezadaný"}
              </div>
              <div>
                <span className="font-medium text-foreground">Dokončeno:</span>{" "}
                {completedCount}/{totalPlannedArticles}
              </div>
              {currentArticle ? (
                <div>
                  <span className="font-medium text-foreground">Další článek:</span>{" "}
                  #{articleOrder.indexOf(currentArticle.id) + 1} — {currentArticle.title}
                </div>
              ) : (
                <div>
                  <span className="font-medium text-foreground">Stav:</span>{" "}
                  všechny články jsou přečtené.
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleExitExperiment}>
                Ukončit experiment
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : (
          <DialogContent className="sm:max-w-lg">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleStartExperiment();
              }}
            >
              <DialogHeader>
                <DialogTitle>Spustit experimentální režim</DialogTitle>
                <DialogDescription>
                  Zadejte ID účastníka a číslo článku, od kterého se má experiment spustit.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="participant-id">ID účastníka</Label>
                  <Input
                    id="participant-id"
                    value={participantInput}
                    onChange={(event) => setParticipantInput(event.target.value)}
                    placeholder="např. A12"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="start-position">Začít od pořadí</Label>
                  <Input
                    id="start-position"
                    type="number"
                    min={1}
                    max={Math.max(totalArticles, 1)}
                    value={startPositionInput}
                    onChange={(event) => setStartPositionInput(event.target.value)}
                  />
                  {selectedStartArticle && (
                    <p className="text-xs text-muted-foreground">
                      #{safeStartPosition} — {selectedStartArticle.title}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={!participantInput.trim() || totalArticles === 0}
                >
                  Spustit experiment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default Index;
