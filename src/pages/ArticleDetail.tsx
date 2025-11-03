import ArticleRating, { RATING_SHORTCUTS } from "@/components/ArticleRating";
import NewsHeader from "@/components/NewsHeader";
import QuestionSlide from "@/components/QuestionSlide";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useExperimentMode } from "@/context/ExperimentModeContext";
import { emptyFillerArticles, newsData } from "@/data/news";
import {
  calculateReadingTime,
  cn,
  formatReadingTimeLabel,
  paginateArticleContent,
} from "@/lib/utils";
import { ArrowLeft, Settings2 } from "lucide-react";
import type { AnimationEvent as ReactAnimationEvent } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const categoryLabels = {
  'zdravi': 'ZDRAVÍ',
  'priroda': 'PŘÍRODA',
  'ceska-politika': 'Z DOMOVA',
  'zahranicni-politika': 'ZE SVĚTA',
  'pohady': 'POHÁDKY'
};

const DEFAULT_FONT_SIZE = 28;
const DEFAULT_LINE_HEIGHT = 2.0;
const DEFAULT_CHARS_PER_LINE = 60;
const DEFAULT_LINES_PER_PAGE = 7;
const APPROX_CHAR_WIDTH_MULTIPLIER = 0.55;
const FALLBACK_AVAILABLE_HEIGHT = 120;
const DEFAULT_MAX_PAGES = 10;

type SlideDescriptor =
  | { type: "page"; index: number }
  | { type: "rating" }
  | { type: "question"; index: number };

const KEYCAP_CLASS =
  "rounded-md border border-border bg-muted/40 px-1.5 py-[2px] text-[11px] font-semibold uppercase tracking-wide text-foreground shadow-sm";

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isActive: experimentActive, markArticleVisited } = useExperimentMode();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [lineHeight, setLineHeight] = useState(DEFAULT_LINE_HEIGHT);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animationState, setAnimationState] = useState<"idle" | "enter" | "exit">("idle");
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);
  const exitTimeoutRef = useRef<number | null>(null);
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);
  const carouselContainerRef = useRef<HTMLDivElement | null>(null);
  const [paginationMetrics, setPaginationMetrics] = useState({
    charsPerLine: DEFAULT_CHARS_PER_LINE,
    linesPerPage: DEFAULT_LINES_PER_PAGE
  });
  const [questionAnswers, setQuestionAnswers] = useState<number[]>([]);

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

    markArticleVisited(article.id);
  }, [article, experimentActive, markArticleVisited]);

  const articleContent = article?.content ?? "";
  const articlePerex = article?.perex ?? "";
  const articleBody =
    articleContent.trim().length > 0 ? articleContent : articlePerex;
  const hasReadingCheck =
    Array.isArray(article?.question) && article.question.length > 0;
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
  const autoPages = useMemo(
    () =>
      paginateArticleContent(articleBody, {
        fontSize: fontSize,
        lineHeight: lineHeight,
        charsPerLine: paginationMetrics.charsPerLine,
        linesPerPage: paginationMetrics.linesPerPage
      }),
    [articleBody, fontSize, lineHeight, paginationMetrics.charsPerLine, paginationMetrics.linesPerPage]
  );
  const effectivePageCount = Math.max(1, pageCount ?? (autoPages.length || 1));
  const pages = useMemo(() => {
    if (pageCount === null) {
      return autoPages;
    }

    return paginateArticleContent(articleBody, { totalPages: effectivePageCount });
  }, [articleBody, autoPages, pageCount, effectivePageCount]);
  const allowRating = Boolean(article) && article.category !== "pohady";
  const slides = useMemo<SlideDescriptor[]>(() => {
    const computedSlides: SlideDescriptor[] = pages.map((_, index) => ({
      type: "page",
      index
    }));

    if (allowRating) {
      computedSlides.push({ type: "rating" });
    }

    questionItems.forEach((_, index) => {
      computedSlides.push({ type: "question", index });
    });

    return computedSlides;
  }, [allowRating, pages, questionItems]);
  const totalSlides = slides.length;
  const [questionsCompleted, setQuestionsCompleted] = useState(!hasReadingCheck);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (shouldReduceMotion) {
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
  }, [shouldReduceMotion]);

  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current !== null) {
        window.clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const handleSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };

    handleSelect();
    carouselApi.on("select", handleSelect);

    return () => {
      carouselApi?.off("select", handleSelect);
    };
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    carouselApi.scrollTo(0);
    setCurrentSlide(0);
  }, [slides.length, carouselApi]);

  useEffect(() => {
    if (!carouselContainerRef.current) {
      return;
    }

    carouselContainerRef.current.focus();
  }, []);

  useEffect(() => {
    if (questionItems.length === 0) {
      setQuestionAnswers([]);
      return;
    }

    setQuestionAnswers((previous) =>
      questionItems.map((_, index) =>
        typeof previous[index] === "number" ? previous[index] : -1
      )
    );
  }, [questionItems]);

  useEffect(() => {
    if (!hasReadingCheck || questionItems.length === 0) {
      setQuestionsCompleted(true);
      return;
    }

    const allAnswered = questionItems.every((_, index) => {
      const answerIndex = questionAnswers[index];
      return typeof answerIndex === "number" && answerIndex >= 0;
    });

    setQuestionsCompleted(allAnswered);
  }, [hasReadingCheck, questionItems, questionAnswers]);

  const handleQuestionAnswer = useCallback((questionIndex: number, answerIndex: number) => {
    setQuestionAnswers((previous) => {
      const next = [...previous];
      next[questionIndex] = answerIndex;
      return next;
    });
  }, []);

  const currentSlideDescriptor = slides[currentSlide] ?? null;
  const currentQuestionKeys =
    currentSlideDescriptor?.type === "question"
      ? Array.from(
          {
            length:
              questionItems[currentSlideDescriptor.index]?.answers?.length ?? 0
          },
          (_, index) => (index + 1).toString()
        )
      : [];
  const showQuestionHints = currentQuestionKeys.length > 0;
  const showRatingHints = currentSlideDescriptor?.type === "rating";

  useLayoutEffect(() => {
    const updateMetrics = () => {
      if (!textContainerRef.current) {
        return;
      }

      const textRect = textContainerRef.current.getBoundingClientRect();
      const controlsTop = controlsRef.current
        ? controlsRef.current.getBoundingClientRect().top
        : window.innerHeight - 32;
      const availableHeight =
        Math.max(
          FALLBACK_AVAILABLE_HEIGHT,
          controlsTop - textRect.top - 16
        );
      const availableWidth = Math.max(320, textRect.width);
      const approxCharWidth = Math.max(fontSize * APPROX_CHAR_WIDTH_MULTIPLIER, 1);
      const nextCharsPerLine = Math.max(
        20,
        Math.floor(availableWidth / approxCharWidth)
      );
      const nextLinesPerPage = Math.max(
        3,
        Math.floor(availableHeight / (fontSize * lineHeight))
      );

      setPaginationMetrics((prev) => {
        if (
          prev.charsPerLine === nextCharsPerLine &&
          prev.linesPerPage === nextLinesPerPage
        ) {
          return prev;
        }
        return {
          charsPerLine: nextCharsPerLine,
          linesPerPage: nextLinesPerPage
        };
      });
    };

    const handleResize = () => {
      updateMetrics();
    };

    updateMetrics();
    window.addEventListener("resize", handleResize);

    let resizeObserver: ResizeObserver | undefined;

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => updateMetrics());
      if (textContainerRef.current) {
        resizeObserver.observe(textContainerRef.current);
      }
      if (controlsRef.current) {
        resizeObserver.observe(controlsRef.current);
      }
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
    };
  }, [fontSize, lineHeight]);

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <NewsHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft size={16} />
              Zpět
            </button>
            <h1 className="headline-primary text-center">Článek nenalezen</h1>
          </div>
        </div>
      </div>
    );
  }

  const readingTimeLabel = formatReadingTimeLabel(
    calculateReadingTime(articleBody)
  );
  const metaItems = [article.published, readingTimeLabel, article.author].filter(Boolean);
  const metaLabel = metaItems.join(" • ");
  const lastUpdatedLabel = new Date().toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const totalPages = pages.length;
  const pageHeight = Math.ceil(fontSize * lineHeight * paginationMetrics.linesPerPage);
  const pageSliderMax = Math.max(DEFAULT_MAX_PAGES, effectivePageCount + 5);

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

  const handlePageCountChange = (value: number[]) => {
    const next = value[0];
    if (typeof next === "number" && Number.isFinite(next)) {
      const rounded = Math.max(1, Math.round(next));
      setPageCount(rounded);
    }
  };

  const handleResetSettings = () => {
    setFontSize(DEFAULT_FONT_SIZE);
    setLineHeight(DEFAULT_LINE_HEIGHT);
    setPageCount(null);
  };

  const completeNavigation = () => {
    if (exitTimeoutRef.current !== null) {
      window.clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }
    navigate(-1);
  };

  const handleBackClick = () => {
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

  const handleCarouselEnd = () => {
    handleBackClick();
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nastavení čtečky</DialogTitle>
              <DialogDescription>
                Upravte velikost písma a řádkování pro pohodlné čtení.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-2">
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
                  min={11}
                  max={32}
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
                  min={1.2}
                  max={2.5}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="article-page-count">Počet stran</Label>
                  <span className="text-sm font-medium text-foreground">
                    {effectivePageCount}
                  </span>
                </div>
                <Slider
                  id="article-page-count"
                  value={[effectivePageCount]}
                  onValueChange={handlePageCountChange}
                  min={1}
                  max={pageSliderMax}
                  step={1}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Rozložení textu se automaticky přizpůsobí velikosti obrazovky a nastavení písma. Počet stran můžete upravit pro rovnoměrné rozdělení textu.
              </p>
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
          <div className="flex h-full w-full max-w-4xl flex-col gap-2 md:gap-3">
            <div className="flex h-12 flex-none items-center justify-between">
              <button
                onClick={handleBackClick}
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft size={16} />
                Zpět
              </button>
              <div className="meta-text text-xs text-muted-foreground">
                Poslední aktualizace {lastUpdatedLabel}
              </div>
            </div>

            <article className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-lg bg-white shadow-sm">
              <div className="flex h-[96px] flex-none flex-col justify-center gap-2 border-b border-separator/50 px-3 md:h-[136px] md:gap-2 md:px-4">
                <h1 className="headline-primary">
                  {article.title}
                </h1>
                <div className="meta-text text-sm text-muted-foreground">
                  {metaLabel}
                </div>
              </div>

              <div className="flex flex-1 min-h-0 flex-col overflow-hidden px-1 py-3 md:px-2">
                <div ref={textContainerRef} className="flex flex-1 min-h-0 flex-col overflow-hidden">
                  <Carousel
                    ref={carouselContainerRef}
                    className="flex h-full min-h-0 flex-1 flex-col"
                    tabIndex={0}
                    aria-label="Čtečka článku"
                    setApi={setCarouselApi}
                    opts={{ loop: false }}
                    onReachEnd={handleCarouselEnd}
                  >
                    <CarouselContent className="h-full min-h-0 !ml-0">
                      {slides.map((slide, slideIndex) => {
                        if (slide.type === "page" && typeof slide.index === "number") {
                          const page = pages[slide.index];
                          const pageText = (page ?? "").replace(/\n+/g, " ").trim();

                          return (
                            <CarouselItem key={`page-${slide.index}`} className="flex h-full min-h-0 !pl-0">
                              <div className="flex h-full w-full min-h-0">
                                <div
                                  className="flex h-full min-h-0 w-full flex-col rounded-md bg-white/80 px-1.5 py-3 md:px-3"
                                  style={{
                                    fontSize: `${fontSize}px`,
                                    lineHeight,
                                    height: "100%",
                                    minHeight: `${pageHeight}px`
                                  }}
                                >
                                  <p
                                    className="w-full pb-1 text-foreground break-words"
                                    style={{ textAlign: "justify", textJustify: "inter-word" }}
                                  >
                                    {pageText}
                                  </p>
                                </div>
                              </div>
                            </CarouselItem>
                          );
                        }

                        if (slide.type === "rating") {
                          return (
                            <CarouselItem key="rating-slide" className="flex h-full min-h-0 !pl-0">
                              <div className="flex h-full w-full items-start">
                                <div className="w-full">
                                  <ArticleRating
                                    articleId={article.id}
                                    onRatingChange={(rating) => console.log("Article rated:", rating)}
                                    showRating={allowRating}
                                    active={currentSlide === slideIndex}
                                  />
                                </div>
                              </div>
                            </CarouselItem>
                          );
                        }

                        if (slide.type === "question" && typeof slide.index === "number") {
                          const question = questionItems[slide.index];

                          return (
                            <CarouselItem key={`question-${slide.index}`} className="flex h-full min-h-0 !pl-0">
                              <div className="flex h-full w-full items-start">
                                <div className="w-full">
                                  <QuestionSlide
                                    question={question}
                                    questionIndex={slide.index}
                                    selectedAnswer={
                                      typeof questionAnswers[slide.index] === "number"
                                        ? questionAnswers[slide.index]
                                        : null
                                    }
                                    onSelect={(answerIndex) => handleQuestionAnswer(slide.index, answerIndex)}
                                    active={currentSlide === slideIndex}
                                  />
                                </div>
                              </div>
                            </CarouselItem>
                          );
                        }

                        return null;
                      })}
                    </CarouselContent>
                  </Carousel>
                </div>

                <div
                  ref={controlsRef}
                  className="flex h-[72px] flex-none flex-col items-center justify-center gap-3 border-t border-separator/40 px-3 pt-3 md:h-[84px] md:flex-row md:items-center md:justify-between md:gap-6 md:px-4"
                >
                  <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-3">
                    <span className="text-sm text-muted-foreground">
                      Strana {Math.min(currentSlide + 1, totalSlides)} / {totalSlides}
                    </span>
                    {totalSlides > 1 && (
                      <div className="flex items-center gap-2">
                        {slides.map((_, index) => (
                          <span
                            key={`progress-${index}`}
                            className={cn(
                              "block rounded-full transition-all",
                              currentSlide === index
                                ? "h-3.5 w-3.5 bg-primary"
                                : "h-2 w-2 bg-muted-foreground/50"
                            )}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex w-full flex-col items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground md:ml-auto md:flex-row md:justify-end md:gap-4 md:text-xs">
                    {showQuestionHints && (
                      <div className="flex items-center gap-1">
                        {currentQuestionKeys.map((key) => (
                          <kbd key={`question-hint-${key}`} className={KEYCAP_CLASS}>
                            {key}
                          </kbd>
                        ))}
                        <span className="normal-case text-[12px] font-medium md:text-[13px]">
                          pro odpověď
                        </span>
                      </div>
                    )}
                    {showRatingHints && (
                      <div className="flex items-center gap-1">
                        {RATING_SHORTCUTS.map(({ key }) => (
                          <kbd key={`rating-hint-${key}`} className={KEYCAP_CLASS}>
                            {key}
                          </kbd>
                        ))}
                        <span className="normal-case text-[12px] font-medium md:text-[13px]">
                          pro odpověď
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <kbd className={KEYCAP_CLASS}>→</kbd>
                      <span className="normal-case text-[12px] font-medium md:text-[13px]">
                        pro pokračování
                      </span>
                    </div>
                  </div>
                  <div className="flex w-full justify-center md:w-auto md:justify-end" />
                </div>
              </div>
            </article>
          </div>
        </main>
      </div>
    </div>
  );
}
