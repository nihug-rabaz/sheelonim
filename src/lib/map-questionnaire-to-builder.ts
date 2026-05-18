import type { Questionnaire } from "@/lib/domain/types";
import { DEFAULT_THANK_YOU_MESSAGE } from "@/lib/domain/types";
import type {
  QuestionInput,
  QuestionSectionInput,
} from "@/lib/services/questionnaire.service";

export interface QuestionBuilderInitialState {
  title: string;
  description: string;
  isActive: boolean;
  closesAt: string;
  useDefaultMessage: boolean;
  thankYouMessage: string;
  allowRespondentPdfDownload: boolean;
  sections: QuestionSectionInput[];
  questions: QuestionInput[];
  logoSettings: Questionnaire["logoSettings"];
}

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function mapQuestionnaireToBuilderState(
  questionnaire: Questionnaire
): QuestionBuilderInitialState {
  const sections: QuestionSectionInput[] = [...questionnaire.sections]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      type: s.type ?? "REGULAR",
      minRating: s.minRating,
      maxRating: s.maxRating,
      ratingLabels: s.ratingLabels,
    }));

  const questions: QuestionInput[] = [...questionnaire.questions]
    .sort((a, b) => a.order - b.order)
    .map((q) => ({
      id: q.id,
      type: q.type,
      title: q.title,
      required: q.required,
      sectionId: q.sectionId ?? sections[0]?.id ?? "",
      allowMultiple: q.allowMultiple,
      options: q.options?.map((o) => ({
        id: o.id,
        label: o.label,
        allowFreeText: o.allowFreeText,
      })),
      followUp: q.followUp,
      yesNoConfig: q.yesNoConfig,
      minRating: q.minRating,
      maxRating: q.maxRating,
      ratingLabels: q.ratingLabels,
    }));

  return {
    title: questionnaire.title,
    description: questionnaire.description,
    isActive: questionnaire.isActive,
    closesAt: toDatetimeLocalValue(questionnaire.closesAt),
    useDefaultMessage:
      questionnaire.thankYouMessage === DEFAULT_THANK_YOU_MESSAGE,
    thankYouMessage: questionnaire.thankYouMessage,
    allowRespondentPdfDownload: questionnaire.allowRespondentPdfDownload ?? true,
    sections: sections.length > 0 ? sections : [],
    questions,
    logoSettings: questionnaire.logoSettings,
  };
}
