import type { Question, QuestionFollowUp, SubmissionAnswer } from "@/lib/domain/types";

export function getSelectedOptionIds(
  question: Question,
  value: SubmissionAnswer["value"] | undefined
): string[] {
  if (value === undefined || value === "") return [];
  if (question.type === "MULTIPLE_CHOICE") {
    return Array.isArray(value) ? value.map(String) : [String(value)];
  }
  return [];
}

export function isFollowUpVisible(
  followUp: QuestionFollowUp | undefined,
  question: Question,
  answerValue: SubmissionAnswer["value"] | undefined
): boolean {
  if (!followUp) return false;
  const showFor = followUp.showForOptionIds;
  if (!showFor?.length) return true;
  const selected = getSelectedOptionIds(question, answerValue);
  if (!selected.length) return false;
  return selected.some((id) => showFor.includes(id));
}

export function isFollowUpRequired(
  followUp: QuestionFollowUp | undefined,
  question: Question,
  answerValue: SubmissionAnswer["value"] | undefined
): boolean {
  if (!followUp?.required) return false;
  if (!isFollowUpVisible(followUp, question, answerValue)) return false;
  const exempt = followUp.exemptFromRequiredOptionIds;
  if (!exempt?.length) return true;
  const selected = getSelectedOptionIds(question, answerValue);
  if (!selected.length) return false;
  return selected.some((id) => !exempt.includes(id));
}
