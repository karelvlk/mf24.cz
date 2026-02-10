import AnnotationSlide from "@/components/AnnotationSlide";
import NewsHeader from "@/components/NewsHeader";
import QuestionSlide from "@/components/QuestionSlide";
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useExperimentMode } from "@/context/ExperimentModeContext";
import { useScreenshotMode } from "@/context/ScreenshotModeContext";
import { emptyFillerArticles, newsData } from "@/data/news";
import { useToast } from "@/hooks/use-toast";
import { paginateArticleContent } from "@/lib/utils";
import { Settings2 } from "lucide-react";
import type { AnimationEvent as ReactAnimationEvent } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const DEFAULT_FONT_SIZE = 36;
const DEFAULT_IS_MONOSPACE = false;
const DEFAULT_LINE_HEIGHT = 2.5;
const DEFAULT_CONTENT_WIDTH = 1024;
const DEFAULT_IS_JUSTIFIED = false;
const DEFAULT_MARGIN_TOP = 120;
const DEFAULT_MARGIN_BOTTOM = 80;
const DEFAULT_NOVELTY_QUESTION = "Nakolik jsou pro vás informace obsažené v článku známé?";
const DEFAULT_NOVELTY_LABEL_1 = "Zcela nové";
const DEFAULT_NOVELTY_LABEL_3 = "";
const DEFAULT_NOVELTY_LABEL_5 = "Zcela známé";
const DEFAULT_CREDIBILITY_QUESTION = "Nakolik je podle vás tento článek zavádějíci?";
const DEFAULT_CREDIBILITY_LABEL_1 = "Zcela věrohodný";
const DEFAULT_CREDIBILITY_LABEL_3 = "";
const DEFAULT_CREDIBILITY_LABEL_5 = "Zcela zavádějíci";
const DEFAULT_MANIPULATIVENESS_QUESTION = "Nakolik je z vašeho pohledu tento článek manipulativní?";
const DEFAULT_MANIPULATIVENESS_LABEL_1 = "Rozhodně nemanipulativní";
const DEFAULT_MANIPULATIVENESS_LABEL_3 = "";
const DEFAULT_MANIPULATIVENESS_LABEL_5 = "Rozhodně manipulativní";

const MONOSPACE_FONT_STACK =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
const READER_SETTINGS_STORAGE_KEY = "reader_settings_local";
const KEYCAP_CLASS =
  "rounded-md border border-border bg-muted/40 px-1.5 py-[2px] text-[11px] font-semibold uppercase tracking-wide text-foreground shadow-sm";

type SlideDescriptor =
  | { type: "page"; index: number }
  | { type: "question"; index: number }
  | { type: "credibility-scale" }
  | { type: "novelty-scale" }
  | { type: "manipulativeness-scale" }
  | { type: "heard-question" }
  | { type: "annotation-credibility" }
  | { type: "annotation-manipulativeness" };

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isActive: experimentActive, markArticleVisited, mode, saveAnnotation, participantId, endExperiment } = useExperimentMode();
  const screenshotMode = useScreenshotMode();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [lineHeight, setLineHeight] = useState(DEFAULT_LINE_HEIGHT);
  const [contentWidth, setContentWidth] = useState(DEFAULT_CONTENT_WIDTH);
  const [marginTop, setMarginTop] = useState(DEFAULT_MARGIN_TOP);
  const [marginBottom, setMarginBottom] = useState(DEFAULT_MARGIN_BOTTOM);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animationState, setAnimationState] = useState<"idle" | "enter" | "exit">("idle");
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);
  const exitTimeoutRef = useRef<number | null>(null);
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const [textContainerSize, setTextContainerSize] = useState<{ width: number; height: number } | null>(null);
  const [isMonospace, setIsMonospace] = useState(DEFAULT_IS_MONOSPACE);
  const [isJustified, setIsJustified] = useState(DEFAULT_IS_JUSTIFIED);
  const [questionAnswers, setQuestionAnswers] = useState<number[]>([]);
  const [annotationAnswers, setAnnotationAnswers] = useState<{ credibility?: number; manipulativeness?: number }>({});
  const [credibilitySlider, setCredibilitySlider] = useState<number | undefined>(undefined);
  const [noveltySlider, setNoveltySlider] = useState<number | undefined>(undefined);
  const [manipulativenessSlider, setManipulativenessSlider] = useState<number | undefined>(undefined);
  const [noveltyQuestionText, setNoveltyQuestionText] = useState(DEFAULT_NOVELTY_QUESTION);
  const [noveltyLabel1, setNoveltyLabel1] = useState(DEFAULT_NOVELTY_LABEL_1);
  const [noveltyLabel3, setNoveltyLabel3] = useState(DEFAULT_NOVELTY_LABEL_3);
  const [noveltyLabel5, setNoveltyLabel5] = useState(DEFAULT_NOVELTY_LABEL_5);
  const [credibilityQuestionText, setCredibilityQuestionText] = useState(DEFAULT_CREDIBILITY_QUESTION);
  const [credibilityLabel1, setCredibilityLabel1] = useState(DEFAULT_CREDIBILITY_LABEL_1);
  const [credibilityLabel3, setCredibilityLabel3] = useState(DEFAULT_CREDIBILITY_LABEL_3);
  const [credibilityLabel5, setCredibilityLabel5] = useState(DEFAULT_CREDIBILITY_LABEL_5);
  const [manipulativenessQuestionText, setManipulativenessQuestionText] = useState(DEFAULT_MANIPULATIVENESS_QUESTION);
  const [manipulativenessLabel1, setManipulativenessLabel1] = useState(DEFAULT_MANIPULATIVENESS_LABEL_1);
  const [manipulativenessLabel3, setManipulativenessLabel3] = useState(DEFAULT_MANIPULATIVENESS_LABEL_3);
  const [manipulativenessLabel5, setManipulativenessLabel5] = useState(DEFAULT_MANIPULATIVENESS_LABEL_5);
  const [pages, setPages] = useState<string[]>([""]);

  // Find article in all categories
  const allArticles = [
    ...Object.values(newsData).flat(),
    ...emptyFillerArticles
  ];

  const article = allArticles.find(a => a.id === id);

  useEffect(() => {
    if (!article || !experimentActive) {
      return;
    }

    if (mode !== 'annotate') {
      markArticleVisited(article.id);
    }
  }, [article, experimentActive, markArticleVisited, mode]);


  const articleContent = article?.content ?? "";
  const articlePerex = article?.perex ?? "";
  const articleBody =
    articleContent.trim().length > 0 ? articleContent : articlePerex;
  const questionItems = useMemo(
    () =>
      Array.isArray(article?.question)
        ? article.question.filter(
            (qa) =>
              typeof qa?.question === "string" &&
              qa.question.trim().length > 0 &&
              Array.isArray(qa.answers) &&
              qa.answers.length > 0
          )
        : [],
    [article]
  );
  const heardQuestion = useMemo(
    () => ({
      question: "Slyšel/a jste už o tématu, kterému se článek věnuje?",
      answers: [
        { text: "Ano", is_correct: false },
        { text: "Ne", is_correct: false }
      ]
    }),
    []
  );

  useLayoutEffect(() => {
    const element = textContainerRef.current;
    if (!element || typeof window === "undefined") {
      return;
    }

    const updateSize = () => {
      const styles = window.getComputedStyle(element);
      const paddingX =
        parseFloat(styles.paddingLeft || "0") + parseFloat(styles.paddingRight || "0");
      const paddingY =
        parseFloat(styles.paddingTop || "0") + parseFloat(styles.paddingBottom || "0");

      setTextContainerSize({
        width: Math.max(0, element.clientWidth - paddingX),
        height: Math.max(0, element.clientHeight - paddingY),
      });
    };

    updateSize();

    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(element);
      return () => resizeObserver.disconnect();
    }

    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = localStorage.getItem(READER_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed.fontSize === "number" && Number.isFinite(parsed.fontSize)) {
        setFontSize(Math.min(40, Math.max(20, Math.round(parsed.fontSize))));
      }
      if (typeof parsed.lineHeight === "number" && Number.isFinite(parsed.lineHeight)) {
        setLineHeight(Math.min(3, Math.max(1, Math.round(parsed.lineHeight * 10) / 10)));
      }
      if (typeof parsed.contentWidth === "number" && Number.isFinite(parsed.contentWidth)) {
        setContentWidth(Math.min(1200, Math.max(600, Math.round(parsed.contentWidth))));
      }
      if (typeof parsed.isMonospace === "boolean") {
        setIsMonospace(parsed.isMonospace);
      }
      if (typeof parsed.isJustified === "boolean") {
        setIsJustified(parsed.isJustified);
      }
      if (typeof parsed.marginTop === "number" && Number.isFinite(parsed.marginTop)) {
        setMarginTop(Math.min(200, Math.max(0, Math.round(parsed.marginTop))));
      }
      if (typeof parsed.marginBottom === "number" && Number.isFinite(parsed.marginBottom)) {
        setMarginBottom(Math.min(200, Math.max(0, Math.round(parsed.marginBottom))));
      }
      if (typeof parsed.noveltyQuestionText === "string") {
        setNoveltyQuestionText(parsed.noveltyQuestionText);
      }
      if (typeof parsed.noveltyLabel1 === "string") {
        setNoveltyLabel1(parsed.noveltyLabel1);
      }
      if (typeof parsed.noveltyLabel3 === "string") {
        setNoveltyLabel3(parsed.noveltyLabel3);
      }
      if (typeof parsed.noveltyLabel5 === "string") {
        setNoveltyLabel5(parsed.noveltyLabel5);
      }
      if (typeof parsed.credibilityQuestionText === "string") {
        setCredibilityQuestionText(parsed.credibilityQuestionText);
      }
      if (typeof parsed.credibilityLabel1 === "string") {
        setCredibilityLabel1(parsed.credibilityLabel1);
      }
      if (typeof parsed.credibilityLabel3 === "string") {
        setCredibilityLabel3(parsed.credibilityLabel3);
      }
      if (typeof parsed.credibilityLabel5 === "string") {
        setCredibilityLabel5(parsed.credibilityLabel5);
      }
      if (typeof parsed.manipulativenessQuestionText === "string") {
        setManipulativenessQuestionText(parsed.manipulativenessQuestionText);
      }
      if (typeof parsed.manipulativenessLabel1 === "string") {
        setManipulativenessLabel1(parsed.manipulativenessLabel1);
      }
      if (typeof parsed.manipulativenessLabel3 === "string") {
        setManipulativenessLabel3(parsed.manipulativenessLabel3);
      }
      if (typeof parsed.manipulativenessLabel5 === "string") {
        setManipulativenessLabel5(parsed.manipulativenessLabel5);
      }
    } catch (error) {
      console.error("Failed to load reader settings", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const payload = {
      fontSize,
      lineHeight,
      contentWidth,
      isMonospace,
      isJustified,
      marginTop,
      marginBottom,
      noveltyQuestionText,
      noveltyLabel1,
      noveltyLabel3,
      noveltyLabel5,
      credibilityQuestionText,
      credibilityLabel1,
      credibilityLabel3,
      credibilityLabel5,
      manipulativenessQuestionText,
      manipulativenessLabel1,
      manipulativenessLabel3,
      manipulativenessLabel5,
    };

    localStorage.setItem(READER_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  }, [
    fontSize,
    isMonospace,
    isJustified,
    lineHeight,
    contentWidth,
    marginTop,
    marginBottom,
    noveltyQuestionText,
    noveltyLabel1,
    noveltyLabel3,
    noveltyLabel5,
    credibilityQuestionText,
    credibilityLabel1,
    credibilityLabel3,
    credibilityLabel5,
    manipulativenessQuestionText,
    manipulativenessLabel1,
    manipulativenessLabel3,
    manipulativenessLabel5,
  ]);

  useEffect(() => {
    const computedPages = paginateArticleContent(articleBody, {
      fontSize,
      lineHeight,
      containerWidth: textContainerSize?.width,
      containerHeight: textContainerSize?.height,
      fontFamily: isMonospace ? MONOSPACE_FONT_STACK : undefined,
    });

    setPages(computedPages);
  }, [articleBody, fontSize, isMonospace, lineHeight, textContainerSize]);

  const slides = useMemo<SlideDescriptor[]>(() => {
    const computed: SlideDescriptor[] = pages.map((_, index) => ({
      type: "page",
      index,
    }));

    // Reading comprehension questions
    questionItems.forEach((_, index) => {
      computed.push({ type: "question", index });
    });

    if (mode === "annotate") {
      computed.push(
        { type: "annotation-credibility" },
        { type: "annotation-manipulativeness" }
      );
    }

    // Novelty slider first
    computed.push({ type: "novelty-scale" });

    // Credibility slider second
    computed.push({ type: "credibility-scale" });

    // Manipulativeness slider third
    computed.push({ type: "manipulativeness-scale" });

    return computed;
  }, [mode, pages, questionItems]);

  const totalSlides = slides.length;

  const canSubmitAnnotation =
    mode === 'annotate'
      ? Boolean(annotationAnswers.credibility && annotationAnswers.manipulativeness)
      : true;

  const handleSubmitAnnotation = useCallback(() => {
    if (!article || mode !== 'annotate' || !canSubmitAnnotation) {
      if (!canSubmitAnnotation) {
        toast({
          title: "Chybí hodnocení",
          description: "Prosím vyplňte obě škály, než odejdete z článku.",
          variant: "destructive",
        });
      }
      return;
    }

    saveAnnotation(article.id, annotationAnswers);
    markArticleVisited(article.id);
    navigate('/');
  }, [annotationAnswers, article, canSubmitAnnotation, markArticleVisited, mode, navigate, saveAnnotation, toast]);

  const validateSlideNavigation = useCallback(
    (descriptor: SlideDescriptor | null) => {
      if (mode !== "annotate" || !descriptor) {
        return true;
      }

      if (descriptor.type === "annotation-credibility" && !annotationAnswers.credibility) {
        toast({
          title: "Chybí hodnocení",
          description: "Prosím ohodnoťte věrohodnost článku před pokračováním.",
          variant: "destructive",
        });
        return false;
      }

      if (descriptor.type === "annotation-manipulativeness" && !annotationAnswers.manipulativeness) {
        toast({
          title: "Chybí hodnocení",
          description: "Prosím ohodnoťte manipulativnost článku před pokračováním.",
          variant: "destructive",
        });
        return false;
      }

      return true;
    },
    [annotationAnswers.credibility, annotationAnswers.manipulativeness, mode, toast]
  );

  const handleNext = useCallback(() => {
    const descriptor = slides[currentSlide] ?? null;
    if (!validateSlideNavigation(descriptor)) return;

    if (
      mode === "annotate" &&
      descriptor?.type === "annotation-manipulativeness" &&
      canSubmitAnnotation
    ) {
      handleSubmitAnnotation();
      return;
    }

    if (currentSlide >= totalSlides - 1) {
      navigate("/");
      return;
    }

    setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [canSubmitAnnotation, currentSlide, handleSubmitAnnotation, mode, navigate, slides, totalSlides, validateSlideNavigation]);

  const handlePrev = useCallback(() => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  }, []);

  const currentSlideDescriptor = slides[currentSlide] ?? null;
  const currentQuestionKeys =
    currentSlideDescriptor?.type === "question" ||
    currentSlideDescriptor?.type === "heard-question"
      ? Array.from(
          {
            length:
              (currentSlideDescriptor.type === "question" &&
              typeof currentSlideDescriptor.index === "number" &&
              questionItems[currentSlideDescriptor.index]
                ? questionItems[currentSlideDescriptor.index]
                : heardQuestion
              )?.answers?.length ?? 0,
          },
          (_, index) => (index + 1).toString()
        )
      : [];
  const showQuestionHints = currentQuestionKeys.length > 0;
  const isCredibilitySlide = currentSlideDescriptor?.type === "credibility-scale";
  const isNoveltySlide = currentSlideDescriptor?.type === "novelty-scale";
  const isManipulativenessSlide = currentSlideDescriptor?.type === "manipulativeness-scale";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSettingsOpen) {
        return;
      }

      if (e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        handleNext();
      } else if (isCredibilitySlide || isNoveltySlide || isManipulativenessSlide) {
        const numeric = Number.parseInt(e.key, 10);
        if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= 5) {
          e.preventDefault();
          if (isCredibilitySlide) {
            setCredibilitySlider(numeric);
          } else if (isNoveltySlide) {
            setNoveltySlider(numeric);
          } else if (isManipulativenessSlide) {
            setManipulativenessSlider(numeric);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [handleNext, handlePrev, isCredibilitySlide, isManipulativenessSlide, isNoveltySlide, isSettingsOpen]);

  useEffect(() => {
    if (screenshotMode) {
      setShouldReduceMotion(true);
      setAnimationState("idle");
      return;
    }

    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event: MediaQueryListEvent) => {
      setShouldReduceMotion(event.matches);
    };

    setShouldReduceMotion(motionQuery.matches);

    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", handleChange);
      return () => {
        motionQuery.removeEventListener("change", handleChange);
      };
    }

    motionQuery.addListener(handleChange);
    return () => {
      motionQuery.removeListener(handleChange);
    };
  }, [screenshotMode]);

  useEffect(() => {
    if (screenshotMode || shouldReduceMotion) {
      setAnimationState("idle");
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setAnimationState("enter");
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [shouldReduceMotion, screenshotMode]);

  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current !== null) {
        window.clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const totalQuestions = questionItems.length + 1; // includes the extra heard-about question

    if (totalQuestions === 0) {
      setQuestionAnswers([]);
      return;
    }

    setQuestionAnswers((previous) =>
      Array.from({ length: totalQuestions }, (_, index) =>
        typeof previous[index] === "number" ? previous[index] : -1
      )
    );
  }, [mode, questionItems]);

  useEffect(() => {
    setCurrentSlide(0);
    setCredibilitySlider(undefined);
    setNoveltySlider(undefined);
  }, [slides.length]);

  const handleQuestionAnswer = useCallback((questionIndex: number, answerIndex: number) => {
    setQuestionAnswers((previous) => {
      const next = [...previous];
      next[questionIndex] = answerIndex;
      return next;
    });
  }, []);


  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <NewsHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="headline-primary text-center">Článek nenalezen</h1>
          </div>
        </div>
      </div>
    );
  }

  const handleFontSizeChange = (value: number[]) => {
    const next = value[0];
    if (typeof next === "number" && Number.isFinite(next)) {
      setFontSize(Math.round(next));
    }
  };

  const handleLineHeightChange = (value: number[]) => {
    const next = value[0];
    if (typeof next === "number" && Number.isFinite(next)) {
      const rounded = Math.round(next * 10) / 10;
      setLineHeight(rounded);
    }
  };

  const handleResetSettings = () => {
    setFontSize(DEFAULT_FONT_SIZE);
    setLineHeight(DEFAULT_LINE_HEIGHT);
    setContentWidth(DEFAULT_CONTENT_WIDTH);
    setIsMonospace(DEFAULT_IS_MONOSPACE);
    setIsJustified(DEFAULT_IS_JUSTIFIED);
    setMarginTop(DEFAULT_MARGIN_TOP);
    setMarginBottom(DEFAULT_MARGIN_BOTTOM);
    setNoveltyQuestionText(DEFAULT_NOVELTY_QUESTION);
    setNoveltyLabel1(DEFAULT_NOVELTY_LABEL_1);
    setNoveltyLabel3(DEFAULT_NOVELTY_LABEL_3);
    setNoveltyLabel5(DEFAULT_NOVELTY_LABEL_5);
    setCredibilityQuestionText(DEFAULT_CREDIBILITY_QUESTION);
    setCredibilityLabel1(DEFAULT_CREDIBILITY_LABEL_1);
    setCredibilityLabel3(DEFAULT_CREDIBILITY_LABEL_3);
    setCredibilityLabel5(DEFAULT_CREDIBILITY_LABEL_5);
    setManipulativenessQuestionText(DEFAULT_MANIPULATIVENESS_QUESTION);
    setManipulativenessLabel1(DEFAULT_MANIPULATIVENESS_LABEL_1);
    setManipulativenessLabel3(DEFAULT_MANIPULATIVENESS_LABEL_3);
    setManipulativenessLabel5(DEFAULT_MANIPULATIVENESS_LABEL_5);
  };

  const completeNavigation = () => {
    if (exitTimeoutRef.current !== null) {
      window.clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }
    navigate(-1);
  };

  const handleBackClick = () => {
    if (screenshotMode) {
      setIsSettingsOpen(false);
      completeNavigation();
      return;
    }

    if (animationState === "exit" || exitTimeoutRef.current !== null) {
      return;
    }

    setIsSettingsOpen(false);

    if (shouldReduceMotion) {
      completeNavigation();
      return;
    }

    setAnimationState("exit");
    exitTimeoutRef.current = window.setTimeout(() => {
      completeNavigation();
    }, 320);
  };

  const handleContainerAnimationEnd = (event: ReactAnimationEvent<HTMLDivElement>) => {
    if (animationState !== "exit") {
      return;
    }

    if (event.target !== event.currentTarget) {
      return;
    }

    completeNavigation();
  };

  const containerClassNames = [
    "relative",
    "flex",
    "flex-1",
    "flex-col",
    "overflow-hidden",
    "article-detail-motion"
  ];
  if (!shouldReduceMotion) {
    if (animationState === "enter") {
      containerClassNames.push("article-detail-enter");
    } else if (animationState === "exit") {
      containerClassNames.push("article-detail-exit");
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <NewsHeader />
      <div
        className={containerClassNames.join(" ")}
        onAnimationEnd={handleContainerAnimationEnd}
      >
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed bottom-6 left-6 z-20 h-11 w-11 rounded-full border border-separator bg-white shadow-sm"
            >
              <Settings2 className="h-5 w-5" />
              <span className="sr-only">Otevřít nastavení čtečky</span>
            </Button>
          </DialogTrigger>
          {mode === 'annotate' && (
            <div className="fixed bottom-6 left-20 z-20 flex items-center gap-3 rounded-full border border-separator bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm">
              <span className="text-sm font-medium text-foreground">
                {participantId}
              </span>
              <div className="h-4 w-px bg-border" />
              <button
                onClick={() => {
                  endExperiment();
                  navigate('/');
                }}
                className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
              >
                Odhlásit
              </button>
            </div>
          )}
          <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nastavení čtečky</DialogTitle>
              <DialogDescription>
                Upravte velikost písma a řádkování pro pohodlné čtení.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-2">
              <div className="space-y-6 rounded-lg border border-separator/40 bg-muted/10 px-4 py-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">Otázky se škálou (1–5)</h3>
                  <p className="text-xs text-muted-foreground">
                    Upravte texty otázek a popisky hodnot 1, 3 a 5 pro všechny články.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="slider-novelty-question">Otázka 2 – Znění otázky</Label>
                    <Textarea
                      id="slider-novelty-question"
                      value={noveltyQuestionText}
                      onChange={(event) => setNoveltyQuestionText(event.target.value)}
                      rows={2}
                    />
                    <div className="grid gap-2 md:grid-cols-3">
                      <div className="space-y-1">
                        <Label htmlFor="slider-novelty-label-1">Label 1</Label>
                        <Input
                          id="slider-novelty-label-1"
                          value={noveltyLabel1}
                          onChange={(event) => setNoveltyLabel1(event.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="slider-novelty-label-3">Label 3</Label>
                        <Input
                          id="slider-novelty-label-3"
                          value={noveltyLabel3}
                          onChange={(event) => setNoveltyLabel3(event.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="slider-novelty-label-5">Label 5</Label>
                        <Input
                          id="slider-novelty-label-5"
                          value={noveltyLabel5}
                          onChange={(event) => setNoveltyLabel5(event.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slider-credibility-question">Otázka 3 – Znění otázky</Label>
                    <Textarea
                      id="slider-credibility-question"
                      value={credibilityQuestionText}
                      onChange={(event) => setCredibilityQuestionText(event.target.value)}
                      rows={2}
                    />
                    <div className="grid gap-2 md:grid-cols-3">
                      <div className="space-y-1">
                        <Label htmlFor="slider-credibility-label-1">Label 1</Label>
                        <Input
                          id="slider-credibility-label-1"
                          value={credibilityLabel1}
                          onChange={(event) => setCredibilityLabel1(event.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="slider-credibility-label-3">Label 3</Label>
                        <Input
                          id="slider-credibility-label-3"
                          value={credibilityLabel3}
                          onChange={(event) => setCredibilityLabel3(event.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="slider-credibility-label-5">Label 5</Label>
                        <Input
                          id="slider-credibility-label-5"
                          value={credibilityLabel5}
                          onChange={(event) => setCredibilityLabel5(event.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slider-manipulativeness-question">Otázka 4 – Znění otázky</Label>
                    <Textarea
                      id="slider-manipulativeness-question"
                      value={manipulativenessQuestionText}
                      onChange={(event) => setManipulativenessQuestionText(event.target.value)}
                      rows={2}
                    />
                    <div className="grid gap-2 md:grid-cols-3">
                      <div className="space-y-1">
                        <Label htmlFor="slider-manipulativeness-label-1">Label 1</Label>
                        <Input
                          id="slider-manipulativeness-label-1"
                          value={manipulativenessLabel1}
                          onChange={(event) => setManipulativenessLabel1(event.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="slider-manipulativeness-label-3">Label 3</Label>
                        <Input
                          id="slider-manipulativeness-label-3"
                          value={manipulativenessLabel3}
                          onChange={(event) => setManipulativenessLabel3(event.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="slider-manipulativeness-label-5">Label 5</Label>
                        <Input
                          id="slider-manipulativeness-label-5"
                          value={manipulativenessLabel5}
                          onChange={(event) => setManipulativenessLabel5(event.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="article-font-size">Velikost písma</Label>
                  <span className="text-sm font-medium text-foreground">
                    {fontSize}px
                  </span>
                </div>
                <Slider
                  id="article-font-size"
                  value={[fontSize]}
                  onValueChange={handleFontSizeChange}
                  min={20}
                  max={40}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="article-line-height">Řádkování</Label>
                  <span className="text-sm font-medium text-foreground">
                    {lineHeight.toFixed(1)}×
                  </span>
                </div>
                <Slider
                  id="article-line-height"
                  value={[lineHeight]}
                  onValueChange={handleLineHeightChange}
                  min={1}
                  max={3}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="article-content-width">Šířka obsahu</Label>
                  <span className="text-sm font-medium text-foreground">
                    {contentWidth}px
                  </span>
                </div>
                <Slider
                  id="article-content-width"
                  value={[contentWidth]}
                  onValueChange={(value) => {
                    const next = value[0];
                    if (typeof next === "number" && Number.isFinite(next)) {
                      setContentWidth(Math.round(next));
                    }
                  }}
                  min={600}
                  max={1200}
                  step={50}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="article-margin-top">Horní okraj</Label>
                  <span className="text-sm font-medium text-foreground">
                    {marginTop}px
                  </span>
                </div>
                <Slider
                  id="article-margin-top"
                  value={[marginTop]}
                  onValueChange={(value) => {
                    const next = value[0];
                    if (typeof next === "number" && Number.isFinite(next)) {
                      setMarginTop(Math.round(next));
                    }
                  }}
                  min={0}
                  max={200}
                  step={10}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="article-margin-bottom">Dolní okraj</Label>
                  <span className="text-sm font-medium text-foreground">
                    {marginBottom}px
                  </span>
                </div>
                <Slider
                  id="article-margin-bottom"
                  value={[marginBottom]}
                  onValueChange={(value) => {
                    const next = value[0];
                    if (typeof next === "number" && Number.isFinite(next)) {
                      setMarginBottom(Math.round(next));
                    }
                  }}
                  min={0}
                  max={200}
                  step={10}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Rozložení textu se automaticky přizpůsobí velikosti obrazovky a nastavení písma.
              </p>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-separator/50 bg-muted/10 px-3 py-3">
                <div className="space-y-1">
                  <Label htmlFor="article-monospace">Monospace font</Label>
                  <p className="text-xs text-muted-foreground">
                    Zobrazí článek v neproporcionálním písmu.
                  </p>
                </div>
                <Switch
                  id="article-monospace"
                  checked={isMonospace}
                  onCheckedChange={setIsMonospace}
                  aria-label="Přepnout monospace font"
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-separator/50 bg-muted/10 px-3 py-3">
                <div className="space-y-1">
                  <Label htmlFor="article-justify">Zarovnání do bloku</Label>
                  <p className="text-xs text-muted-foreground">
                    Zarovná text na obě strany.
                  </p>
                </div>
                <Switch
                  id="article-justify"
                  checked={isJustified}
                  onCheckedChange={setIsJustified}
                  aria-label="Přepnout zarovnání do bloku"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={handleResetSettings}>
                Obnovit výchozí
              </Button>
              <Button onClick={() => setIsSettingsOpen(false)}>Hotovo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <main className="flex flex-1 justify-center overflow-hidden px-2 py-2 md:px-3 md:py-4">
          <div className="flex h-full w-full flex-col gap-2 md:gap-3" style={{ maxWidth: `${contentWidth}px` }}>
            {/* <div className="flex h-12 flex-none items-center">
            </div> */}

            <article className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-lg bg-white">
              <div className="flex flex-1 min-h-0 flex-col overflow-hidden px-1 py-3 md:px-2">
                <div
                  ref={textContainerRef}
                  className="flex flex-1 flex-col gap-4 overflow-auto rounded-lg border border-separator/40 bg-white px-4 py-4 shadow-sm md:px-6 md:py-5"
                  style={{
                    marginTop: `${marginTop}px`,
                    marginBottom: `${marginBottom}px`
                  }}
                >
                  {currentSlideDescriptor?.type === "page" &&
                    typeof currentSlideDescriptor.index === "number" && (
                      <p
                        className="text-foreground/80 whitespace-pre-line"
                        style={{
                          fontSize: `${fontSize}px`,
                          lineHeight: lineHeight,
                          fontFamily: isMonospace ? MONOSPACE_FONT_STACK : undefined,
                          textAlign: isJustified ? 'justify' : 'left'
                        }}
                      >
                        {(pages[currentSlideDescriptor.index] ?? "")
                          .replace(/\n+/g, " ")
                          .replace(/\b([kKsSvVzZ])\s+/g, "$1\u00A0")
                          .trim()}
                      </p>
                    )}

                {currentSlideDescriptor?.type === "question" &&
                  typeof currentSlideDescriptor.index === "number" && (
                    <QuestionSlide
                      question={
                        currentSlideDescriptor.index < questionItems.length
                            ? questionItems[currentSlideDescriptor.index]
                            : heardQuestion
                        }
                        questionIndex={currentSlideDescriptor.index}
                        selectedAnswer={
                          typeof questionAnswers[currentSlideDescriptor.index] === "number"
                            ? questionAnswers[currentSlideDescriptor.index]
                            : null
                        }
                        onSelect={(answerIndex) =>
                          handleQuestionAnswer(currentSlideDescriptor.index, answerIndex)
                        }
                        active
                      />
                    )}

                  {currentSlideDescriptor?.type === "heard-question" && (
                    <QuestionSlide
                      question={heardQuestion}
                      questionIndex={questionItems.length}
                      selectedAnswer={
                        typeof questionAnswers[questionItems.length] === "number"
                          ? questionAnswers[questionItems.length]
                          : null
                      }
                      onSelect={(answerIndex) =>
                        handleQuestionAnswer(questionItems.length, answerIndex)
                      }
                      active
                    />
                  )}

                  {currentSlideDescriptor?.type === "novelty-scale" && (
                    <AnnotationSlide
                      question={noveltyQuestionText}
                      value={noveltySlider}
                      onChange={(value) => setNoveltySlider(value)}
                      min={1}
                      max={5}
                      labels={{ 1: noveltyLabel1, 3: noveltyLabel3, 5: noveltyLabel5 }}
                      showKeyboardHint
                      showStepMarkers
                      topLeftLabel="Otázka 2"
                      dataQuestionKind="novelty-scale"
                      dataQuestionNumber={2}
                      dataOptionCount={5}
                    />
                  )}

                  {currentSlideDescriptor?.type === "credibility-scale" && (
                    <AnnotationSlide
                      question={credibilityQuestionText}
                      value={credibilitySlider}
                      onChange={(value) => setCredibilitySlider(value)}
                      min={1}
                      max={5}
                      labels={{ 1: credibilityLabel1, 3: credibilityLabel3, 5: credibilityLabel5 }}
                      showKeyboardHint
                      showStepMarkers
                      topLeftLabel="Otázka 3"
                      dataQuestionKind="credibility-scale"
                      dataQuestionNumber={3}
                      dataOptionCount={5}
                    />
                  )}

                  {currentSlideDescriptor?.type === "manipulativeness-scale" && (
                    <AnnotationSlide
                      question={manipulativenessQuestionText}
                      value={manipulativenessSlider}
                      onChange={(value) => setManipulativenessSlider(value)}
                      min={1}
                      max={5}
                      labels={{ 1: manipulativenessLabel1, 3: manipulativenessLabel3, 5: manipulativenessLabel5 }}
                      showKeyboardHint
                      showStepMarkers
                      topLeftLabel="Otázka 4"
                      dataQuestionKind="manipulativeness-scale"
                      dataQuestionNumber={4}
                      dataOptionCount={5}
                    />
                  )}

                  {currentSlideDescriptor?.type === "annotation-credibility" && (
                    <AnnotationSlide
                      question="Na kolik je pro vás tento článek věrohodný?"
                      value={annotationAnswers.credibility}
                      onChange={(value) =>
                        setAnnotationAnswers((prev) => ({ ...prev, credibility: value }))
                      }
                      labels={{ 1: "Nevěrohodný", 7: "Věrohodný" }}
                    />
                  )}

                  {currentSlideDescriptor?.type === "annotation-manipulativeness" && (
                    <AnnotationSlide
                      question="Ohodnoťte manipulativnost článku"
                      value={annotationAnswers.manipulativeness}
                      onChange={(value) =>
                        setAnnotationAnswers((prev) => ({ ...prev, manipulativeness: value }))
                      }
                      labels={{ 1: "Nemanipulativní", 7: "Manipulativní" }}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-separator/40 bg-white/70 px-4 py-4 md:px-6">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="ml-auto flex items-center gap-2 text-lg">
                      <span className="normal-case font-medium">
                        Stiskněte klávesu{" "}
                        <kbd className="rounded-md border border-border bg-muted/40 px-2 py-1 text-base font-semibold text-foreground shadow-sm">
                          MEZERNÍK
                        </kbd>
                        {" "}pro přechod na další stranu
                      </span>
                    </div>
                  </div>
                  {currentSlideDescriptor?.type === "page" &&
                    typeof currentSlideDescriptor.index === "number" && (
                      <div className="ml-auto flex items-center gap-2">
                        {pages.map((_, index) => (
                          <span
                            key={`pagination-${index}`}
                            className={
                              currentSlideDescriptor.index === index
                                ? "inline-flex h-8 w-8 items-center justify-center rounded-md border border-primary bg-primary text-xs font-semibold text-primary-foreground"
                                : "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white/80 text-xs font-semibold text-muted-foreground"
                            }
                            aria-current={currentSlideDescriptor.index === index ? "page" : undefined}
                          >
                            {index + 1}
                          </span>
                        ))}
                      </div>
                    )}
                  {(currentSlideDescriptor?.type === "question" ||
                    currentSlideDescriptor?.type === "novelty-scale" ||
                    currentSlideDescriptor?.type === "credibility-scale" ||
                    currentSlideDescriptor?.type === "manipulativeness-scale") && (
                      <div className="ml-auto flex items-center gap-2">
                        {[1, 2, 3, 4].map((num) => {
                          const isActive =
                            (currentSlideDescriptor?.type === "question" && num === 1) ||
                            (currentSlideDescriptor?.type === "novelty-scale" && num === 2) ||
                            (currentSlideDescriptor?.type === "credibility-scale" && num === 3) ||
                            (currentSlideDescriptor?.type === "manipulativeness-scale" && num === 4);

                          return (
                            <span
                              key={`pagination-question-${num}`}
                              className={
                                isActive
                                  ? "inline-flex h-8 w-8 items-center justify-center rounded-md border border-primary bg-primary text-xs font-semibold text-primary-foreground"
                                  : "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white/80 text-xs font-semibold text-muted-foreground"
                              }
                              aria-current={isActive ? "page" : undefined}
                            >
                              {num}
                            </span>
                          );
                        })}
                      </div>
                    )}
                </div>
              </div>
            </article>
          </div>
        </main>
      </div>
    </div>
  );
}
