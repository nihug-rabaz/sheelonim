import type { Question, SubmissionAnswer } from "@/lib/domain/types";
import { formatRatingAnswer } from "@/lib/rating-scale";
import { isLabelQuestion } from "@/lib/question-utils";
import {
  formatYesNoBranchFieldValue,
  getYesNoBranchFields,
} from "@/lib/yes-no-logic";

function formatMainAnswer(
  question: Question,
  value: SubmissionAnswer["value"],
  optionTexts?: Record<string, string>
): string {
  if (question.type === "YES_NO") {
    return value === true || value === "true" ? "כן" : "לא";
  }

  if (question.type === "RATING") {
    return formatRatingAnswer(question.ratingLabels, Number(value));
  }

  if (question.type === "MULTIPLE_CHOICE") {
    const ids = Array.isArray(value) ? value : [String(value)];
    return ids
      .map((id) => {
        const opt = question.options?.find((o) => o.id === id);
        const label = opt?.label ?? String(id);
        const text = optionTexts?.[id];
        return text?.trim() ? `${label}: ${text}` : label;
      })
      .join(", ");
  }

  return String(value);
}

export function formatQuestionAnswer(
  question: Question,
  answer: SubmissionAnswer | undefined
): string {
  if (isLabelQuestion(question)) return "—";
  if (!answer) return "—";
  const { value, optionTexts, followUpText, branchFieldTexts } = answer;
  if (value === undefined || value === null) return "—";

  const main = formatMainAnswer(question, value, optionTexts);
  const parts = [main];

  const branchFields = getYesNoBranchFields(question.yesNoConfig, value);
  for (const field of branchFields) {
    const text = branchFieldTexts?.[field.id]?.trim();
    if (text) {
      parts.push(`${field.label}: ${formatYesNoBranchFieldValue(field, text)}`);
    }
  }

  const follow = followUpText?.trim();
  if (follow && question.followUp?.label) {
    parts.push(`${question.followUp.label} ${follow}`);
  }
  return parts.join(" · ");
}
