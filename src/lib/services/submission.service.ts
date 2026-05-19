import { v4 as uuidv4 } from "uuid";
import type {
  Question,
  Questionnaire,
  Submission,
  SubmissionAnswer,
} from "@/lib/domain/types";
import { isFollowUpRequired } from "@/lib/follow-up-logic";
import { isAnswerableQuestion } from "@/lib/question-utils";
import {
  getYesNoBranchFields,
  validateYesNoBranchFieldValue,
} from "@/lib/yes-no-logic";
import { repositories } from "@/lib/repositories";
import {
  isValidIsraeliPhone,
  normalizePhone,
} from "@/lib/validators/phone";
import { allowlistService } from "@/lib/services/allowlist.service";
import { questionnaireService } from "@/lib/services/questionnaire.service";

export const DUPLICATE_PHONE_SUBMISSION_MESSAGE =
  "כבר נשלח מענה לשאלון זה ממספר הטלפון שהזנת";

export class DuplicateSubmissionError extends Error {
  constructor() {
    super(DUPLICATE_PHONE_SUBMISSION_MESSAGE);
    this.name = "DuplicateSubmissionError";
  }
}

function isDuplicateSubmissionDbError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    error.message === "DUPLICATE_SUBMISSION" ||
    message.includes("submissions_questionnaire_phone_unique") ||
    message.includes("unique constraint") ||
    message.includes("23505")
  );
}

export class SubmissionService {
  async hasSubmittedByPhone(
    questionnaireId: string,
    phone: string
  ): Promise<boolean> {
    const existing = await repositories.submissions.findByRespondent(
      questionnaireId,
      undefined,
      normalizePhone(phone)
    );
    return existing.length > 0;
  }

  async assertCanSubmitByPhone(
    questionnaireId: string,
    phone: string
  ): Promise<void> {
    if (await this.hasSubmittedByPhone(questionnaireId, phone)) {
      throw new DuplicateSubmissionError();
    }
  }
  async submit(
    questionnaire: Questionnaire,
    phone: string,
    answers: SubmissionAnswer[],
    nationalId = ""
  ): Promise<Submission> {
    const availability = questionnaireService.isAvailable(questionnaire);
    if (!availability.available) {
      throw new Error(availability.reason ?? "השאלון אינו זמין");
    }

    const normalizedPhone = normalizePhone(phone);

    if (!isValidIsraeliPhone(normalizedPhone)) {
      throw new Error("מספר טלפון לא תקין");
    }

    const latestQuestionnaire =
      (await repositories.questionnaires.findById(questionnaire.id)) ??
      questionnaire;
    const latestAvailability =
      questionnaireService.isAvailable(latestQuestionnaire);
    if (!latestAvailability.available) {
      throw new Error(latestAvailability.reason ?? "השאלון אינו זמין");
    }
    await allowlistService.assertRespondentCanSubmit(
      latestQuestionnaire,
      normalizedPhone
    );

    await this.assertCanSubmitByPhone(latestQuestionnaire.id, normalizedPhone);

    this.validateAnswers(questionnaire.questions, answers);

    const submission: Submission = {
      id: uuidv4(),
      questionnaireId: questionnaire.id,
      nationalId: nationalId.trim(),
      phone: normalizedPhone,
      answers,
      submittedAt: new Date().toISOString(),
    };
    try {
      await repositories.submissions.save(submission);
    } catch (error) {
      if (isDuplicateSubmissionDbError(error)) {
        throw new DuplicateSubmissionError();
      }
      throw error;
    }
    return submission;
  }

  async getByQuestionnaire(questionnaireId: string): Promise<Submission[]> {
    return repositories.submissions.findByQuestionnaire(questionnaireId);
  }

  async findRespondentSubmissions(
    questionnaireId: string,
    phone: string
  ): Promise<Submission[]> {
    return repositories.submissions.findByRespondent(
      questionnaireId,
      undefined,
      normalizePhone(phone)
    );
  }

  private validateAnswers(questions: Question[], answers: SubmissionAnswer[]): void {
    for (const question of questions) {
      if (!isAnswerableQuestion(question)) continue;
      const answer = answers.find((a) => a.questionId === question.id);
      if (question.required && (!answer || this.isEmptyAnswer(answer.value))) {
        throw new Error(`שדה חובה לא מולא: ${question.title}`);
      }
      if (question.type === "MULTIPLE_CHOICE" && answer) {
        this.validateMultipleChoiceAnswer(question, answer);
      }
      if (isFollowUpRequired(question.followUp, question, answer?.value)) {
        const text = answer?.followUpText?.trim();
        if (!text) {
          throw new Error(`שדה חובה לא מולא: ${question.followUp!.label}`);
        }
      }
      if (question.type === "YES_NO" && question.yesNoConfig) {
        const fields = getYesNoBranchFields(
          question.yesNoConfig,
          answer?.value
        );
        for (const field of fields) {
          const err = validateYesNoBranchFieldValue(
            field,
            answer?.branchFieldTexts?.[field.id]
          );
          if (err) {
            throw new Error(
              `שדה לא תקין (${field.label}): ${err}`
            );
          }
        }
      }
    }
  }

  private validateMultipleChoiceAnswer(
    question: Question,
    answer: SubmissionAnswer
  ): void {
    const selected = Array.isArray(answer.value)
      ? answer.value
      : [String(answer.value)];
    for (const optionId of selected) {
      const option = question.options?.find((o) => o.id === optionId);
      if (option?.allowFreeText) {
        const text = answer.optionTexts?.[optionId];
        if (!text?.trim()) {
          throw new Error(`נא למלא טקסט עבור: ${option.label}`);
        }
      }
    }
  }

  private isEmptyAnswer(value: SubmissionAnswer["value"]): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
  }
}

export const submissionService = new SubmissionService();
