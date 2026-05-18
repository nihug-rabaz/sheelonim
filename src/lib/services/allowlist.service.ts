import type { Questionnaire, QuestionnaireRespondentAllowlist } from "@/lib/domain/types";
import { fetchAllowlistFromGoogleSheets } from "@/lib/google-sheets-allowlist";
import {
  emptyRespondentAllowlist,
  isRespondentAllowed,
  normalizeAllowlistEntries,
  RESPONDENT_ACCESS_DENIED_MESSAGE,
} from "@/lib/respondent-allowlist";
import { repositories } from "@/lib/repositories";
export class AllowlistService {
  async assertRespondentCanSubmit(
    questionnaire: Questionnaire,
    nationalId: string,
    phone: string
  ): Promise<void> {
    const fresh = await this.refreshFromGoogleSheetsIfConfigured(questionnaire);
    if (!isRespondentAllowed(fresh, nationalId, phone)) {
      throw new Error(RESPONDENT_ACCESS_DENIED_MESSAGE);
    }
  }

  async verifyRespondent(
    questionnaire: Questionnaire,
    nationalId: string,
    phone: string
  ): Promise<boolean> {
    const allowlist = questionnaire.respondentAllowlist ?? emptyRespondentAllowlist();
    if (!allowlist.enabled) return true;

    const fresh = await this.refreshFromGoogleSheetsIfConfigured(questionnaire);
    return isRespondentAllowed(fresh, nationalId, phone);
  }

  async syncFromGoogleSheets(questionnaireId: string): Promise<Questionnaire> {
    const questionnaire = await repositories.questionnaires.findById(questionnaireId);
    if (!questionnaire) throw new Error("שאלון לא נמצא");

    const allowlist = questionnaire.respondentAllowlist ?? emptyRespondentAllowlist();
    if (!allowlist.googleSheetsUrl?.trim()) {
      throw new Error("לא הוגדר קישור לגוגל שיטס");
    }

    const entries = await fetchAllowlistFromGoogleSheets(allowlist.googleSheetsUrl);
    return this.saveAllowlist(questionnaire, {
      ...allowlist,
      entries,
      googleSheetsSyncedAt: new Date().toISOString(),
    });
  }

  async saveAllowlist(
    questionnaire: Questionnaire,
    allowlist: QuestionnaireRespondentAllowlist
  ): Promise<Questionnaire> {
    const updated: Questionnaire = {
      ...questionnaire,
      respondentAllowlist: {
        ...allowlist,
        entries: normalizeAllowlistEntries(allowlist.entries),
      },
      updatedAt: new Date().toISOString(),
    };
    await repositories.questionnaires.save(updated);
    return updated;
  }

  private async refreshFromGoogleSheetsIfConfigured(
    questionnaire: Questionnaire
  ): Promise<Questionnaire> {
    const allowlist = questionnaire.respondentAllowlist ?? emptyRespondentAllowlist();
    if (!allowlist.enabled || !allowlist.googleSheetsUrl?.trim()) {
      return questionnaire;
    }
    try {
      return await this.syncFromGoogleSheets(questionnaire.id);
    } catch {
      return questionnaire;
    }
  }
}

export const allowlistService = new AllowlistService();
