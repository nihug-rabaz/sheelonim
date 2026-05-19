import type { Question, Submission, SubmissionAnswer } from "@/lib/domain/types";
import { formatQuestionAnswer } from "@/lib/format-question-answer";
import { isLabelQuestion } from "@/lib/question-utils";

export function isLiveSubmission(submission: Submission): boolean {
  return !submission.isPreview;
}

export function filterLiveSubmissions(submissions: Submission[]): Submission[] {
  return submissions.filter(isLiveSubmission);
}

export function getSubmissionAnswer(
  submission: Submission,
  questionId: string
): SubmissionAnswer | undefined {
  return submission.answers.find((a) => a.questionId === questionId);
}

export function answerMatchesFilter(
  question: Question,
  answer: SubmissionAnswer | undefined,
  filterValue: string
): boolean {
  if (!filterValue) return true;
  if (!answer) return false;

  const { value } = answer;
  if (question.type === "YES_NO") {
    const normalized =
      value === true || value === "true" ? "yes" : "no";
    return normalized === filterValue;
  }

  if (question.type === "MULTIPLE_CHOICE") {
    const selected = Array.isArray(value) ? value : [String(value)];
    return selected.includes(filterValue);
  }

  if (question.type === "RATING") {
    return String(value) === filterValue;
  }

  return formatQuestionAnswer(question, answer)
    .toLowerCase()
    .includes(filterValue.toLowerCase());
}

export function getCrossTabFilterOptions(
  question: Question
): { value: string; label: string }[] {
  if (question.type === "YES_NO") {
    return [
      { value: "yes", label: "כן" },
      { value: "no", label: "לא" },
    ];
  }
  if (question.type === "MULTIPLE_CHOICE") {
    return (question.options ?? []).map((o) => ({
      value: o.id,
      label: o.label.trim() || "ללא שם",
    }));
  }
  if (question.type === "RATING") {
    const min = question.minRating ?? 1;
    const max = question.maxRating ?? 5;
    const options: { value: string; label: string }[] = [];
    for (let i = min; i <= max; i++) {
      options.push({ value: String(i), label: String(i) });
    }
    return options;
  }
  return [];
}

export function canCrossTabSource(question: Question): boolean {
  return (
    !isLabelQuestion(question) &&
    (question.type === "MULTIPLE_CHOICE" ||
      question.type === "YES_NO" ||
      question.type === "RATING")
  );
}
