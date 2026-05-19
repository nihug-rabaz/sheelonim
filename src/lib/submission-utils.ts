import type { Question, Questionnaire, Submission, SubmissionAnswer } from "@/lib/domain/types";
import { formatQuestionAnswer } from "@/lib/format-question-answer";
import { isLabelQuestion } from "@/lib/question-utils";
import { formatDateTime } from "@/lib/utils";
import { formatPhoneDisplay } from "@/lib/validators/phone";

export const EMPTY_ANSWER_LABEL = "(ללא מענה)";

export type ColumnFiltersState = Record<string, string[]>;

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

function formatMcOptionLabel(
  question: Question,
  optionId: string,
  answer: SubmissionAnswer
): string {
  const opt = question.options?.find((o) => o.id === optionId);
  const label = opt?.label?.trim() || "ללא שם";
  const text = answer.optionTexts?.[optionId];
  return text?.trim() ? `${label}: ${text}` : label;
}

export function getSubmissionColumnValues(
  columnKey: string,
  questionnaire: Questionnaire,
  submission: Submission
): string[] {
  if (columnKey === "phone") {
    return [formatPhoneDisplay(submission.phone)];
  }
  if (columnKey === "date") {
    return [formatDateTime(submission.submittedAt)];
  }

  const question = questionnaire.questions.find((q) => q.id === columnKey);
  if (!question || isLabelQuestion(question)) return [];

  const answer = getSubmissionAnswer(submission, columnKey);
  if (
    !answer ||
    answer.value === undefined ||
    answer.value === null ||
    answer.value === ""
  ) {
    return [EMPTY_ANSWER_LABEL];
  }

  if (question.type === "MULTIPLE_CHOICE") {
    const ids = Array.isArray(answer.value)
      ? answer.value.map(String)
      : [String(answer.value)];
    if (ids.length === 0) return [EMPTY_ANSWER_LABEL];
    return ids.map((id) => formatMcOptionLabel(question, id, answer));
  }

  const text = formatQuestionAnswer(question, answer);
  return text === "—" ? [EMPTY_ANSWER_LABEL] : [text];
}

export function submissionMatchesColumnFilter(
  submission: Submission,
  columnKey: string,
  selectedValues: string[],
  questionnaire: Questionnaire
): boolean {
  if (selectedValues.length === 0) return true;
  const cellValues = getSubmissionColumnValues(columnKey, questionnaire, submission);
  return cellValues.some((v) => selectedValues.includes(v));
}

export function submissionMatchesAllColumnFilters(
  submission: Submission,
  filters: ColumnFiltersState,
  questionnaire: Questionnaire,
  exceptColumnKey?: string
): boolean {
  for (const [columnKey, selected] of Object.entries(filters)) {
    if (columnKey === exceptColumnKey || selected.length === 0) continue;
    if (
      !submissionMatchesColumnFilter(
        submission,
        columnKey,
        selected,
        questionnaire
      )
    ) {
      return false;
    }
  }
  return true;
}

export function getColumnFilterOptions(
  submissions: Submission[],
  columnKey: string,
  filters: ColumnFiltersState,
  questionnaire: Questionnaire
): string[] {
  const pool = submissions.filter((s) =>
    submissionMatchesAllColumnFilters(s, filters, questionnaire, columnKey)
  );
  const values = new Set<string>();
  for (const submission of pool) {
    for (const value of getSubmissionColumnValues(
      columnKey,
      questionnaire,
      submission
    )) {
      values.add(value);
    }
  }
  return [...values].sort((a, b) => a.localeCompare(b, "he"));
}

export function filterSubmissionsByColumns(
  submissions: Submission[],
  filters: ColumnFiltersState,
  questionnaire: Questionnaire
): Submission[] {
  return submissions.filter((s) =>
    submissionMatchesAllColumnFilters(s, filters, questionnaire)
  );
}

export function hasActiveColumnFilters(filters: ColumnFiltersState): boolean {
  return Object.values(filters).some((selected) => selected.length > 0);
}
