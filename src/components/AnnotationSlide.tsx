import { Slider } from "@/components/ui/slider";

interface AnnotationSlideProps {
  question: string;
  value: number | undefined;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  labels?: { [key: number]: string };
}

export default function AnnotationSlide({
  question,
  value,
  onChange,
  min = 1,
  max = 7,
  step = 1,
  labels
}: AnnotationSlideProps) {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-8 rounded-lg border border-separator/40 bg-white/80 px-5 py-4 md:px-8 md:py-6">
      <div className="flex flex-col gap-4 text-center">
        <h3 className="text-xl font-semibold text-foreground md:text-2xl">
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

        <Slider
          value={value ? [value] : [min]}
          min={min}
          max={max}
          step={step}
          onValueChange={(vals) => onChange(vals[0])}
          className="py-4"
        />

        <div className="flex justify-between text-xs text-muted-foreground md:text-sm">
          <span>{labels?.[min] ?? min}</span>
          <span>{labels?.[max] ?? max}</span>
        </div>
      </div>
    </div>
  );
}
