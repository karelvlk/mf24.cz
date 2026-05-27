import { Button } from "@/components/ui/button";
import { useAnnotationArticles } from "@/context/AnnotationArticlesContext";
import { deleteAllAnnotationsForAnnotator } from "@/hooks/useAnnotatorAnnotations";
import { CheckCircle2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AnnotateDone() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const annotator = searchParams.get("annotator")?.trim() ?? "";

  const annotationArticles = useAnnotationArticles();
  const sortedIds = [...annotationArticles]
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    .map((a) => a.id);

  const handleReset = async () => {
    if (!annotator) return;
    const ok = window.confirm(
      `Smazat všechny anotace pro '${annotator}' a začít znovu? Akce je nevratná.`,
    );
    if (!ok) return;
    try {
      await deleteAllAnnotationsForAnnotator(annotator);
    } catch (err) {
      console.error("Reset failed:", err);
      return;
    }
    try {
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
    const first = sortedIds[0];
    if (first) {
      navigate(
        `/article/${first}/annotate?annotator=${encodeURIComponent(annotator)}`,
      );
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-6">
      <CheckCircle2 className="h-16 w-16 text-primary" />
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-foreground">Hotovo</h1>
        <p className="text-sm text-zinc-600">
          {annotator
            ? `Děkujeme, ${annotator}. Všech ${sortedIds.length} článků je anotovaných.`
            : "Všechny články jsou anotované."}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate("/")}>
          Hlavní stránka
        </Button>
        <Button onClick={handleReset} disabled={!annotator}>
          Resetovat postup
        </Button>
      </div>
    </div>
  );
}
