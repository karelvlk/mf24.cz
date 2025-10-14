import ArticleRating from "@/components/ArticleRating";
import NewsHeader from "@/components/NewsHeader";
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
import { emptyFillerArticles, newsData } from "@/data/news";
import {
  calculateReadingTime,
  formatReadingTimeLabel,
  paginateArticleContent,
} from "@/lib/utils";
import { ArrowLeft, Settings2 } from "lucide-react";
import type { AnimationEvent as ReactAnimationEvent } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const categoryLabels = {
  'zdravi': 'ZDRAVÍ',
  'priroda': 'PŘÍRODA',
  'ceska-politika': 'Z DOMOVA',
  'zahranicni-politika': 'ZE SVĚTA',
  'pohady': 'POHÁDKY'
};

const DEFAULT_FONT_SIZE = 18;
const DEFAULT_LINE_HEIGHT = 1.6;
const DEFAULT_CHARS_PER_LINE = 60;
const DEFAULT_LINES_PER_PAGE = 7;
const APPROX_CHAR_WIDTH_MULTIPLIER = 0.55;
const FALLBACK_AVAILABLE_HEIGHT = 120;
const DEFAULT_MAX_PAGES = 10;

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  const [paginationMetrics, setPaginationMetrics] = useState({
    charsPerLine: DEFAULT_CHARS_PER_LINE,
    linesPerPage: DEFAULT_LINES_PER_PAGE
  });

  // Find article in all categories
  const allArticles = [
    ...Object.values(newsData).flat(),
    ...emptyFillerArticles
  ];

  const article = allArticles.find(a => a.id === id);

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

  const articleBody =
    article.content && article.content.trim().length > 0
      ? article.content
      : article.perex;

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
  const totalPages = pages.length;
  const pageHeight = Math.ceil(fontSize * lineHeight * paginationMetrics.linesPerPage);
  const pageSliderMax = Math.max(DEFAULT_MAX_PAGES, effectivePageCount + 5);

  const hasReadingCheck = Array.isArray(article.question) && article.question.length > 0;
  const allowRating = article.category !== "pohady";
  const shouldRenderFooterSection = hasReadingCheck || allowRating;
  const totalSlides = totalPages + (shouldRenderFooterSection ? 1 : 0);

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
  }, [pages.length, shouldRenderFooterSection, carouselApi]);

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

  const handlePrev = () => carouselApi?.scrollPrev();
  const handleNext = () => carouselApi?.scrollNext();

  const prevDisabled = currentSlide === 0;
  const nextDisabled = currentSlide >= totalSlides - 1;

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
        <main className="flex flex-1 justify-center overflow-hidden px-3 py-4 md:px-4 md:py-8">
          <div className="flex h-full w-full max-w-3xl flex-col gap-3 md:gap-4">
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
              <div className="flex h-[120px] flex-none flex-col justify-center gap-2 border-b border-separator/50 px-5 md:h-[160px] md:gap-3 md:px-6">
                <h1 className="headline-primary">
                  {article.title}
                </h1>
                <div className="meta-text text-sm text-muted-foreground">
                  {metaLabel}
                </div>
              </div>

              <div className="flex flex-1 min-h-0 flex-col overflow-hidden px-3 py-4 md:px-5">
                <div ref={textContainerRef} className="flex flex-1 min-h-0 flex-col overflow-hidden">
                  <Carousel
                    className="flex h-full min-h-0 flex-1 flex-col"
                    setApi={setCarouselApi}
                    opts={{ loop: false }}
                  >
                    <CarouselContent className="h-full min-h-0">
                      {Array.from({ length: totalSlides }).map((_, index) => {
                        if (index < totalPages) {
                          const page = pages[index];

                          return (
                            <CarouselItem key={`page-${index}`} className="flex h-full min-h-0">
                              <div className="flex h-full w-full min-h-0">
                                <div
                                  className="flex h-full min-h-0 w-full flex-col rounded-md bg-white/80 px-4 py-4 md:px-6"
                                  style={{
                                    fontSize: `${fontSize}px`,
                                    lineHeight,
                                    height: "100%",
                                    minHeight: `${pageHeight}px`
                                  }}
                                >
                                  <p className="flex-1 whitespace-pre-wrap pb-1 text-foreground">
                                    {page}
                                  </p>
                                </div>
                              </div>
                            </CarouselItem>
                          );
                        }

                        return (
                          <CarouselItem key="rating-slide" className="flex h-full min-h-0">
                            <div className="flex h-full w-full items-start">
                              <div className="w-full">
                                <ArticleRating
                                  articleId={article.id}
                                  onRatingChange={(rating) => console.log("Article rated:", rating)}
                                  showRating={allowRating}
                                  questions={hasReadingCheck ? article.question : undefined}
                                />
                              </div>
                            </div>
                          </CarouselItem>
                        );
                      })}
                    </CarouselContent>
                  </Carousel>
                </div>

                <div
                  ref={controlsRef}
                  className="flex h-[80px] flex-none flex-col items-center justify-center gap-3 border-t border-separator/40 pt-4 md:h-[104px] md:flex-row md:justify-between"
                >
                  <span className="text-sm text-muted-foreground">
                    Strana {Math.min(currentSlide + 1, totalSlides)} / {totalSlides}
                  </span>
                  {totalSlides > 1 && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePrev}
                        disabled={prevDisabled}
                      >
                        Předchozí
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleNext}
                        disabled={nextDisabled}
                      >
                        Další
                      </Button>
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
