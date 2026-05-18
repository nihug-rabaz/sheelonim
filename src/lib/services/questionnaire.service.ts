import { v4 as uuidv4 } from "uuid";
import { emptyLogoSettings } from "@/lib/brand-logos";
import { emptyRespondentAllowlist } from "@/lib/respondent-allowlist";
import type {
  Question,
  QuestionFollowUp,
  QuestionYesNoConfig,
  Questionnaire,
  QuestionnaireLogoSettings,
  QuestionnaireRespondentAllowlist,
  QuestionSection,
  QuestionType,
  SectionType,
} from "@/lib/domain/types";
import { normalizeRatingLabels } from "@/lib/rating-scale";
import { DEFAULT_THANK_YOU_MESSAGE } from "@/lib/domain/types";
import { repositories } from "@/lib/repositories";
import { getPublicQuestionnaireUrl } from "@/lib/app-url";
import { isAnswerableQuestion } from "@/lib/question-utils";
import { generateSlug } from "@/lib/utils";

export interface QuestionSectionInput {
  id?: string;
  title: string;
  description?: string;
  type?: SectionType;
  minRating?: number;
  maxRating?: number;
  ratingLabels?: { value: number; label: string }[];
}

export interface QuestionInput {
  id?: string;
  type: QuestionType;
  title: string;
  required: boolean;
  sectionId: string;
  allowMultiple?: boolean;
  options?: { id?: string; label: string; allowFreeText?: boolean }[];
  followUp?: QuestionFollowUp | null;
  yesNoConfig?: QuestionYesNoConfig | null;
  minRating?: number;
  maxRating?: number;
  ratingLabels?: { value: number; label: string }[];
}

export interface QuestionnaireInput {
  environmentId: string;
  title: string;
  description: string;
  isDraft?: boolean;
  isActive: boolean;
  closesAt: string | null;
  thankYouMessage: string;
  allowRespondentPdfDownload?: boolean;
  sections: QuestionSectionInput[];
  questions: QuestionInput[];
  logoSettings?: QuestionnaireLogoSettings;
  respondentAllowlist?: QuestionnaireRespondentAllowlist;
  createdById: string;
}

export class QuestionnaireService {
  async getById(id: string): Promise<Questionnaire | undefined> {
    return repositories.questionnaires.findById(id);
  }

  async getBySlug(slug: string): Promise<Questionnaire | undefined> {
    return repositories.questionnaires.findBySlug(slug);
  }

  async getByEnvironment(environmentId: string): Promise<Questionnaire[]> {
    return repositories.questionnaires.findByEnvironment(environmentId);
  }

  async create(input: QuestionnaireInput): Promise<Questionnaire> {
    const isDraft = input.isDraft ?? false;
    if (isDraft) {
      if (!input.title?.trim()) {
        throw new Error("נא להזין כותרת לשמירת הטיוטה");
      }
    } else {
      this.validatePublishInput(input);
    }

    const now = new Date().toISOString();
    let slug = generateSlug();
    while (await repositories.questionnaires.findBySlug(slug)) {
      slug = generateSlug();
    }

    const sections = this.buildSections(input.sections);
    const sectionIdMap = this.buildSectionIdMap(input.sections, sections);

    const questionnaire: Questionnaire = {
      id: uuidv4(),
      environmentId: input.environmentId,
      title: input.title.trim(),
      description: input.description,
      slug,
      isDraft,
      isActive: isDraft ? false : input.isActive,
      closesAt: input.closesAt,
      thankYouMessage: input.thankYouMessage || DEFAULT_THANK_YOU_MESSAGE,
      allowRespondentPdfDownload: input.allowRespondentPdfDownload ?? true,
      sections,
      questions: this.buildQuestions(input.questions, sectionIdMap),
      logoSettings: input.logoSettings ?? emptyLogoSettings(),
      respondentAllowlist: input.respondentAllowlist ?? emptyRespondentAllowlist(),
      createdById: input.createdById,
      createdAt: now,
      updatedAt: now,
    };
    await repositories.questionnaires.save(questionnaire);
    return questionnaire;
  }

  async update(
    id: string,
    input: Partial<QuestionnaireInput>
  ): Promise<Questionnaire> {
    const existing = await repositories.questionnaires.findById(id);
    if (!existing) throw new Error("שאלון לא נמצא");

    const publishRequested =
      input.isDraft === false ||
      (existing.isDraft && input.isActive === true);

    let nextIsDraft =
      input.isDraft !== undefined ? input.isDraft : existing.isDraft;
    if (publishRequested) {
      nextIsDraft = false;
    }

    const sections = input.sections
      ? this.buildSections(input.sections)
      : existing.sections;
    const sectionIdMap = input.sections
      ? this.buildSectionIdMap(input.sections, sections)
      : undefined;
    const questions = input.questions
      ? this.buildQuestions(input.questions, sectionIdMap ?? new Map())
      : existing.questions;

    const mergedTitle = (input.title ?? existing.title).trim();

    if (existing.isDraft && !nextIsDraft) {
      this.validatePublishQuestionnaire({
        ...existing,
        title: mergedTitle,
        description: input.description ?? existing.description,
        sections,
        questions,
      });
    } else if (nextIsDraft && input.title !== undefined && !mergedTitle) {
      throw new Error("נא להזין כותרת לשמירת הטיוטה");
    }

    const nextIsActive = nextIsDraft
      ? false
      : input.isActive !== undefined
        ? input.isActive
        : publishRequested
          ? true
          : existing.isActive;

    const updated: Questionnaire = {
      ...existing,
      title: mergedTitle,
      description: input.description ?? existing.description,
      isDraft: nextIsDraft,
      isActive: nextIsActive,
      closesAt: input.closesAt !== undefined ? input.closesAt : existing.closesAt,
      thankYouMessage: input.thankYouMessage ?? existing.thankYouMessage,
      allowRespondentPdfDownload:
        input.allowRespondentPdfDownload ?? existing.allowRespondentPdfDownload,
      sections,
      questions,
      logoSettings: input.logoSettings ?? existing.logoSettings,
      respondentAllowlist:
        input.respondentAllowlist ?? existing.respondentAllowlist,
      updatedAt: new Date().toISOString(),
    };
    await repositories.questionnaires.save(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await repositories.questionnaires.delete(id);
  }

  isAvailable(questionnaire: Questionnaire): {
    available: boolean;
    reason?: string;
  } {
    if (questionnaire.isDraft) {
      return { available: false, reason: "השאלון אינו זמין כרגע" };
    }
    if (!questionnaire.isActive) {
      return { available: false, reason: "השאלון אינו פעיל כרגע" };
    }
    if (questionnaire.closesAt) {
      const closes = new Date(questionnaire.closesAt);
      if (new Date() > closes) {
        return { available: false, reason: "מועד מענה לשאלון הסתיים" };
      }
    }
    return { available: true };
  }

  getPublicUrl(slug: string): string {
    return getPublicQuestionnaireUrl(slug);
  }

  private validatePublishInput(input: QuestionnaireInput): void {
    if (!input.title?.trim()) {
      throw new Error("נא להזין כותרת לשאלון");
    }
    if (input.sections.some((s) => !s.title.trim())) {
      throw new Error("לכל הפרקים נדרשת כותרת");
    }
    if (input.questions.some((q) => !q.title.trim())) {
      throw new Error("לכל השאלות נדרשת כותרת");
    }
  }

  private validatePublishQuestionnaire(questionnaire: Questionnaire): void {
    if (!questionnaire.title?.trim()) {
      throw new Error("נא להזין כותרת לשאלון");
    }
    if (questionnaire.sections.some((s) => !s.title.trim())) {
      throw new Error("לכל הפרקים נדרשת כותרת");
    }
    if (!questionnaire.questions.some(isAnswerableQuestion)) {
      throw new Error("יש להוסיף לפחות שאלה אחת לפני פרסום");
    }
    if (questionnaire.questions.some((q) => !q.title.trim())) {
      throw new Error("לכל השאלות נדרשת כותרת");
    }
  }

  private buildSectionIdMap(
    inputs: QuestionSectionInput[],
    built: QuestionSection[]
  ): Map<string, string> {
    const map = new Map<string, string>();
    inputs.forEach((input, index) => {
      if (input.id) map.set(input.id, built[index].id);
    });
    return map;
  }

  private buildSections(inputs: QuestionSectionInput[]): QuestionSection[] {
    return inputs.map((s, index) => {
      const type = s.type ?? "REGULAR";
      const min = s.minRating ?? 1;
      const max = s.maxRating ?? 5;
      return {
        id: s.id ?? uuidv4(),
        title: s.title,
        description: s.description?.trim() ?? "",
        order: index,
        type,
        ...(type === "RATING"
          ? {
              minRating: min,
              maxRating: max,
              ratingLabels: normalizeRatingLabels(min, max, s.ratingLabels),
            }
          : {}),
      };
    });
  }

  private buildYesNoConfig(
    config?: QuestionYesNoConfig | null
  ): QuestionYesNoConfig | undefined {
    if (!config) return undefined;
    const yesFields = config.yesFields
      ?.filter((f) => f.label.trim())
      .map((f) => ({
        id: f.id ?? uuidv4(),
        label: f.label.trim(),
        required: f.required,
        inputType: f.inputType ?? "TEXT",
      }));
    const noFields = config.noFields
      ?.filter((f) => f.label.trim())
      .map((f) => ({
        id: f.id ?? uuidv4(),
        label: f.label.trim(),
        required: f.required,
        inputType: f.inputType ?? "TEXT",
      }));
    if (!yesFields?.length && !noFields?.length) return undefined;
    return {
      ...(yesFields?.length ? { yesFields } : {}),
      ...(noFields?.length ? { noFields } : {}),
    };
  }

  private buildQuestions(
    inputs: QuestionInput[],
    sectionIdMap: Map<string, string>
  ): Question[] {
    return inputs.map((q, index) => ({
      id: q.id ?? uuidv4(),
      type: q.type,
      title: q.title,
      required: q.type === "LABEL" ? false : q.required,
      order: index,
      sectionId: sectionIdMap.get(q.sectionId) ?? q.sectionId,
      allowMultiple: q.type === "MULTIPLE_CHOICE" ? (q.allowMultiple ?? false) : undefined,
      options: q.options?.map((o) => ({
        id: o.id ?? uuidv4(),
        label: o.label,
        allowFreeText: o.allowFreeText ?? false,
      })),
      followUp: q.followUp?.label?.trim()
        ? {
            label: q.followUp.label.trim(),
            required: q.followUp.required,
            ...(q.followUp.showForOptionIds?.length
              ? { showForOptionIds: q.followUp.showForOptionIds }
              : {}),
            ...(q.followUp.exemptFromRequiredOptionIds?.length
              ? { exemptFromRequiredOptionIds: q.followUp.exemptFromRequiredOptionIds }
              : {}),
          }
        : undefined,
      yesNoConfig:
        q.type === "YES_NO" ? this.buildYesNoConfig(q.yesNoConfig) : undefined,
      minRating: q.type === "RATING" ? (q.minRating ?? 1) : undefined,
      maxRating: q.type === "RATING" ? (q.maxRating ?? 5) : undefined,
      ratingLabels:
        q.type === "RATING" && q.ratingLabels?.length
          ? normalizeRatingLabels(
              q.minRating ?? 1,
              q.maxRating ?? 5,
              q.ratingLabels
            ).filter((l) => l.label.trim())
          : undefined,
    }));
  }
}

export const questionnaireService = new QuestionnaireService();
