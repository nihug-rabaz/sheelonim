"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export function BuilderFollowUpSettings({
  enabled,
  label,
  required,
  onChange,
}: {
  enabled: boolean;
  label: string;
  required: boolean;
  onChange: (value: { label: string; required: boolean } | null) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border/80 bg-muted/10 p-4">
      <div className="flex items-center gap-3">
        <Switch
          checked={enabled}
          onCheckedChange={(v) =>
            onChange(v ? { label: label || "נימוק:", required } : null)
          }
          id="follow-up-toggle"
        />
        <Label htmlFor="follow-up-toggle" className="font-normal">
          הוספת שדה המשך (למשל: נימוק)
        </Label>
      </div>
      {enabled && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-sm">תווית השדה</Label>
            <Input
              value={label}
              onChange={(e) => onChange({ label: e.target.value, required })}
              placeholder="נימוק:"
              className="mt-2"
            />
          </div>
          <div className="flex items-end gap-3 pb-1">
            <Switch
              checked={required}
              onCheckedChange={(v) => onChange({ label, required: v })}
            />
            <Label className="font-normal">שדה חובה</Label>
          </div>
        </div>
      )}
    </div>
  );
}

export function PublicFollowUpField({
  label,
  required,
  value,
  error,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-4 border-t border-border/50 pt-4">
      <Label className="text-sm text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="mt-2"
        placeholder="הקלד/י כאן..."
      />
      {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
    </div>
  );
}
