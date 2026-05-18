import type { RatingScaleLabel } from "@/lib/domain/types";

export function buildRatingValues(min: number, max: number): number[] {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
}

export function normalizeRatingLabels(
  min: number,
  max: number,
  existing: RatingScaleLabel[] = []
): RatingScaleLabel[] {
  return buildRatingValues(min, max).map((value) => {
    const found = existing.find((l) => l.value === value);
    return { value, label: found?.label ?? "" };
  });
}

export function getRatingLabel(
  labels: RatingScaleLabel[] | undefined,
  value: number
): string {
  return labels?.find((l) => l.value === value)?.label?.trim() ?? "";
}

export function formatRatingAnswer(
  labels: RatingScaleLabel[] | undefined,
  value: number
): string {
  const label = getRatingLabel(labels, value);
  return label || String(value);
}
