import type { Question, SubmissionAnswer } from "@/lib/domain/types";
import { formatRatingAnswer } from "@/lib/rating-scale";

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
  if (!answer) return "—";
  const { value, optionTexts, followUpText } = answer;
  if (value === undefined || value === null) return "—";

  const main = formatMainAnswer(question, value, optionTexts);
  const follow = followUpText?.trim();
  if (follow && question.followUp?.label) {
    return `${main} · ${question.followUp.label} ${follow}`;
  }
  return main;
}
