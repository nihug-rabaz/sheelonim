"use client";

import { useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ImagePlus, Trash2 } from "lucide-react";
import type { BrandLogo } from "@/lib/domain/types";
import { readImageFile } from "@/lib/brand-logos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";

const MAX_BYTES = 500_000;

export function LogoUploadList({
  logos,
  onChange,
  label = "לוגואים",
}: {
  logos: BrandLogo[];
  onChange: (logos: BrandLogo[]) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    const next = [...logos];
    try {
      for (const file of Array.from(files)) {
        const url = await readImageFile(file, MAX_BYTES);
        next.push({
          id: uuidv4(),
          url,
          alt: file.name.replace(/\.[^.]+$/, ""),
          order: next.length,
        });
      }
      onChange(next.map((l, i) => ({ ...l, order: i })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בהעלאה");
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (id: string) => {
    onChange(
      logos
        .filter((l) => l.id !== id)
        .map((l, i) => ({ ...l, order: i }))
    );
  };

  const updateAlt = (id: string, alt: string) => {
    onChange(logos.map((l) => (l.id === id ? { ...l, alt } : l)));
  };

  return (
    <div className="space-y-4">
      <FormField label={label}>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" />
            העלאת לוגו
          </Button>
        </div>
      </FormField>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {logos.length === 0 ? (
        <p className="text-sm text-muted-foreground">אין לוגואים עדיין</p>
      ) : (
        <ul className="space-y-3">
          {logos.map((logo) => (
            <li
              key={logo.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
            >
              <img
                src={logo.url}
                alt={logo.alt ?? ""}
                className="h-12 max-w-[8rem] object-contain"
              />
              <Input
                value={logo.alt ?? ""}
                onChange={(e) => updateAlt(logo.id, e.target.value)}
                placeholder="תיאור (אופציונלי)"
                className="min-w-[140px] flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(logo.id)}
                aria-label="הסרת לוגו"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
