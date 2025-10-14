import { Button } from "@/components/ui/button";
import type { QA } from "@/data/news";
import { useMemo, useState } from "react";

interface ReadingCheckProps {
  questions: QA[];
  variant?: "standalone" | "embedded";
}

type AnswerStatus = "correct" | "incorrect" | undefined;

export default function ReadingCheck({ questions, variant = "standalone" }: ReadingCheckProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | null>>({});
  const [answerStatuses, setAnswerStatuses] = useState<Record<number, AnswerStatus>>({});

  const filteredQuestions = useMemo(
    () => questions.filter((qa) => qa.question && qa.answers && qa.answers.length > 0),
    [questions]
  );

  if (filteredQuestions.length === 0) {
    return null;
  }

  const handleAnswerClick = (questionIndex: number, answerIndex: number) => {
    const question = filteredQuestions[questionIndex];
    const answer = question?.answers?.[answerIndex];

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex
    }));

    setAnswerStatuses((prev) => ({
      ...prev,
      [questionIndex]: answer?.is_correct ? "correct" : "incorrect"
    }));
  };

  const containerClassName =
    variant === "embedded"
      ? "space-y-2"
      : "rounded-lg border border-separator/50 bg-muted/30 p-3 space-y-4";

  return (
    <div className={containerClassName}>
      {filteredQuestions.map((qa, questionIndex) => {
        const status = answerStatuses[questionIndex];
        const selectedAnswer = selectedAnswers[questionIndex];

        return (
          <div key={`${qa.question}-${questionIndex}`} className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <p className="text-sm font-medium text-foreground sm:flex-1 sm:text-base">
                {qa.question}
              </p>
              <div className="flex flex-wrap gap-2 sm:flex-none sm:justify-end">
                {qa.answers.map((answer, answerIndex) => {
                  const isSelected = selectedAnswer === answerIndex;
                  let variant: "default" | "destructive" | "outline" = "outline";

                  if (isSelected && status === "correct") {
                    variant = "default";
                  } else if (isSelected && status === "incorrect") {
                    variant = "destructive";
                  }

                  return (
                    <Button
                      key={`${answer.text}-${answerIndex}`}
                      variant={variant}
                      size="sm"
                      className="h-8 min-w-[110px] px-3 text-xs font-medium"
                      onClick={() => handleAnswerClick(questionIndex, answerIndex)}
                    >
                      {answer.text}
                    </Button>
                  );
                })}
              </div>
            </div>

            {status === "correct" && (
              <p className="text-xs text-emerald-600 sm:text-sm">
                Správná odpověď. Děkujeme, že čtete pozorně!
              </p>
            )}
            {status === "incorrect" && (
              <p className="text-xs text-destructive sm:text-sm">
                Tato odpověď nesouhlasí s textem. Zkuste to znovu.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
