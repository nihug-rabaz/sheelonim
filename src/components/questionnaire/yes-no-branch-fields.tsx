"use client";

import { Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import type {
  QuestionYesNoConfig,
  YesNoBranchField,
  YesNoBranchFieldInputType,
} from "@/lib/domain/types";
import { getYesNoBranchFieldInputType } from "@/lib/yes-no-logic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const INPUT_TYPE_OPTIONS: { value: YesNoBranchFieldInputType; label: string }[] = [
  { value: "TEXT", label: "טקסט" },
  { value: "NUMBER", label: "מספר" },
  { value: "PHONE", label: "טלפון" },
];

function emptyConfig(): QuestionYesNoConfig {
  return { yesFields: [], noFields: [] };
}

function addField(fields: YesNoBranchField[] | undefined): YesNoBranchField[] {
  return [
    ...(fields ?? []),
    { id: uuidv4(), label: "", required: false, inputType: "TEXT" },
  ];
}

function BranchSection({
  title,
  fields,
  onChange,
}: {
  title: string;
  fields: YesNoBranchField[];
  onChange: (fields: YesNoBranchField[]) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border/50 bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium">{title}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(addField(fields))}
        >
          <Plus className="size-4" />
          הוסף שדה
        </Button>
      </div>
      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground">אין שדות — המשיב לא יראה טופס נוסף</p>
      ) : (
        <ul className="space-y-2">
          {fields.map((field, index) => (
            <li
              key={field.id}
              className="flex flex-wrap items-end gap-2 rounded-lg border border-border/40 p-2"
            >
              <div className="min-w-[120px] flex-1">
                <Label className="text-xs">תווית</Label>
                <Input
                  value={field.label}
                  onChange={(e) => {
                    const next = [...fields];
                    next[index] = { ...field, label: e.target.value };
                    onChange(next);
                  }}
                  placeholder="לדוגמה: פרט את הפער"
                  className="mt-1"
                />
              </div>
              <div className="w-28">
                <Label className="text-xs">סוג שדה</Label>
                <select
                  value={getYesNoBranchFieldInputType(field)}
                  onChange={(e) => {
                    const next = [...fields];
                    next[index] = {
                      ...field,
                      inputType: e.target.value as YesNoBranchFieldInputType,
                    };
                    onChange(next);
                  }}
                  className="mt-1 flex h-10 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm"
                >
                  {INPUT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pb-1">
                <Switch
                  checked={field.required}
                  onCheckedChange={(v) => {
                    const next = [...fields];
                    next[index] = { ...field, required: v };
                    onChange(next);
                  }}
                />
                <Label className="text-xs font-normal">חובה</Label>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange(fields.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-4 text-rose-500" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function BuilderYesNoBranchFields({
  config,
  onChange,
}: {
  config?: QuestionYesNoConfig | null;
  onChange: (config: QuestionYesNoConfig | null) => void;
}) {
  const value = config ?? emptyConfig();
  const hasAny =
    (value.yesFields?.length ?? 0) > 0 || (value.noFields?.length ?? 0) > 0;

  const patch = (partial: Partial<QuestionYesNoConfig>) => {
    const next = { ...value, ...partial };
    const empty =
      !next.yesFields?.length && !next.noFields?.length;
    onChange(empty ? null : next);
  };

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border/80 bg-muted/10 p-4">
      <div>
        <p className="text-sm font-medium">שדות מילוי לפי תשובה</p>
        <p className="mt-1 text-xs text-muted-foreground">
          הוסף שדות שיוצגו רק כשהמשיב בוחר כן או לא. לכל שדה ניתן לבחור טקסט, מספר או טלפון.
        </p>
      </div>
      <BranchSection
        title='כשבוחרים "כן"'
        fields={value.yesFields ?? []}
        onChange={(yesFields) => patch({ yesFields })}
      />
      <BranchSection
        title='כשבוחרים "לא"'
        fields={value.noFields ?? []}
        onChange={(noFields) => patch({ noFields })}
      />
      {hasAny && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => onChange(null)}
        >
          נקה את כל השדות
        </Button>
      )}
    </div>
  );
}

function PublicBranchFieldInput({
  field,
  value,
  onChange,
}: {
  field: YesNoBranchField;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputType = getYesNoBranchFieldInputType(field);

  if (inputType === "PHONE") {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2"
        dir="ltr"
        inputMode="tel"
        placeholder="05X-XXXXXXX"
      />
    );
  }

  if (inputType === "NUMBER") {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2"
        dir="ltr"
        inputMode="decimal"
        type="text"
        placeholder="0"
      />
    );
  }

  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-2"
      placeholder="הקלד/י כאן..."
    />
  );
}

export function PublicYesNoBranchFields({
  fields,
  texts,
  errors,
  onChange,
  questionId,
}: {
  questionId: string;
  fields: YesNoBranchField[];
  texts: Record<string, string>;
  errors: Record<string, string>;
  onChange: (fieldId: string, text: string) => void;
}) {
  if (!fields.length) return null;

  return (
    <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
      {fields.map((field) => (
        <div key={field.id}>
          <Label className="text-sm text-muted-foreground">
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </Label>
          <PublicBranchFieldInput
            field={field}
            value={texts[field.id] ?? ""}
            onChange={(text) => onChange(field.id, text)}
          />
          {errors[`${questionId}:yn:${field.id}`] && (
            <p className="mt-1 text-sm text-destructive">
              {errors[`${questionId}:yn:${field.id}`]}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
