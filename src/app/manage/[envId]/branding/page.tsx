"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Image } from "lucide-react";
import { ManagePageHeader } from "@/components/layout/manage-page-header";
import { LogoUploadList } from "@/components/branding/logo-upload-list";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { SectionCard } from "@/components/ui/section-card";
import type { BrandLogo, Environment, LogoSize } from "@/lib/domain/types";
import { LOGO_SIZE_OPTIONS } from "@/lib/brand-logos";

export default function EnvironmentBrandingPage() {
  const params = useParams();
  const envId = params.envId as string;
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [logos, setLogos] = useState<BrandLogo[]>([]);
  const [defaultLogoSize, setDefaultLogoSize] = useState<LogoSize>("md");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/environments/${envId}`);
    const data = await res.json();
    if (res.ok && data.environment) {
      setEnvironment(data.environment);
      setLogos(data.environment.logos ?? []);
      setDefaultLogoSize(data.environment.defaultLogoSize ?? "md");
    }
  }, [envId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    const res = await fetch(`/api/environments/${envId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logos, defaultLogoSize }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("נשמר בהצלחה");
      const data = await res.json();
      setEnvironment(data.environment);
    } else {
      const data = await res.json();
      setError(data.error ?? "שגיאה בשמירה");
    }
  };

  return (
    <>
      <ManagePageHeader
        title="מיתוג ולוגואים"
        subtitle={environment?.name ?? ""}
      />
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <SectionCard
        title="לוגואים כלליים לסביבה"
        description="לוגואים אלה יופיעו כברירת מחדל בראש כל שאלון. ניתן להסתיר או להוסיף לוגואים בכל שאלון בנפרד."
        icon={Image}
      >
        <div className="space-y-6">
          <FormField label="גודל ברירת מחדל ללוגואים">
            <div className="flex flex-wrap gap-2">
              {LOGO_SIZE_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  size="sm"
                  variant={defaultLogoSize === opt.value ? "default" : "outline"}
                  onClick={() => setDefaultLogoSize(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </FormField>

          <LogoUploadList logos={logos} onChange={setLogos} />

          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-primary">{message}</p>}

          <Button onClick={save} disabled={saving}>
            {saving ? "שומר..." : "שמירת מיתוג"}
          </Button>
        </div>
      </SectionCard>
      </div>
    </>
  );
}
