"use client";

import type { QuestionFollowUp } from "@/lib/domain/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type FollowUpOption = { id: string; label: string };

function toggleId(ids: string[] | undefined, id: string, on: boolean): string[] {
  const set = new Set(ids ?? []);
  if (on) set.add(id);
  else set.delete(id);
  return [...set];
}

export function BuilderFollowUpSettings({
  enabled,
  followUp,
  options = [],
  onChange,
}: {
  enabled: boolean;
  followUp: QuestionFollowUp | null;
  options?: FollowUpOption[];
  onChange: (value: QuestionFollowUp | null) => void;
}) {
  const label = followUp?.label ?? "נימוק:";
  const required = followUp?.required ?? false;
  const hasOptions = options.length > 0 && options.every((o) => o.id);
  const conditionalVisibility = (followUp?.showForOptionIds?.length ?? 0) > 0;
  const conditionalExempt = (followUp?.exemptFromRequiredOptionIds?.length ?? 0) > 0;

  const patch = (partial: Partial<QuestionFollowUp>) => {
    onChange({ label, required, ...followUp, ...partial });
  };

  const enable = () => onChange({ label: label || "נימוק:", required });

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border/80 bg-muted/10 p-4">
      <div className="flex items-center gap-3">
        <Switch
          checked={enabled}
          onCheckedChange={(v) => (v ? enable() : onChange(null))}
          id="follow-up-toggle"
        />
        <Label htmlFor="follow-up-toggle" className="font-normal">
          הוספת שדה המשך (למשל: נימוק)
        </Label>
      </div>
      {enabled && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-sm">תווית השדה</Label>
              <Input
                value={label}
                onChange={(e) => patch({ label: e.target.value })}
                placeholder="נימוק:"
                className="mt-2"
              />
            </div>
            <div className="flex items-end gap-3 pb-1">
              <Switch
                checked={required}
                onCheckedChange={(v) => patch({ required: v })}
              />
              <Label className="font-normal">שדה חובה</Label>
            </div>
          </div>

          {hasOptions && (
            <div className="space-y-4 rounded-lg border border-border/50 bg-background/80 p-3">
              <p className="text-sm font-medium text-foreground">לוגיקה לפי אפשרויות</p>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={conditionalVisibility}
                    onCheckedChange={(v) =>
                      patch({ showForOptionIds: v ? options.map((o) => o.id) : undefined })
                    }
                    id="follow-up-conditional-show"
                  />
                  <Label htmlFor="follow-up-conditional-show" className="font-normal text-sm">
                    הצג שדה המשך רק עבור אפשרויות נבחרות
                  </Label>
                </div>
                {conditionalVisibility && (
                  <ul className="mr-2 space-y-2 border-r-2 border-primary/20 pr-3">
                    {options.map((opt) => (
                      <li key={opt.id} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id={`show-for-${opt.id}`}
                          checked={followUp?.showForOptionIds?.includes(opt.id) ?? false}
                          onChange={(e) =>
                            patch({
                              showForOptionIds: toggleId(
                                followUp?.showForOptionIds,
                                opt.id,
                                e.target.checked
                              ),
                            })
                          }
                          className="mt-1 size-4 accent-primary"
                        />
                        <Label htmlFor={`show-for-${opt.id}`} className="font-normal text-sm leading-snug">
                          {opt.label || "אפשרות ללא שם"}
                        </Label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {required && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={conditionalExempt}
                      onCheckedChange={(v) =>
                        patch({
                          exemptFromRequiredOptionIds: v
                            ? options.map((o) => o.id)
                            : undefined,
                        })
                      }
                      id="follow-up-exempt"
                    />
                    <Label htmlFor="follow-up-exempt" className="font-normal text-sm">
                      החרג אפשרויות מחובת שדה ההמשך
                    </Label>
                  </div>
                  {conditionalExempt && (
                    <ul className="mr-2 space-y-2 border-r-2 border-amber-500/30 pr-3">
                      {options.map((opt) => (
                        <li key={opt.id} className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            id={`exempt-${opt.id}`}
                            checked={
                              followUp?.exemptFromRequiredOptionIds?.includes(opt.id) ?? false
                            }
                            onChange={(e) =>
                              patch({
                                exemptFromRequiredOptionIds: toggleId(
                                  followUp?.exemptFromRequiredOptionIds,
                                  opt.id,
                                  e.target.checked
                                ),
                              })
                            }
                            className="mt-1 size-4 accent-primary"
                          />
                          <Label
                            htmlFor={`exempt-${opt.id}`}
                            className="font-normal text-sm leading-snug"
                          >
                            {opt.label || "אפשרות ללא שם"}
                          </Label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
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
