import { Button } from "@/components/ui/button";
import type { QA } from "@/data/news";
import { useMemo, useState } from "react";

interface ReadingCheckProps {
  questions: QA[];
  variant?: "standalone" | "embedded";
  onCompletionChange?: (completed: boolean) => void;
}

export default function ReadingCheck({
  questions,
  variant = "standalone",
  onCompletionChange
}: ReadingCheckProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | null>>({});

  const filteredQuestions = useMemo(
    () => questions.filter((qa) => qa.question && qa.answers && qa.answers.length > 0),
    [questions]
  );

  if (filteredQuestions.length === 0) {
    onCompletionChange?.(true);
    return null;
  }

  const handleAnswerClick = (questionIndex: number, answerIndex: number) => {
    const nextSelected = {
      ...selectedAnswers,
      [questionIndex]: answerIndex
    };

    setSelectedAnswers(nextSelected);

    const allAnswered = filteredQuestions.every((_, index) => typeof nextSelected[index] === "number");
    onCompletionChange?.(allAnswered);
  };

  const containerClassName =
    variant === "embedded"
      ? "flex h-full flex-col gap-4"
      : "rounded-lg border border-separator/50 bg-muted/30 p-3 space-y-4";

  return (
    <div className={containerClassName}>
      {filteredQuestions.map((qa, questionIndex) => {
        const selectedAnswer = selectedAnswers[questionIndex];

        const itemClass =
          variant === "embedded"
            ? "flex flex-col gap-3"
            : "flex flex-col gap-3 rounded-xl bg-white/70 px-4 py-4 shadow-sm md:px-6 md:py-6";

        const showDivider =
          variant === "embedded" && questionIndex < filteredQuestions.length - 1;

        return (
          <div
            key={`${qa.question}-${questionIndex}`}
            className={itemClass}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {questionIndex + 1}
              </div>
              <div className="flex flex-1 flex-col gap-3">
                <p className="text-base font-semibold text-foreground md:text-lg">
                  {qa.question}
                </p>
                <div className="flex flex-wrap gap-3">
                  {qa.answers.map((answer, answerIndex) => {
                    const isSelected = selectedAnswer === answerIndex;
                    const variant: "default" | "outline" = isSelected ? "default" : "outline";

                    return (
                      <Button
                        key={`${answer.text}-${answerIndex}`}
                        variant={variant}
                        size="sm"
                        className="h-9 min-w-[140px] rounded-full px-5 text-xs font-semibold uppercase tracking-wide md:text-sm"
                        onClick={() => handleAnswerClick(questionIndex, answerIndex)}
                      >
                        {answer.text}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            {showDivider && <div className="h-px bg-separator/30" />}
          </div>
        );
      })}
    </div>
  );
}
