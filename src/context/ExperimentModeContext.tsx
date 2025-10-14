import { createContext, useContext, useMemo, useState, ReactNode, useCallback } from "react";

interface ExperimentState {
  isActive: boolean;
  participantId: string;
  articleOrder: string[];
  visitedArticleIds: string[];
}

interface ExperimentModeContextValue extends ExperimentState {
  readonly remainingArticleIds: string[];
  readonly currentArticleId: string | null;
  startExperiment: (participantId: string, articleIdsInOrder: string[], startingIndex?: number) => void;
  endExperiment: () => void;
  markArticleVisited: (articleId: string) => void;
}

const defaultState: ExperimentState = {
  isActive: false,
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
      participantId,
      articleOrder: articleIdsInOrder,
      visitedArticleIds: articleIdsInOrder.slice(0, safeStartingIndex),
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

      return {
        ...prev,
        visitedArticleIds: [...prev.visitedArticleIds, articleId],
      };
    });
  }, []);

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
    endExperiment,
    markArticleVisited,
  }), [derivedState, startExperiment, endExperiment, markArticleVisited]);

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
