import { Slider } from "@/components/ui/slider";

interface AnnotationSlideProps {
  question: string;
  value: number | undefined;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  labels?: { [key: number]: string };
  showKeyboardHint?: boolean;
  showStepMarkers?: boolean;
  topLeftLabel?: string;
  dataQuestionKind?: string;
  dataQuestionNumber?: number;
  dataOptionCount?: number;
}

export default function AnnotationSlide({
  question,
  value,
  onChange,
  min = 1,
  max = 7,
  step = 1,
  labels,
  showKeyboardHint = false,
  showStepMarkers = false,
  topLeftLabel,
  dataQuestionKind,
  dataQuestionNumber,
  dataOptionCount
}: AnnotationSlideProps) {
  return (
    <div
      className="flex h-full w-full flex-col justify-start gap-5 rounded-lg bg-white/80 px-5 py-4"
      data-question-kind={dataQuestionKind}
      data-question-number={dataQuestionNumber}
      data-option-count={dataOptionCount}
    >
      <div className="flex flex-col gap-3">
        {(topLeftLabel || showKeyboardHint) && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {topLeftLabel && <span>{topLeftLabel}</span>}
            {showKeyboardHint && (
              <div className="flex items-center gap-1 text-[11px] font-medium normal-case">
                <span>Zvolte klávesu</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: max - min + 1 }, (_, idx) => idx + min).map((num) => (
                    <kbd
                      key={`slider-key-${num}`}
                      className="rounded-md border border-border bg-muted/40 px-1.5 py-[2px] font-semibold text-foreground shadow-sm"
                    >
                      {num}
                    </kbd>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <h3 className="text-base font-semibold text-foreground md:text-lg">
          {question}
        </h3>
      </div>

      <div className="flex flex-col gap-6 px-4 md:px-12">
        <div className="flex items-center justify-center">
          <span className="text-4xl font-bold text-primary">
            {value ?? "-"}
          </span>
          <span className="ml-2 text-muted-foreground">/ {max}</span>
        </div>

        <div className="relative">
          <Slider
            value={value ? [value] : [min]}
            min={min}
            max={max}
            step={step}
            onValueChange={(vals) => onChange(vals[0])}
            className="py-4"
          />

          {showStepMarkers && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-between">
              {Array.from({ length: max - min + 1 }, (_, idx) => idx + min).map((num) => (
                <span
                  key={`step-marker-${num}`}
                  className={
                    value === num
                      ? "inline-flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-primary bg-primary text-xs font-semibold text-primary-foreground"
                      : "inline-flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-primary bg-white text-xs font-semibold text-muted-foreground"
                  }
                >
                  {num}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between text-xs text-muted-foreground md:text-sm">
          <span>{labels?.[min] ?? min}</span>
          <span>{labels?.[Math.floor((min + max) / 2)] ?? Math.floor((min + max) / 2)}</span>
          <span>{labels?.[max] ?? max}</span>
        </div>
      </div>
    </div>
  );
}
