import type { BrandLogo, LogoSize, QuestionnaireLogoSettings } from "@/lib/domain/types";
import { QuestionnaireLogoSettingsEditor } from "@/components/branding/questionnaire-logo-settings";
import { SectionCard } from "@/components/ui/section-card";

type LogosPanelProps = {
  environmentLogos: BrandLogo[];
  environmentDefaultLogoSize: LogoSize;
  logoSettings: QuestionnaireLogoSettings;
  onChange: (settings: QuestionnaireLogoSettings) => void;
};

export function LogosPanel({
  environmentLogos,
  environmentDefaultLogoSize,
  logoSettings,
  onChange,
}: LogosPanelProps) {
  return (
    <SectionCard
      title="לוגואים בראש השאלון"
      description="לוגואי הסביבה מוצגים כברירת מחדל. ניתן לשנות גודל, להסתיר או להוסיף לוגואים."
    >
      <QuestionnaireLogoSettingsEditor
        environmentLogos={environmentLogos}
        environmentDefaultLogoSize={environmentDefaultLogoSize}
        settings={logoSettings}
        onChange={onChange}
      />
    </SectionCard>
  );
}
