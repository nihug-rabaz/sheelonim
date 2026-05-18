"use client";

import type { Question, QuestionSection } from "@/lib/domain/types";
import { buildRatingValues, getRatingLabel } from "@/lib/rating-scale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function BuilderRatingScaleEditor({
  minRating,
  maxRating,
  ratingLabels,
  onMinChange,
  onMaxChange,
  onLabelsChange,
}: {
  minRating: number;
  maxRating: number;
  ratingLabels: { value: number; label: string }[];
  onMinChange: (min: number) => void;
  onMaxChange: (max: number) => void;
  onLabelsChange: (labels: { value: number; label: string }[]) => void;
}) {
  const values = buildRatingValues(minRating, maxRating);

  const updateLabel = (value: number, label: string) => {
    onLabelsChange(
      values.map((v) => ({
        value: v,
        label:
          v === value
            ? label
            : (ratingLabels.find((l) => l.value === v)?.label ?? ""),
      }))
    );
  };

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/15 p-4">
      <p className="text-sm font-medium text-foreground">סולם דירוג</p>
      <div className="flex flex-wrap gap-4">
        <div>
          <Label>מינימום</Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={minRating}
            onChange={(e) => onMinChange(Number(e.target.value))}
            className="mt-2 w-24"
          />
        </div>
        <div>
          <Label>מקסימום</Label>
          <Input
            type="number"
            min={2}
            max={10}
            value={maxRating}
            onChange={(e) => onMaxChange(Number(e.target.value))}
            className="mt-2 w-24"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {values.map((value) => (
          <div key={value}>
            <Label className="text-xs text-muted-foreground">
              כותרת מעל {value}
            </Label>
            <Input
              value={ratingLabels.find((l) => l.value === value)?.label ?? ""}
              onChange={(e) => updateLabel(value, e.target.value)}
              placeholder={`לדוגמה: ${value === minRating ? "לא מספיק" : value === maxRating ? "מצוין" : ""}`}
              className="mt-1"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PublicRatingButtons({
  minRating,
  maxRating,
  ratingLabels,
  value,
  onChange,
}: {
  minRating: number;
  maxRating: number;
  ratingLabels?: { value: number; label: string }[];
  value: number | undefined;
  onChange: (n: number) => void;
}) {
  const values = buildRatingValues(minRating, maxRating);

  return (
    <div className="flex flex-wrap justify-end gap-3">
      {values.map((n) => {
        const label = getRatingLabel(ratingLabels, n);
        return (
          <div key={n} className="flex flex-col items-center gap-1.5">
            {label ? (
              <span className="max-w-[5.5rem] text-center text-xs leading-tight text-muted-foreground">
                {label}
              </span>
            ) : null}
            <Button
              type="button"
              variant={value === n ? "default" : "outline"}
              size="sm"
              className="min-w-10"
              onClick={() => onChange(n)}
            >
              {n}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

export function PublicRatingSectionMatrix({
  section,
  questions,
  answers,
  errors,
  onAnswer,
}: {
  section: QuestionSection;
  questions: Question[];
  answers: Record<string, number | undefined>;
  errors: Record<string, string>;
  onAnswer: (questionId: string, value: number) => void;
}) {
  const min = section.minRating ?? 1;
  const max = section.maxRating ?? 5;
  const values = buildRatingValues(min, max);

  return (
    <div className="overflow-x-auto rounded-xl border border-border/50">
      <table className="w-full min-w-[320px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/20">
            <th className="w-[42%] p-3 text-right font-medium text-muted-foreground">
              שאלה
            </th>
            {values.map((v) => {
              const label = getRatingLabel(section.ratingLabels, v);
              return (
              <th key={v} className="p-2 text-center align-bottom">
                {label ? (
                  <span className="mb-1 block text-xs font-normal leading-tight text-muted-foreground">
                    {label}
                  </span>
                ) : null}
                <span className="text-base font-semibold text-foreground">{v}</span>
              </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {questions.map((q, rowIndex) => (
            <tr
              key={q.id}
              className={cn(
                "border-b border-border/40 last:border-0",
                rowIndex % 2 === 1 && "bg-muted/10"
              )}
            >
              <td className="p-3 text-right font-medium text-foreground">
                {q.title}
                {q.required && <span className="text-destructive"> *</span>}
              </td>
              {values.map((v) => (
                <td key={v} className="p-2 text-center">
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === v}
                    onChange={() => onAnswer(q.id, v)}
                    className="size-4 accent-primary"
                    aria-label={`${q.title} — ${getRatingLabel(section.ratingLabels, v) || v}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {questions.map((q) =>
        errors[q.id] ? (
          <p key={`${q.id}-err`} className="px-3 py-2 text-sm text-destructive">
            {q.title}: {errors[q.id]}
          </p>
        ) : null
      )}
    </div>
  );
}
