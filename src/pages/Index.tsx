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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useExperimentMode } from "@/context/ExperimentModeContext";
import {
  datasetOrderingOptions,
  datasetPreviewRows,
  getEmptyFillerArticles,
  newsData,
  type NewsArticle,
} from "@/data/news";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { FlaskConical } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [selectedOrderingId, setSelectedOrderingId] = useState("");
  const [lookupIdQuery, setLookupIdQuery] = useState("");
  const [lookupTextQuery, setLookupTextQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    fulltext: false,
  });
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

  const orderingOptions = useMemo(() => {
    const options = datasetOrderingOptions.flatMap((dataset) => {
      const reversed = [...dataset.order].reverse();
      return [
        { id: dataset.name, label: dataset.name, order: dataset.order },
        { id: `rev:${dataset.name}`, label: `rev-${dataset.name}`, order: reversed },
      ];
    });

    if (options.length === 0) {
      const fallbackOrder = allArticles.map((article) => article.id);
      return [{ id: "default", label: "default", order: fallbackOrder }];
    }

    return options;
  }, [allArticles]);

  const selectedOrdering = useMemo(() => {
    if (!orderingOptions.length) return null;
    return (
      orderingOptions.find((option) => option.id === selectedOrderingId) ??
      orderingOptions[0]
    );
  }, [orderingOptions, selectedOrderingId]);

  const datasetPreview = useMemo(() => {
    if (!datasetPreviewRows.length) return [];

    if (selectedOrdering?.order.length) {
      const rowMap = new Map(
        datasetPreviewRows.map((row) => [row.id, row])
      );
      return selectedOrdering.order
        .map((id) => rowMap.get(id))
        .filter((row): row is typeof datasetPreviewRows[number] => Boolean(row));
    }

    return datasetPreviewRows;
  }, [selectedOrdering, datasetPreviewRows]);

  const orderingPositionMaps = useMemo(() => {
    return orderingOptions.map((option) => {
      const map = new Map<string, string>();
      const total = option.order.length;
      option.order.forEach((id, index) => {
        map.set(id, `${index + 1}/${total}`);
      });
      return { id: option.id, label: option.label, map };
    });
  }, [orderingOptions]);

  const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const columns = useMemo<ColumnDef<typeof datasetPreviewRows[number]>[]>(
    () => {
      const orderingColumns = orderingPositionMaps.map((option) => ({
        id: option.id,
        header: option.label,
        accessorFn: (row: typeof datasetPreviewRows[number]) =>
          option.map.get(row.id) ?? "-",
        enableSorting: true,
        enableColumnFilter: false,
      }));

      return [
        ...orderingColumns,
        {
          id: "id",
          header: "ID",
          accessorFn: (row) => row.id,
          enableSorting: true,
          filterFn: (row, _columnId, value) => {
            const query = String(value ?? "").trim().toLowerCase();
            if (!query) return true;
            const id = String(row.original.id ?? "").toLowerCase();
            if (query.length === 1) {
              const standalonePattern = new RegExp(`\\b${escapeRegExp(query)}\\b`, "i");
              return standalonePattern.test(id);
            }
            return id.includes(query);
          },
        },
        {
          id: "content",
          header: "Content",
          accessorFn: (row) => row.content,
          enableSorting: true,
          enableColumnFilter: false,
        },
        {
          id: "theme",
          header: "Theme",
          accessorFn: (row) => row.theme,
          enableSorting: true,
          enableColumnFilter: false,
        },
        {
          id: "manip",
          header: "Manip",
          accessorFn: (row) => row.manip,
          enableSorting: true,
          enableColumnFilter: false,
        },
        {
          id: "dezinfo",
          header: "Dezinfo",
          accessorFn: (row) => row.dezinfo,
          enableSorting: true,
          enableColumnFilter: false,
        },
        {
          id: "fulltext",
          header: "Fulltext",
          accessorFn: (row) =>
            `${row.id} ${row.content} ${row.theme} ${row.manip} ${row.dezinfo}`,
          enableSorting: false,
          filterFn: (row, _columnId, value) => {
            const query = String(value ?? "").trim().toLowerCase();
            if (!query) return true;
            const haystack = (
              `${row.original.id} ${row.original.content} ${row.original.theme} ` +
              `${row.original.manip} ${row.original.dezinfo}`
            ).toLowerCase();

            if (query.length === 1) {
              const standalonePattern = new RegExp(`\\b${escapeRegExp(query)}\\b`, "i");
              return standalonePattern.test(haystack);
            }

            if (haystack.includes(query)) {
              return true;
            }

            const tokens = query.split(/\s+/).filter(Boolean);
            return tokens.some((token) => token.length >= 2 && haystack.includes(token));
          },
        },
      ];
    },
    [orderingPositionMaps],
  );

  const table = useReactTable({
    data: datasetPreview,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    const trimmed = lookupIdQuery.trim();
    setColumnFilters((prev) => {
      const next = prev.filter((filter) => filter.id !== "id");
      if (trimmed) {
        next.push({ id: "id", value: trimmed });
      }
      return next;
    });
  }, [lookupIdQuery]);

  useEffect(() => {
    const trimmed = lookupTextQuery.trim();
    setColumnFilters((prev) => {
      const next = prev.filter((filter) => filter.id !== "fulltext");
      if (trimmed) {
        next.push({ id: "fulltext", value: trimmed });
      }
      return next;
    });
  }, [lookupTextQuery]);


  useEffect(() => {
    if (!selectedOrderingId && orderingOptions.length > 0) {
      setSelectedOrderingId(orderingOptions[0].id);
    }
  }, [orderingOptions, selectedOrderingId]);

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

  const updateExperimentUrlState = (orderingId: string): string => {
    const params = new URLSearchParams(location.search);
    params.set("mode", "experiment");
    params.set("ordering", orderingId);
    const search = params.toString();
    navigate({ pathname: location.pathname, search }, { replace: true });
    return search;
  };

  const handleStartExperiment = () => {
    const trimmedId = participantInput.trim();
    if (!trimmedId || totalArticles === 0) {
      return;
    }

    const baseOrder =
      selectedOrdering?.order.length
        ? selectedOrdering.order
        : allArticles.map((article) => article.id);
    const orderedIds = baseOrder.filter((id) => articleDictionary.has(id));
    const startIndex = Math.max(0, Math.min(orderedIds.length, safeStartPosition - 1));

    startExperiment(trimmedId, orderedIds, startIndex);
    if (selectedOrdering) {
      updateExperimentUrlState(selectedOrdering.id);
    }
    setIsConfigOpen(false);
  };

  const handleStartExperimentWithOrdering = () => {
    const trimmedId = participantInput.trim() || DEFAULT_TEST_PARTICIPANT;
    const baseOrder =
      selectedOrdering?.order.length
        ? selectedOrdering.order
        : allArticles.map((article) => article.id);
    const orderedIds = baseOrder.filter((id) => articleDictionary.has(id));

    if (!orderedIds.length) return;

    setParticipantInput(trimmedId);
    startExperiment(trimmedId, orderedIds, 0);
    setSelectedMode('none');
    if (selectedOrdering) {
      updateExperimentUrlState(selectedOrdering.id);
    }
    // Don't navigate - stay on home page to show article list
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
    navigate({ pathname: location.pathname, search: "" }, { replace: true });
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
    const firstArticleId =
      (isActive && mode === "experiment"
        ? currentArticleId ?? remainingArticleIds[0]
        : null) ??
      articlesForRendering[0]?.id;

    if (!firstArticleId) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditableTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable === true;

      if (event.key === " " && !isEditableTarget) {
        event.preventDefault();
        navigate({ pathname: `/article/${firstArticleId}`, search: location.search });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [articlesForRendering, currentArticleId, isActive, location.search, mode, navigate, remainingArticleIds]);

  useEffect(() => {
    if (!selectedMode || selectedMode === 'none' || isActive) {
      return;
    }

    const handleSpaceKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditableTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable === true;

      if (event.key === " " && selectedMode === 'experiment' && !isEditableTarget) {
        event.preventDefault();
        handleStartExperimentWithOrdering();
      }
    };

    window.addEventListener("keydown", handleSpaceKey);
    return () => window.removeEventListener("keydown", handleSpaceKey);
  }, [selectedMode, isActive, handleStartExperimentWithOrdering]);

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
            onClick={() => setSelectedMode('experiment')}
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-2">
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

  if (!isActive && selectedMode === 'experiment') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-4">
        <div className="flex w-full max-w-[1024px] flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Experiment</h1>
            <Button variant="ghost" onClick={() => setSelectedMode('none')}>Zpět</Button>
          </div>
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="flex w-full flex-col gap-4 md:w-1/6">
              <div className="grid gap-2">
                <Label htmlFor="ordering-select">Select ordering</Label>
                <select
                  id="ordering-select"
                  value={selectedOrdering?.id ?? ""}
                  onChange={(event) => setSelectedOrderingId(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="" disabled>
                    Vyberte pořadí
                  </option>
                  {orderingOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-md border border-separator/60 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-separator/60 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>Article lookup</span>
                  <span>{datasetPreviewRows.length} rows</span>
                </div>
                <div className="space-y-3 px-3 py-3 text-sm">
                  <div className="grid gap-2">
                    <Label htmlFor="article-lookup-id">Article ID</Label>
                    <Input
                      id="article-lookup-id"
                      value={lookupIdQuery}
                      onChange={(event) => setLookupIdQuery(event.target.value)}
                      placeholder="např. 33"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="article-lookup-text">Fulltext (vsechny sloupce)</Label>
                    <Input
                      id="article-lookup-text"
                      value={lookupTextQuery}
                      onChange={(event) => setLookupTextQuery(event.target.value)}
                      placeholder="např. klima alarmiste"
                    />
                  </div>
                  <div className="rounded-md border border-dashed border-muted-foreground/40 px-3 py-3 text-xs text-muted-foreground">
                    Filtruje náhled tabulky podle zadaného ID nebo klíčových slov.
                  </div>
                </div>
              </div>
              <div className="flex-1" />
              <Button
                onClick={handleStartExperimentWithOrdering}
                disabled={!selectedOrdering || totalArticles === 0}
                className="relative z-0"
              >
                Spustit experiment
              </Button>
              <div className="text-center text-xs text-muted-foreground">
                Nebo stiskněte <kbd className="rounded bg-muted px-2 py-1 font-mono text-[11px]">SPACE</kbd>
              </div>
            </div>

            <div className="w-full md:flex-1">
              <div className="rounded-md border border-separator/60 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-separator/60 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>Preview</span>
                  <span>{table.getFilteredRowModel().rows.length} rows</span>
                </div>
                <div className="h-[calc(100vh-220px)] overflow-auto">
                  <Table className="text-xs">
                    <TableHeader className="sticky top-0 bg-white">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead
                              key={header.id}
                              onClick={header.column.getToggleSortingHandler()}
                              className="cursor-pointer border-b border-separator/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                            >
                              <div className="flex items-center gap-1">
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                                {header.column.getIsSorted() === "asc" && "▲"}
                                {header.column.getIsSorted() === "desc" && "▼"}
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              className="border-b border-separator/40 px-3 py-2 text-[11px] text-foreground"
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      {table.getRowModel().rows.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={table.getVisibleFlatColumns().length}
                            className="px-3 py-6 text-center text-xs text-muted-foreground"
                          >
                            Žádné záznamy k zobrazení.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
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
          <p className="mb-4 text-lg text-muted-foreground">
            Stiskněte klávesu <kbd className="rounded-md border border-border bg-muted/40 px-2 py-1 text-base font-semibold text-foreground shadow-sm">MEZERNÍK</kbd> pro otevření článku.
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
