import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type {
  BrandLogo,
  LogoSize,
  Question,
  QuestionSection,
  QuestionnaireLogoSettings,
  QuestionnaireRespondentAllowlist,
  SubmissionAnswer,
} from "@/lib/domain/types";

export const userRoleEnum = pgEnum("user_role", [
  "ADMIN",
  "ENVIRONMENT_MANAGER",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull(),
});

export const environments = pgTable("environments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  logos: jsonb("logos").$type<BrandLogo[]>().notNull().default([]),
  defaultLogoSize: text("default_logo_size").$type<LogoSize>().notNull().default("md"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull(),
});

export const environmentManagers = pgTable("environment_managers", {
  id: text("id").primaryKey(),
  environmentId: text("environment_id")
    .notNull()
    .references(() => environments.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").notNull().default(false),
});

export const questionnaires = pgTable("questionnaires", {
  id: text("id").primaryKey(),
  environmentId: text("environment_id")
    .notNull()
    .references(() => environments.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  slug: text("slug").notNull().unique(),
  isDraft: boolean("is_draft").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  closesAt: timestamp("closes_at", { withTimezone: true, mode: "string" }),
  thankYouMessage: text("thank_you_message").notNull(),
  allowRespondentPdfDownload: boolean("allow_respondent_pdf_download")
    .notNull()
    .default(true),
  sections: jsonb("sections").$type<QuestionSection[]>().notNull().default([]),
  questions: jsonb("questions").$type<Question[]>().notNull(),
  logoSettings: jsonb("logo_settings")
    .$type<QuestionnaireLogoSettings>()
    .notNull()
    .default({ size: null, hiddenEnvironmentLogoIds: [], extraLogos: [] }),
  respondentAllowlist: jsonb("respondent_allowlist")
    .$type<QuestionnaireRespondentAllowlist>()
    .notNull()
    .default({
      enabled: false,
      entries: [],
      googleSheetsUrl: null,
      googleSheetsSyncedAt: null,
    }),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull(),
});

export const submissions = pgTable("submissions", {
  id: text("id").primaryKey(),
  questionnaireId: text("questionnaire_id")
    .notNull()
    .references(() => questionnaires.id, { onDelete: "cascade" }),
  nationalId: text("national_id").notNull(),
  phone: text("phone").notNull(),
  answers: jsonb("answers").$type<SubmissionAnswer[]>().notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true, mode: "string" })
    .notNull(),
});
