import AnnotatableArticle from "@/components/SpanAnnotation/AnnotatableArticle";
import AnnotateDock from "@/components/SpanAnnotation/AnnotateDock";
import AnnotateSidebar from "@/components/SpanAnnotation/AnnotateSidebar";
import AnnotateToolbar from "@/components/SpanAnnotation/AnnotateToolbar";
import AnnotatorPrompt from "@/components/SpanAnnotation/AnnotatorPrompt";
import { Button } from "@/components/ui/button";
import { annotationArticles } from "@/data/news";
import { useToast } from "@/hooks/use-toast";
import {
  AnnotateAnswers,
  clearDraft,
  loadDraft,
  useAnnotateDraft,
} from "@/hooks/useAnnotateDraft";
import { useAnnotateQueue } from "@/hooks/useAnnotateQueue";
import { useAnnotationTypes } from "@/hooks/useAnnotationTypes";
import {
  deleteAllAnnotationsForAnnotator,
  useAnnotatorAnnotations,
} from "@/hooks/useAnnotatorAnnotations";
import {
  computeStats,
  SpanAnnotation,
  tokenizePages,
} from "@/lib/spanAnnotation";
import { ArrowLeft, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

const DEFAULT_FONT_SIZE = 24;
const DEFAULT_LINE_HEIGHT = 2.4;

export default function ArticleAnnotate() {
  const { id: articleId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const annotator = searchParams.get("annotator")?.trim() ?? "";
  const hasAnnotator = annotator.length > 0;

  const article = useMemo(
    () => annotationArticles.find((a) => a.id === articleId) ?? null,
    [articleId],
  );

  const pages = useMemo(() => {
    if (!article) return [""];
    const content = article.content?.trim().length
      ? article.content
      : article.perex ?? "";
    return [content];
  }, [article]);

  const { tokens, pageRanges } = useMemo(() => tokenizePages(pages), [pages]);

  const {
    types,
    addType,
    updateType,
    removeType,
  } = useAnnotationTypes(annotator);

  const queue = useAnnotateQueue(annotator);
  const annotatorAnnotations = useAnnotatorAnnotations(annotator);

  const sortedArticles = useMemo(
    () =>
      [...annotationArticles].sort((a, b) => a.id.localeCompare(b.id)),
    [],
  );

  const [hydrated, setHydrated] = useState(false);
  const [spans, setSpans] = useState<SpanAnnotation[]>([]);
  const [answers, setAnswers] = useState<AnnotateAnswers>({});
  const [activeTypeId, setActiveTypeId] = useState<string | null>(null);
  const [pulseSpanId, setPulseSpanId] = useState<string | null>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hasAnnotator || !articleId) return;
    const draft = loadDraft(annotator, articleId);
    setSpans(draft?.spans ?? []);
    setAnswers(draft?.answers ?? {});
    setActiveTypeId(null);
    setHydrated(true);
    return () => setHydrated(false);
  }, [annotator, articleId, hasAnnotator]);

  const saveStatus = useAnnotateDraft(
    annotator,
    articleId ?? "",
    useMemo(() => ({ spans, answers }), [spans, answers]),
    hydrated,
  );

  const handleAddSpan = useCallback((s: SpanAnnotation) => {
    setSpans((prev) => [...prev, s]);
  }, []);

  const handleUpdateSpan = useCallback(
    (id: string, patch: Partial<SpanAnnotation>) => {
      setSpans((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    },
    [],
  );

  const handleRemoveSpan = useCallback((id: string) => {
    setSpans((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleJumpToSpan = useCallback((spanId: string) => {
    setPulseSpanId(spanId);
    setPulseKey((k) => k + 1);
  }, []);

  const stats = useMemo(
    () => computeStats(spans, tokens.length, types),
    [spans, tokens.length, types],
  );

  const canSubmit =
    answers.credibility !== undefined &&
    answers.manipulativeness !== undefined;

  const handleSubmit = useCallback(async () => {
    if (!article || !canSubmit || !annotator) return;
    setSubmitting(true);
    const payload = {
      annotatorId: annotator,
      articleId: article.id,
      answers: {
        ...answers,
        spans,
        types,
      },
      timestamp: new Date().toISOString(),
    };
    try {
      const existing = localStorage.getItem("annotation_results");
      const results = existing ? JSON.parse(existing) : [];
      results.push(payload);
      localStorage.setItem("annotation_results", JSON.stringify(results));
    } catch {
      // ignore
    }
    try {
      await fetch(`${import.meta.env.BASE_URL}api/save-annotation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Failed to save annotation:", err);
    }
    clearDraft(annotator, article.id);
    queue.markVisited(article.id);
    annotatorAnnotations.refetch();
    setSubmitting(false);

    const nextId = queue.nextUnvisited(article.id);
    if (nextId) {
      navigate(`/article/${nextId}/annotate?annotator=${encodeURIComponent(annotator)}`);
    } else {
      navigate(`/annotate/done?annotator=${encodeURIComponent(annotator)}`);
    }
  }, [
    annotator,
    answers,
    article,
    canSubmit,
    navigate,
    queue,
    spans,
    types,
    annotatorAnnotations,
  ]);

  const handleJumpToArticle = useCallback(
    (id: string) => {
      if (!annotator || id === articleId) return;
      navigate(
        `/article/${id}/annotate?annotator=${encodeURIComponent(annotator)}`,
      );
    },
    [annotator, articleId, navigate],
  );

  const handleResetAll = useCallback(async () => {
    if (!annotator) return;
    const ok = window.confirm(
      `Smazat všechny anotace pro '${annotator}'? Tato akce je nevratná.`,
    );
    if (!ok) return;
    try {
      await deleteAllAnnotationsForAnnotator(annotator);
    } catch (err) {
      console.error("Reset failed:", err);
      toast({
        title: "Chyba",
        description: "Nepodařilo se smazat server data.",
        variant: "destructive",
      });
      return;
    }
    try {
      localStorage.removeItem(`annotate_visited_${annotator}`);
      localStorage.removeItem(`annotation_types_${annotator}`);
      const prefix = `annotate_draft_${annotator}_`;
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    toast({
      title: "Smazáno",
      description: "Všechny anotace pro tohoto anotátora byly odstraněny.",
    });
    annotatorAnnotations.refetch();
    queue.resetVisited();
    setSpans([]);
    setAnswers({});
    const firstId = sortedArticles[0]?.id;
    if (firstId) {
      navigate(
        `/article/${firstId}/annotate?annotator=${encodeURIComponent(annotator)}`,
        { replace: true },
      );
    }
  }, [
    annotator,
    annotatorAnnotations,
    navigate,
    queue,
    sortedArticles,
    toast,
  ]);

  if (!hasAnnotator) {
    return (
      <AnnotatorPrompt
        onSubmit={(name) => {
          const params = new URLSearchParams(searchParams);
          params.set("annotator", name);
          setSearchParams(params, { replace: true });
        }}
      />
    );
  }

  if (!article) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Článek nenalezen.</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Zpět
        </Button>
      </div>
    );
  }

  const progress = `${queue.visitedCount} / ${queue.totalCount}`;

  return (
    <div className="flex h-screen flex-col bg-white">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět
        </Button>
        <h1 className="line-clamp-1 flex-1 text-sm font-semibold text-foreground">
          {article.title}
        </h1>
        <span className="rounded bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-700">
          {progress}
        </span>
        <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
          <User className="h-3 w-3" />
          {annotator}
        </span>
      </header>

      <AnnotateToolbar
        types={types}
        activeTypeId={activeTypeId}
        onActivate={setActiveTypeId}
        onAddType={addType}
        onUpdateType={updateType}
        onRemoveType={removeType}
        saveStatus={saveStatus}
      />

      <div className="flex min-h-0 flex-1">
        <main className="flex-1 overflow-auto">
          <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-6">
            <section className="flex flex-col gap-2 border-b border-zinc-100 pb-4">
              <h2 className="text-xl font-bold text-foreground">
                {article.title}
              </h2>
              {article.perex && (
                <p className="text-sm italic text-zinc-600">{article.perex}</p>
              )}
            </section>

            <AnnotatableArticle
              tokens={tokens}
              pageRange={pageRanges[0] ?? { start: 0, end: tokens.length }}
              spans={spans}
              types={types}
              activeTypeId={activeTypeId}
              onAddSpan={handleAddSpan}
              onUpdateSpan={handleUpdateSpan}
              onRemoveSpan={handleRemoveSpan}
              fontSize={DEFAULT_FONT_SIZE}
              lineHeight={DEFAULT_LINE_HEIGHT}
              pulseSpanId={pulseSpanId}
              pulseKey={pulseKey}
            />

          </div>
        </main>

        <AnnotateSidebar
          spans={spans}
          types={types}
          tokens={tokens}
          stats={stats}
          answers={answers}
          onAnswersChange={(patch) => setAnswers((a) => ({ ...a, ...patch }))}
          canSubmit={canSubmit}
          submitting={submitting}
          onSubmit={() => {
            if (!canSubmit) {
              toast({
                title: "Chybí hodnocení",
                description: "Vyplňte obě škály.",
                variant: "destructive",
              });
              return;
            }
            handleSubmit();
          }}
          onJumpToSpan={handleJumpToSpan}
          onRemoveSpan={handleRemoveSpan}
        />
      </div>

      <AnnotateDock
        articles={sortedArticles}
        currentArticleId={article.id}
        byArticle={annotatorAnnotations.byArticle}
        annotator={annotator}
        onJump={handleJumpToArticle}
        onResetAll={handleResetAll}
      />
    </div>
  );
}

