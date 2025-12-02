import { Button } from "@/components/ui/button";
import type { QA } from "@/data/news";
import { cn } from "@/lib/utils";
import { useEffect, useMemo } from "react";

interface QuestionSlideProps {
  question: QA;
  questionIndex: number;
  selectedAnswer: number | null;
  onSelect: (answerIndex: number) => void;
  active: boolean;
}

export default function QuestionSlide({
  question,
  questionIndex,
  selectedAnswer,
  onSelect,
  active
}: QuestionSlideProps) {
  const answerKeys = useMemo(
    () =>
      Array.from(
        { length: Math.max(0, question.answers?.length ?? 0) },
        (_, index) => (index + 1).toString()
      ),
    [question.answers]
  );

  useEffect(() => {
    if (!active || answerKeys.length === 0) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const pressedKey = event.key.toLowerCase();
      const answerIndex = answerKeys.findIndex((key) => key === pressedKey);

      if (answerIndex === -1) {
        return;
      }

      event.preventDefault();
      onSelect(answerIndex);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, answerKeys, onSelect]);

  if (!question.question || !question.answers || question.answers.length === 0) {
    return null;
  }

  return (
    <div
      className="flex h-full w-full flex-col gap-4 rounded-lg border border-separator/40 bg-white/80 px-5 py-4 md:px-8 md:py-6"
      data-question-index={questionIndex}
      data-question-active={active}
      data-answer-count={question.answers.length}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <span>Otázka {questionIndex + 1}</span>
          <div className="flex items-center gap-1 text-[11px] font-medium normal-case">
            <span>Zvolte klávesu</span>
            <div className="flex items-center gap-1">
              {answerKeys.map((key) => (
                <kbd
                  key={`${questionIndex}-hint-${key}`}
                  className="rounded-md border border-border bg-muted/40 px-1.5 py-[2px] font-semibold text-foreground shadow-sm"
                >
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        </div>
        <p className="text-base font-semibold text-foreground md:text-lg">
          {question.question}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {question.answers.map((answer, answerIndex) => {
          const isSelected = selectedAnswer === answerIndex;
          const variant: "default" | "outline" = isSelected ? "default" : "outline";
          const answerKey = answerKeys[answerIndex];

          return (
            <Button
              key={`${questionIndex}-answer-${answerIndex}`}
              variant={variant}
              size="lg"
              className={cn(
                "h-auto min-h-[48px] justify-start gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium md:px-5 md:py-4 md:text-base",
                isSelected && "ring-2 ring-offset-2"
              )}
              onClick={() => onSelect(answerIndex)}
              data-answer-index={answerIndex}
              data-answer-selected={isSelected}
            >
              {answerKey && (
                <kbd className="rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold uppercase text-foreground shadow-sm">
                  {answerKey}
                </kbd>
              )}
              <span>{answer.text}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
