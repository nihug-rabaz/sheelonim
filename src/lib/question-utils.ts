import type { Question } from "@/lib/domain/types";

export function isLabelQuestion(question: Question): boolean {
  return question.type === "LABEL";
}

export function isAnswerableQuestion(question: Question): boolean {
  return question.type !== "LABEL";
}

export function countAnswerableQuestions(questions: Question[]): number {
  return questions.filter(isAnswerableQuestion).length;
}
