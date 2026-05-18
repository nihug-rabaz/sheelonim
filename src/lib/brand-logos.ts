import type {
  BrandLogo,
  Environment,
  LogoSize,
  Questionnaire,
  QuestionnaireLogoSettings,
} from "@/lib/domain/types";

export const LOGO_SIZE_OPTIONS: { value: LogoSize; label: string }[] = [
  { value: "sm", label: "קטן" },
  { value: "md", label: "בינוני" },
  { value: "lg", label: "גדול" },
];

export const LOGO_SIZE_CLASSES: Record<LogoSize, string> = {
  sm: "h-8 max-h-8 max-w-[5.5rem] w-auto object-contain",
  md: "h-12 max-h-12 max-w-[8.5rem] w-auto object-contain",
  lg: "h-16 max-h-16 max-w-[11rem] w-auto object-contain",
};

export const DEFAULT_LOGO_SIZE: LogoSize = "md";

export function emptyLogoSettings(): QuestionnaireLogoSettings {
  return { size: null, hiddenEnvironmentLogoIds: [], extraLogos: [] };
}

export function resolveQuestionnaireLogos(
  environment: Environment,
  questionnaire: Questionnaire
): { logos: BrandLogo[]; size: LogoSize } {
  const settings = questionnaire.logoSettings ?? emptyLogoSettings();
  const hidden = new Set(settings.hiddenEnvironmentLogoIds ?? []);
  const envLogos = (environment.logos ?? []).filter((l) => !hidden.has(l.id));
  const extra = settings.extraLogos ?? [];
  const logos = [...envLogos, ...extra].sort((a, b) => a.order - b.order);
  const size =
    settings.size ?? environment.defaultLogoSize ?? DEFAULT_LOGO_SIZE;
  return { logos, size };
}

export function readImageFile(file: File, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("יש להעלות קובץ תמונה"));
      return;
    }
    if (file.size > maxBytes) {
      reject(new Error("הקובץ גדול מדי (מקסימום 500KB)"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("שגיאה בקריאת הקובץ"));
    reader.readAsDataURL(file);
  });
}
