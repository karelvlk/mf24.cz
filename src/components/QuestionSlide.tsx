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
    () => {
      if (questionIndex === 0 && question.answers?.length === 2) {
        return ["3", "4"];
      }
      return Array.from(
        { length: Math.max(0, question.answers?.length ?? 0) },
        (_, index) => (index + 1).toString()
      );
    },
    [question.answers, questionIndex]
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
      className="flex h-full w-full flex-col gap-4 rounded-lg bg-white/80 px-5 py-4"
      data-question-index={questionIndex}
      data-question-active={active}
      data-answer-count={question.answers.length}
    >
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between text-lg font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <span>Otázka {questionIndex + 1}</span>
          <div className="flex items-center gap-1 text-base font-medium normal-case">
            <span>Zvolte klávesu</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((key) => (
                <kbd
                  key={`${questionIndex}-hint-${key}`}
                  className="rounded-md border border-border bg-muted/40 px-2 py-1 text-base font-semibold text-foreground shadow-sm"
                >
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xl font-semibold text-foreground md:text-2xl">
            {question.question.split('?')[0] + '?'}
          </p>
          <p className="text-lg text-muted-foreground italic">
            Odpovídejte pouze na základě přečteného textu.
          </p>
        </div>
      </div>

      <div className={cn(
        "flex flex-1",
        questionIndex === 0 ? "flex-row gap-8" : "flex-col gap-2"
      )}>
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
                "justify-start gap-3 rounded-xl px-4 py-3 text-left text-lg font-medium md:px-5 md:py-4 md:text-xl",
                isSelected && "ring-2 ring-offset-2",
                questionIndex === 0 ? "h-[80px] flex-1" : "h-auto min-h-[48px]"
              )}
              onClick={() => onSelect(answerIndex)}
              data-answer-index={answerIndex}
              data-answer-selected={isSelected}
            >
              {answerKey && (
                <>
                  {answerKey === "3" && (
                    <>
                      {/* <kbd className="rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold uppercase text-foreground shadow-sm">
                        1
                      </kbd>
                      <kbd className="rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold uppercase text-foreground shadow-sm">
                        2
                      </kbd> */}
                      <kbd className="rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold uppercase text-foreground shadow-sm">
                        3
                      </kbd>
                    </>
                  )}
                  {answerKey === "4" && (
                    <>
                      <kbd className="rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold uppercase text-foreground shadow-sm">
                        4
                      </kbd>
                      {/* <kbd className="rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold uppercase text-foreground shadow-sm">
                        5
                      </kbd> */}
                    </>
                  )}
                  {answerKey !== "3" && answerKey !== "4" && (
                    <kbd className="rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold uppercase text-foreground shadow-sm">
                      {answerKey}
                    </kbd>
                  )}
                </>
              )}
              <span>{answer.text}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
