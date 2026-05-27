import type { NewsArticle } from "@/data/news";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type State = {
  articles: NewsArticle[];
  loaded: boolean;
  error: string | null;
};

const Ctx = createContext<State>({
  articles: [],
  loaded: false,
  error: null,
});

export function AnnotationArticlesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({
    articles: [],
    loaded: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}api/articles`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: NewsArticle[]) => {
        if (cancelled) return;
        setState({ articles: data, loaded: true, error: null });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        console.error("[AnnotationArticles] fetch failed:", err);
        setState({ articles: [], loaded: true, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function useAnnotationArticles(): NewsArticle[] {
  return useContext(Ctx).articles;
}

export function useAnnotationArticlesState(): State {
  return useContext(Ctx);
}
