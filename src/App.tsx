import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ExperimentModeProvider } from "@/context/ExperimentModeContext";
import { ScreenshotModeProvider } from "@/context/ScreenshotModeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AnalysisPage from "./pages/AnalysisPage";
import ArticleDetail from "./pages/ArticleDetail";
import CategoryPage from "./pages/CategoryPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ExperimentModeProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <ScreenshotModeProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/analysis/:tab" element={<AnalysisPage />} />
              <Route path="/article/:id" element={<ArticleDetail />} />
              <Route path="/:category" element={<CategoryPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ScreenshotModeProvider>
        </BrowserRouter>
      </ExperimentModeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
