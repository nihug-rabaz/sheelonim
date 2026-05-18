import type {
  Question,
  QuestionYesNoConfig,
  SubmissionAnswer,
  YesNoBranchField,
} from "@/lib/domain/types";

export function getYesNoBranchFields(
  config: QuestionYesNoConfig | undefined,
  value: SubmissionAnswer["value"] | undefined
): YesNoBranchField[] {
  if (!config || value === undefined || value === "") return [];
  if (value === true) return config.yesFields ?? [];
  if (value === false) return config.noFields ?? [];
  return [];
}

export function validateYesNoBranchFields(
  question: Question,
  value: SubmissionAnswer["value"] | undefined,
  texts: Record<string, string> | undefined
): string | undefined {
  const fields = getYesNoBranchFields(question.yesNoConfig, value);
  for (const field of fields) {
    if (field.required && !texts?.[field.id]?.trim()) {
      return field.label || "שדה חובה";
    }
  }
  return undefined;
}
