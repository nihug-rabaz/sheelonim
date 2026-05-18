import type { Question, Questionnaire, Submission } from "@/lib/domain/types";
import { getRatingLabel } from "@/lib/rating-scale";

export interface ChartDatum {
  label: string;
  value: number;
}

export interface QuestionAnalytics {
  questionId: string;
  title: string;
  type: Question["type"];
  chartData: ChartDatum[];
  averageRating?: number;
  textResponses?: string[];
}

export class AnalyticsService {
  analyze(
    questionnaire: Questionnaire,
    submissions: Submission[]
  ): QuestionAnalytics[] {
    return questionnaire.questions.map((question) =>
      this.analyzeQuestion(question, submissions)
    );
  }

  private analyzeQuestion(
    question: Question,
    submissions: Submission[]
  ): QuestionAnalytics {
    const answers = submissions
      .map((s) => s.answers.find((a) => a.questionId === question.id)?.value)
      .filter((v) => v !== undefined && v !== null && v !== "");

    switch (question.type) {
      case "YES_NO":
        return this.analyzeYesNo(question, answers);
      case "MULTIPLE_CHOICE":
        return this.analyzeMultipleChoice(question, answers);
      case "RATING":
        return this.analyzeRating(question, answers);
      case "TEXT":
        return this.analyzeText(question, answers);
      default:
        return {
          questionId: question.id,
          title: question.title,
          type: question.type,
          chartData: [],
        };
    }
  }

  private analyzeYesNo(
    question: Question,
    answers: unknown[]
  ): QuestionAnalytics {
    const counts = { כן: 0, לא: 0 };
    for (const value of answers) {
      if (value === true || value === "true" || value === "כן") counts["כן"]++;
      else counts["לא"]++;
    }
    return {
      questionId: question.id,
      title: question.title,
      type: question.type,
      chartData: [
        { label: "כן", value: counts["כן"] },
        { label: "לא", value: counts["לא"] },
      ],
    };
  }

  private analyzeMultipleChoice(
    question: Question,
    answers: unknown[]
  ): QuestionAnalytics {
    const counts = new Map<string, number>();
    for (const option of question.options ?? []) {
      counts.set(option.label, 0);
    }
    for (const value of answers) {
      const selected = Array.isArray(value) ? value : [value];
      for (const item of selected) {
        const label =
          question.options?.find((o) => o.id === item)?.label ??
          String(item);
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
    }
    return {
      questionId: question.id,
      title: question.title,
      type: question.type,
      chartData: Array.from(counts.entries()).map(([label, value]) => ({
        label,
        value,
      })),
    };
  }

  private analyzeRating(
    question: Question,
    answers: unknown[]
  ): QuestionAnalytics {
    const distribution = new Map<number, number>();
    const min = question.minRating ?? 1;
    const max = question.maxRating ?? 5;
    for (let i = min; i <= max; i++) distribution.set(i, 0);

    let sum = 0;
    let count = 0;
    for (const value of answers) {
      const num = Number(value);
      if (!Number.isNaN(num)) {
        distribution.set(num, (distribution.get(num) ?? 0) + 1);
        sum += num;
        count++;
      }
    }

    return {
      questionId: question.id,
      title: question.title,
      type: question.type,
      averageRating: count > 0 ? Math.round((sum / count) * 10) / 10 : undefined,
      chartData: Array.from(distribution.entries()).map(([rating, value]) => {
        const custom = getRatingLabel(question.ratingLabels, rating);
        return {
          label: custom || String(rating),
          value,
        };
      }),
    };
  }

  private analyzeText(
    question: Question,
    answers: unknown[]
  ): QuestionAnalytics {
    return {
      questionId: question.id,
      title: question.title,
      type: question.type,
      chartData: [],
      textResponses: answers.map(String),
    };
  }
}

export const analyticsService = new AnalyticsService();
