import type { QuestionType } from "@/lib/domain/types";

export const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: "YES_NO", label: "כן / לא" },
  { value: "MULTIPLE_CHOICE", label: "אמריקאי" },
  { value: "TEXT", label: "שדה פתוח" },
  { value: "RATING", label: "דירוג" },
  { value: "LABEL", label: "טקסט הצגה" },
];

const LABELS = Object.fromEntries(
  QUESTION_TYPE_OPTIONS.map((o) => [o.value, o.label])
) as Record<QuestionType, string>;

export function getQuestionTypeLabel(type: QuestionType): string {
  return LABELS[type] ?? type;
}
