import { emptyLogoSettings } from "@/lib/brand-logos";
import { emptyRespondentAllowlist } from "@/lib/respondent-allowlist";
import type {
  Environment,
  EnvironmentManager,
  Questionnaire,
  Submission,
  User,
} from "@/lib/domain/types";
import type {
  environments,
  environmentManagers,
  questionnaires,
  submissions,
  users,
} from "@/lib/db/schema";

type UserRow = typeof users.$inferSelect;
type EnvironmentRow = typeof environments.$inferSelect;
type EnvironmentManagerRow = typeof environmentManagers.$inferSelect;
type QuestionnaireRow = typeof questionnaires.$inferSelect;
type SubmissionRow = typeof submissions.$inferSelect;

export function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    name: row.name,
    role: row.role,
    createdAt: row.createdAt,
  };
}

export function mapEnvironment(row: EnvironmentRow): Environment {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    logos: row.logos ?? [],
    defaultLogoSize: row.defaultLogoSize ?? "md",
    createdAt: row.createdAt,
  };
}

export function mapEnvironmentManager(row: EnvironmentManagerRow): EnvironmentManager {
  return {
    id: row.id,
    environmentId: row.environmentId,
    userId: row.userId,
    isPrimary: row.isPrimary,
  };
}

export function mapQuestionnaire(row: QuestionnaireRow): Questionnaire {
  return {
    id: row.id,
    environmentId: row.environmentId,
    title: row.title,
    description: row.description,
    slug: row.slug,
    isDraft: row.isDraft ?? false,
    isActive: row.isActive,
    closesAt: row.closesAt,
    thankYouMessage: row.thankYouMessage,
    sections: row.sections ?? [],
    questions: row.questions,
    logoSettings: row.logoSettings ?? emptyLogoSettings(),
    respondentAllowlist: row.respondentAllowlist ?? emptyRespondentAllowlist(),
    createdById: row.createdById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapSubmission(row: SubmissionRow): Submission {
  return {
    id: row.id,
    questionnaireId: row.questionnaireId,
    nationalId: row.nationalId,
    phone: row.phone,
    answers: row.answers,
    submittedAt: row.submittedAt,
  };
}
