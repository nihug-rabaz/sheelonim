export type UserRole = "ADMIN" | "ENVIRONMENT_MANAGER";

export type QuestionType =
  | "YES_NO"
  | "MULTIPLE_CHOICE"
  | "TEXT"
  | "RATING"
  | "LABEL";

export const DEFAULT_THANK_YOU_MESSAGE =
  "תודה רבה על השתתפותך! התשובות שלך נקלטו בהצלחה.";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export type LogoSize = "sm" | "md" | "lg";

export interface BrandLogo {
  id: string;
  url: string;
  alt?: string;
  order: number;
}

export interface QuestionnaireLogoSettings {
  size: LogoSize | null;
  hiddenEnvironmentLogoIds: string[];
  extraLogos: BrandLogo[];
}

export interface AllowedRespondent {
  id: string;
  phone: string;
}

export interface QuestionnaireRespondentAllowlist {
  enabled: boolean;
  entries: AllowedRespondent[];
  googleSheetsUrl: string | null;
  googleSheetsSyncedAt: string | null;
}

export interface Environment {
  id: string;
  name: string;
  description: string;
  logos: BrandLogo[];
  defaultLogoSize: LogoSize;
  createdAt: string;
}

export interface EnvironmentManager {
  id: string;
  environmentId: string;
  userId: string;
  isPrimary: boolean;
}

export interface QuestionOption {
  id: string;
  label: string;
  allowFreeText?: boolean;
}

export type SectionType = "REGULAR" | "RATING";

export interface RatingScaleLabel {
  value: number;
  label: string;
}

export interface QuestionSection {
  id: string;
  title: string;
  description: string;
  order: number;
  type?: SectionType;
  minRating?: number;
  maxRating?: number;
  ratingLabels?: RatingScaleLabel[];
}

export interface QuestionFollowUp {
  label: string;
  required: boolean;
  showForOptionIds?: string[];
  exemptFromRequiredOptionIds?: string[];
}

export interface YesNoBranchField {
  id: string;
  label: string;
  required: boolean;
}

export interface QuestionYesNoConfig {
  yesFields?: YesNoBranchField[];
  noFields?: YesNoBranchField[];
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  required: boolean;
  order: number;
  sectionId?: string;
  allowMultiple?: boolean;
  options?: QuestionOption[];
  followUp?: QuestionFollowUp;
  yesNoConfig?: QuestionYesNoConfig;
  minRating?: number;
  maxRating?: number;
  ratingLabels?: RatingScaleLabel[];
}

export interface Questionnaire {
  id: string;
  environmentId: string;
  title: string;
  description: string;
  slug: string;
  isDraft: boolean;
  isActive: boolean;
  closesAt: string | null;
  thankYouMessage: string;
  allowRespondentPdfDownload: boolean;
  sections: QuestionSection[];
  questions: Question[];
  logoSettings: QuestionnaireLogoSettings;
  respondentAllowlist: QuestionnaireRespondentAllowlist;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionAnswer {
  questionId: string;
  value: string | string[] | number | boolean;
  optionTexts?: Record<string, string>;
  followUpText?: string;
  branchFieldTexts?: Record<string, string>;
}

export interface Submission {
  id: string;
  questionnaireId: string;
  nationalId: string;
  phone: string;
  answers: SubmissionAnswer[];
  submittedAt: string;
}

export interface DataStore {
  users: User[];
  environments: Environment[];
  environmentManagers: EnvironmentManager[];
  questionnaires: Questionnaire[];
  submissions: Submission[];
}
