import type {
  Question,
  QuestionYesNoConfig,
  SubmissionAnswer,
  YesNoBranchField,
} from "@/lib/domain/types";
import {
  formatPhoneDisplay,
  isValidIsraeliPhone,
  normalizePhone,
} from "@/lib/validators/phone";

export function getYesNoBranchFields(
  config: QuestionYesNoConfig | undefined,
  value: SubmissionAnswer["value"] | undefined
): YesNoBranchField[] {
  if (!config || value === undefined || value === "") return [];
  if (value === true) return config.yesFields ?? [];
  if (value === false) return config.noFields ?? [];
  return [];
}

export function getYesNoBranchFieldInputType(
  field: YesNoBranchField
): NonNullable<YesNoBranchField["inputType"]> {
  return field.inputType ?? "TEXT";
}

export function validateYesNoBranchFieldValue(
  field: YesNoBranchField,
  value: string | undefined
): string | undefined {
  const trimmed = value?.trim() ?? "";
  if (field.required && !trimmed) return "שדה חובה";
  if (!trimmed) return undefined;

  const inputType = getYesNoBranchFieldInputType(field);
  if (inputType === "PHONE" && !isValidIsraeliPhone(trimmed)) {
    return "מספר טלפון לא תקין (05X-XXXXXXX)";
  }
  if (inputType === "NUMBER" && !/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return "יש להזין מספר תקין";
  }
  return undefined;
}

export function normalizeYesNoBranchFieldValue(
  field: YesNoBranchField,
  value: string
): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (getYesNoBranchFieldInputType(field) === "PHONE") {
    return normalizePhone(trimmed);
  }
  return trimmed;
}

export function formatYesNoBranchFieldValue(
  field: YesNoBranchField,
  value: string
): string {
  if (!value.trim()) return "";
  if (getYesNoBranchFieldInputType(field) === "PHONE") {
    return formatPhoneDisplay(value);
  }
  return value.trim();
}

export function validateYesNoBranchFields(
  question: Question,
  value: SubmissionAnswer["value"] | undefined,
  texts: Record<string, string> | undefined
): string | undefined {
  const fields = getYesNoBranchFields(question.yesNoConfig, value);
  for (const field of fields) {
    const err = validateYesNoBranchFieldValue(field, texts?.[field.id]);
    if (err) return field.label || err;
  }
  return undefined;
}
