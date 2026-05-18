import { Button } from "@/components/ui/button";
import { useAnnotateQueue } from "@/hooks/useAnnotateQueue";
import { CheckCircle2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AnnotateDone() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const annotator = searchParams.get("annotator")?.trim() ?? "";
  const queue = useAnnotateQueue(annotator);

  const handleReset = () => {
    queue.resetVisited();
    const first = queue.allIds[0];
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
            ? `Děkujeme, ${annotator}. Všech ${queue.totalCount} článků je anotovaných.`
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
