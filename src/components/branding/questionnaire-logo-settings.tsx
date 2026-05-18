"use client";

import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Eye, EyeOff, ImagePlus } from "lucide-react";
import type {
  BrandLogo,
  LogoSize,
  QuestionnaireLogoSettings,
} from "@/lib/domain/types";
import {
  DEFAULT_LOGO_SIZE,
  LOGO_SIZE_OPTIONS,
  resolveQuestionnaireLogos,
} from "@/lib/brand-logos";
import { emptyRespondentAllowlist } from "@/lib/respondent-allowlist";
import { LogoUploadList } from "@/components/branding/logo-upload-list";
import { QuestionnaireLogoBar } from "@/components/branding/questionnaire-logo-bar";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { readImageFile } from "@/lib/brand-logos";
import { useRef, useState } from "react";

const MAX_BYTES = 500_000;

export function QuestionnaireLogoSettingsEditor({
  environmentLogos,
  environmentDefaultLogoSize,
  settings,
  onChange,
}: {
  environmentLogos: BrandLogo[];
  environmentDefaultLogoSize: LogoSize;
  settings: QuestionnaireLogoSettings;
  onChange: (settings: QuestionnaireLogoSettings) => void;
}) {
  const extraInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");

  const effectiveSize = settings.size ?? environmentDefaultLogoSize ?? DEFAULT_LOGO_SIZE;

  const preview = useMemo(() => {
    const env = {
      id: "",
      name: "",
      description: "",
      logos: environmentLogos,
      defaultLogoSize: environmentDefaultLogoSize,
      createdAt: "",
    };
    const questionnaire = {
      id: "",
      environmentId: "",
      title: "",
      description: "",
      slug: "",
      isDraft: false,
      isActive: true,
      closesAt: null,
      thankYouMessage: "",
      sections: [],
      questions: [],
      logoSettings: settings,
      respondentAllowlist: emptyRespondentAllowlist(),
      createdById: "",
      createdAt: "",
      updatedAt: "",
    };
    return resolveQuestionnaireLogos(env, questionnaire);
  }, [environmentLogos, environmentDefaultLogoSize, settings]);

  const hidden = new Set(settings.hiddenEnvironmentLogoIds ?? []);

  const toggleEnvLogo = (id: string) => {
    const next = new Set(hidden);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange({
      ...settings,
      hiddenEnvironmentLogoIds: [...next],
    });
  };

  const setSize = (size: LogoSize | null) => {
    onChange({ ...settings, size });
  };

  const addExtraFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadError("");
    const extra = [...(settings.extraLogos ?? [])];
    try {
      for (const file of Array.from(files)) {
        const url = await readImageFile(file, MAX_BYTES);
        extra.push({
          id: uuidv4(),
          url,
          alt: file.name.replace(/\.[^.]+$/, ""),
          order: extra.length,
        });
      }
      onChange({
        ...settings,
        extraLogos: extra.map((l, i) => ({ ...l, order: i })),
      });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "שגיאה בהעלאה");
    }
    if (extraInputRef.current) extraInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <FormField label="גודל לוגואים בשאלון">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={settings.size === null ? "default" : "outline"}
            onClick={() => setSize(null)}
          >
            ברירת מחדל (
            {LOGO_SIZE_OPTIONS.find((o) => o.value === environmentDefaultLogoSize)?.label ??
              "בינוני"}
            )
          </Button>
          {LOGO_SIZE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              size="sm"
              variant={settings.size === opt.value ? "default" : "outline"}
              onClick={() => setSize(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </FormField>

      {preview.logos.length > 0 && (
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 px-4 py-5">
          <Label className="mb-3 block text-sm text-muted-foreground">תצוגה מקדימה</Label>
          <QuestionnaireLogoBar logos={preview.logos} size={effectiveSize} />
        </div>
      )}

      {environmentLogos.length > 0 && (
        <div className="space-y-3">
          <Label>לוגואי הסביבה (מוצגים כברירת מחדל)</Label>
          <ul className="space-y-2">
            {environmentLogos.map((logo) => {
              const isHidden = hidden.has(logo.id);
              return (
                <li
                  key={logo.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3",
                    isHidden ? "border-border/40 opacity-60" : "border-border/60"
                  )}
                >
                  <img
                    src={logo.url}
                    alt={logo.alt ?? ""}
                    className="h-10 max-w-[6rem] object-contain"
                  />
                  <span className="flex-1 text-sm">{logo.alt || "לוגו סביבה"}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleEnvLogo(logo.id)}
                  >
                    {isHidden ? (
                      <>
                        <Eye className="h-4 w-4" />
                        הצג בשאלון
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4" />
                        הסתר בשאלון
                      </>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <Label>לוגואים נוספים לשאלון זה בלבד</Label>
        <input
          ref={extraInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addExtraFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => extraInputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
          הוספת לוגו לשאלון
        </Button>
        {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
        {(settings.extraLogos ?? []).length > 0 && (
          <LogoUploadList
            logos={settings.extraLogos}
            onChange={(extraLogos) => onChange({ ...settings, extraLogos })}
            label=""
          />
        )}
      </div>
    </div>
  );
}
