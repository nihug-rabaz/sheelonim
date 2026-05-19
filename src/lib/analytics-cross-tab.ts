import type { Question, Submission } from "@/lib/domain/types";
import { formatQuestionAnswer } from "@/lib/format-question-answer";
import { isLabelQuestion } from "@/lib/question-utils";
import {
  answerMatchesFilter,
  getSubmissionAnswer,
} from "@/lib/submission-utils";

export interface CrossTabRow {
  label: string;
  count: number;
}

export function computeCrossTabulation(
  submissions: Submission[],
  sourceQuestion: Question,
  sourceFilterValue: string,
  targetQuestion: Question
): CrossTabRow[] {
  const matched = submissions.filter((s) =>
    answerMatchesFilter(
      sourceQuestion,
      getSubmissionAnswer(s, sourceQuestion.id),
      sourceFilterValue
    )
  );

  const counts = new Map<string, number>();

  if (targetQuestion.type === "MULTIPLE_CHOICE") {
    for (const option of targetQuestion.options ?? []) {
      counts.set(option.label.trim() || "ללא שם", 0);
    }
  }

  for (const submission of matched) {
    const answer = getSubmissionAnswer(submission, targetQuestion.id);
    const label = isLabelQuestion(targetQuestion)
      ? "—"
      : formatQuestionAnswer(targetQuestion, answer);
    const key = label === "—" ? "(ללא מענה)" : label;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
