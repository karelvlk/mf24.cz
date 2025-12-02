import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

interface ExperimentState {
  isActive: boolean;
  mode: 'experiment' | 'annotate' | null;
  participantId: string;
  articleOrder: string[];
  visitedArticleIds: string[];
}

interface ExperimentModeContextValue extends ExperimentState {
  readonly remainingArticleIds: string[];
  readonly currentArticleId: string | null;
  startExperiment: (participantId: string, articleIdsInOrder: string[], startingIndex?: number) => void;
  startAnnotation: (participantId: string, articleIdsInOrder: string[]) => void;
  endExperiment: () => void;
  markArticleVisited: (articleId: string) => void;
  saveAnnotation: (articleId: string, answers: any) => void;
}

const defaultState: ExperimentState = {
  isActive: false,
  mode: null,
  participantId: "",
  articleOrder: [],
  visitedArticleIds: [],
};

const ExperimentModeContext = createContext<ExperimentModeContextValue | undefined>(undefined);

export function ExperimentModeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ExperimentState>(defaultState);

  const startExperiment = useCallback((participantId: string, articleIdsInOrder: string[], startingIndex = 0) => {
    const safeStartingIndex = Math.max(0, Math.min(articleIdsInOrder.length, startingIndex));
    setState({
      isActive: true,
      mode: 'experiment',
      participantId,
      articleOrder: articleIdsInOrder,
      visitedArticleIds: articleIdsInOrder.slice(0, safeStartingIndex),
    });
  }, []);

  const startAnnotation = useCallback(async (participantId: string, articleIdsInOrder: string[]) => {
    // Load progress from localStorage
    const savedProgress = localStorage.getItem(`annotation_visited_${participantId}`);
    let visitedIds = savedProgress ? JSON.parse(savedProgress) : [];

    // Try to sync existing annotations to server
    try {
      const existingResults = localStorage.getItem('annotation_results');
      if (existingResults) {
        const results = JSON.parse(existingResults);
        if (results.length > 0) {
          await fetch(`${import.meta.env.BASE_URL}api/save-annotation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(results),
          }).then(res => {
            if (res.ok) console.log('Synced existing annotations to server');
          }).catch(err => console.error('Failed to sync annotations:', err));
        }
      }
    } catch (e) {
      console.error('Error syncing annotations:', e);
    }

    // Fetch server-side annotations to update visited list
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/save-annotation`);
      if (response.ok) {
        const serverAnnotations = await response.json();
        if (Array.isArray(serverAnnotations)) {
          const serverVisited = serverAnnotations
            .filter((a: any) => a.annotatorId === participantId)
            .map((a: any) => a.articleId);

          // Merge unique visited IDs
          visitedIds = [...new Set([...visitedIds, ...serverVisited])];

          // Update local storage to match server truth
          localStorage.setItem(`annotation_visited_${participantId}`, JSON.stringify(visitedIds));
        }
      }
    } catch (e) {
      console.error('Error fetching server annotations:', e);
    }

    setState({
      isActive: true,
      mode: 'annotate',
      participantId,
      articleOrder: articleIdsInOrder,
      visitedArticleIds: visitedIds,
    });
  }, []);

  const endExperiment = useCallback(() => {
    setState(defaultState);
  }, []);

  const markArticleVisited = useCallback((articleId: string) => {
    setState((prev) => {
      if (!prev.isActive || !prev.articleOrder.includes(articleId) || prev.visitedArticleIds.includes(articleId)) {
        return prev;
      }

      const newVisited = [...prev.visitedArticleIds, articleId];

      // Persist if in annotation mode
      if (prev.mode === 'annotate') {
        localStorage.setItem(`annotation_visited_${prev.participantId}`, JSON.stringify(newVisited));
      }

      return {
        ...prev,
        visitedArticleIds: newVisited,
      };
    });
  }, []);

  const saveAnnotation = useCallback((articleId: string, answers: any) => {
    if (state.mode !== 'annotate') return;

    const result = {
      annotatorId: state.participantId,
      articleId,
      answers,
      timestamp: new Date().toISOString(),
    };

    // Save to localStorage (append to list)
    const existingResults = localStorage.getItem('annotation_results');
    const results = existingResults ? JSON.parse(existingResults) : [];
    results.push(result);
    localStorage.setItem('annotation_results', JSON.stringify(results));

    // Save to local server (handled by Vite middleware)
    fetch(`${import.meta.env.BASE_URL}api/save-annotation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result),
    }).catch(err => {
      console.error('Failed to save to local server:', err);
    });

    // Also console log for verification
    console.log('Annotation saved:', result);
  }, [state.mode, state.participantId]);

  const derivedState = useMemo(() => {
    const remainingArticleIds = state.articleOrder.filter((id) => !state.visitedArticleIds.includes(id));
    const currentArticleId = remainingArticleIds.length > 0 ? remainingArticleIds[0] : null;

    return {
      ...state,
      remainingArticleIds,
      currentArticleId,
    };
  }, [state]);

  const value = useMemo<ExperimentModeContextValue>(() => ({
    ...derivedState,
    startExperiment,
    startAnnotation,
    endExperiment,
    markArticleVisited,
    saveAnnotation,
  }), [derivedState, startExperiment, startAnnotation, endExperiment, markArticleVisited, saveAnnotation]);

  return (
    <ExperimentModeContext.Provider value={value}>
      {children}
    </ExperimentModeContext.Provider>
  );
}

export function useExperimentMode() {
  const context = useContext(ExperimentModeContext);

  if (!context) {
    throw new Error("useExperimentMode must be used within an ExperimentModeProvider");
  }

  return context;
}
