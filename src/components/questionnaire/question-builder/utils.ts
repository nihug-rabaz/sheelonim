import { v4 as uuidv4 } from "uuid";
import type { QuestionnaireLogoSettings, SectionType } from "@/lib/domain/types";
import { emptyLogoSettings } from "@/lib/brand-logos";
import { DEFAULT_THANK_YOU_MESSAGE } from "@/lib/domain/types";
import { normalizeRatingLabels } from "@/lib/rating-scale";
import type {
  QuestionInput,
  QuestionSectionInput,
} from "@/lib/services/questionnaire.service";
import type { QuestionBuilderInitialState } from "@/lib/map-questionnaire-to-builder";

export function createSection(type: SectionType = "REGULAR"): QuestionSectionInput {
  const min = 1;
  const max = 5;
  return {
    id: uuidv4(),
    title: type === "RATING" ? "פרק דירוג" : "פרק חדש",
    description: "",
    type,
    minRating: min,
    maxRating: max,
    ratingLabels: normalizeRatingLabels(min, max),
  };
}

export function createLabelBlock(sectionId: string): QuestionInput {
  return {
    type: "LABEL",
    title: "",
    required: false,
    sectionId,
  };
}

export function createQuestion(
  sectionId: string,
  sectionType: SectionType = "REGULAR"
): QuestionInput {
  return {
    type: sectionType === "RATING" ? "RATING" : "YES_NO",
    title: "",
    required: false,
    sectionId,
    allowMultiple: false,
    options: [
      { id: uuidv4(), label: "אפשרות 1" },
      { id: uuidv4(), label: "אפשרות 2" },
    ],
    minRating: 1,
    maxRating: 5,
    ratingLabels: normalizeRatingLabels(1, 5),
  };
}

export function buildEmptyState(): QuestionBuilderInitialState {
  const section = createSection("REGULAR");
  return {
    title: "",
    subtitle: "",
    description: "",
    isActive: true,
    closesAt: "",
    useDefaultMessage: true,
    thankYouMessage: DEFAULT_THANK_YOU_MESSAGE,
    allowRespondentPdfDownload: true,
    sections: [section],
    questions: [createQuestion(section.id!, "REGULAR")],
    logoSettings: emptyLogoSettings(),
  };
}

export type QuestionBuilderFormData = {
  title: string;
  subtitle: string;
  description: string;
  isActive: boolean;
  closesAt: string | null;
  thankYouMessage: string;
  allowRespondentPdfDownload: boolean;
  sections: QuestionSectionInput[];
  questions: QuestionInput[];
  logoSettings: QuestionnaireLogoSettings;
};

export function questionSummaryLabel(question: QuestionInput, displayIndex: number): string {
  const trimmed = question.title.trim();
  if (question.type === "LABEL") {
    return trimmed || `טקסט הצגה ${displayIndex}`;
  }
  return trimmed || `שאלה ${displayIndex}`;
}
