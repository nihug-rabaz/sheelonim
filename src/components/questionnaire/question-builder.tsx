"use client";

import { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import type {
  BrandLogo,
  LogoSize,
  QuestionnaireLogoSettings,
  QuestionType,
  SectionType,
} from "@/lib/domain/types";
import { emptyLogoSettings } from "@/lib/brand-logos";
import { QuestionnaireLogoSettingsEditor } from "@/components/branding/questionnaire-logo-settings";
import { normalizeRatingLabels } from "@/lib/rating-scale";
import { DEFAULT_THANK_YOU_MESSAGE } from "@/lib/domain/types";
import { QUESTION_TYPE_OPTIONS } from "@/lib/question-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { SectionCard } from "@/components/ui/section-card";
import type {
  QuestionInput,
  QuestionSectionInput,
} from "@/lib/services/questionnaire.service";
import type { QuestionBuilderInitialState } from "@/lib/map-questionnaire-to-builder";
import { toast } from "sonner";
import { BuilderFollowUpSettings } from "@/components/questionnaire/question-follow-up-fields";
import { BuilderRatingScaleEditor } from "@/components/questionnaire/rating-scale-fields";

function createSection(type: SectionType = "REGULAR"): QuestionSectionInput {
  const min = 1;
  const max = 5;
  return {
    id: uuidv4(),
    title: type === "RATING" ? "פרק דירוג" : "פרק חדש",
    description: "",
    type,
    minRating: min,
    maxRating: max,
    ratingLabels: normalizeRatingLabels(min, max),
  };
}

function createQuestion(sectionId: string, sectionType: SectionType = "REGULAR"): QuestionInput {
  return {
    type: sectionType === "RATING" ? "RATING" : "YES_NO",
    title: "",
    required: false,
    sectionId,
    allowMultiple: false,
    options: [{ label: "אפשרות 1" }, { label: "אפשרות 2" }],
    minRating: 1,
    maxRating: 5,
    ratingLabels: normalizeRatingLabels(1, 5),
  };
}

export type QuestionBuilderFormData = {
  title: string;
  description: string;
  isActive: boolean;
  closesAt: string | null;
  thankYouMessage: string;
  sections: QuestionSectionInput[];
  questions: QuestionInput[];
  logoSettings: QuestionnaireLogoSettings;
};

interface QuestionBuilderProps {
  environmentLogos?: BrandLogo[];
  environmentDefaultLogoSize?: LogoSize;
  initialState?: QuestionBuilderInitialState;
  onSubmit: (data: QuestionBuilderFormData) => Promise<void>;
  onSaveDraft?: (data: QuestionBuilderFormData) => Promise<void>;
  loading?: boolean;
  draftLoading?: boolean;
}

function buildEmptyState(): QuestionBuilderInitialState {
  const section = createSection("REGULAR");
  return {
    title: "",
    description: "",
    isActive: true,
    closesAt: "",
    useDefaultMessage: true,
    thankYouMessage: DEFAULT_THANK_YOU_MESSAGE,
    sections: [section],
    questions: [createQuestion(section.id!, "REGULAR")],
    logoSettings: emptyLogoSettings(),
  };
}

export function QuestionBuilder({
  onSubmit,
  onSaveDraft,
  loading,
  draftLoading,
  environmentLogos = [],
  environmentDefaultLogoSize = "md",
  initialState,
}: QuestionBuilderProps) {
  const seed = useMemo(
    () => initialState ?? buildEmptyState(),
    [initialState]
  );
  const [title, setTitle] = useState(seed.title);
  const [description, setDescription] = useState(seed.description);
  const [isActive, setIsActive] = useState(seed.isActive);
  const [closesAt, setClosesAt] = useState(seed.closesAt);
  const [useDefaultMessage, setUseDefaultMessage] = useState(seed.useDefaultMessage);
  const [thankYouMessage, setThankYouMessage] = useState(seed.thankYouMessage);
  const [sections, setSections] = useState<QuestionSectionInput[]>(seed.sections);
  const [questions, setQuestions] = useState<QuestionInput[]>(seed.questions);
  const [logoSettings, setLogoSettings] = useState<QuestionnaireLogoSettings>(
    emptyLogoSettings()
  );
  const [error, setError] = useState("");

  const updateSection = (index: number, patch: Partial<QuestionSectionInput>) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  };

  const addSection = (type: SectionType = "REGULAR") => {
    const section = createSection(type);
    setSections((prev) => [...prev, section]);
    setQuestions((prev) => [
      ...prev,
      createQuestion(section.id!, type),
    ]);
  };

  const setSectionType = (sectionIndex: number, type: SectionType) => {
    const section = sections[sectionIndex];
    if (!section.id) return;
    const min = section.minRating ?? 1;
    const max = section.maxRating ?? 5;
    updateSection(sectionIndex, {
      type,
      minRating: min,
      maxRating: max,
      ratingLabels: normalizeRatingLabels(min, max, section.ratingLabels),
    });
    if (type === "RATING") {
      setQuestions((prev) =>
        prev.map((q) =>
          q.sectionId === section.id ? { ...q, type: "RATING" as const } : q
        )
      );
    }
  };

  const updateSectionRatingRange = (
    sectionIndex: number,
    min: number,
    max: number
  ) => {
    const section = sections[sectionIndex];
    updateSection(sectionIndex, {
      minRating: min,
      maxRating: max,
      ratingLabels: normalizeRatingLabels(min, max, section.ratingLabels),
    });
  };

  const removeSection = (sectionId: string) => {
    if (sections.length <= 1) return;
    const fallbackId = sections.find((s) => s.id !== sectionId)?.id;
    if (!fallbackId) return;
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
    setQuestions((prev) => {
      const remaining = prev
        .filter((q) => q.sectionId !== sectionId)
        .map((q) =>
          q.sectionId === sectionId ? { ...q, sectionId: fallbackId } : q
        );
      return remaining.length > 0 ? remaining : [createQuestion(fallbackId)];
    });
  };

  const updateQuestion = (index: number, patch: Partial<QuestionInput>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q))
    );
  };

  const addQuestion = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    setQuestions((prev) => [
      ...prev,
      createQuestion(sectionId, section?.type ?? "REGULAR"),
    ]);
  };

  const removeQuestion = (index: number) => {
    const target = questions[index];
    const sectionCount = questions.filter((q) => q.sectionId === target.sectionId)
      .length;
    if (sectionCount <= 1 && sections.length <= 1) return;
    if (sectionCount <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const buildFormData = (): QuestionBuilderFormData => ({
    title: title.trim(),
    description: description.trim(),
    isActive,
    closesAt: closesAt ? new Date(closesAt).toISOString() : null,
    thankYouMessage: useDefaultMessage ? DEFAULT_THANK_YOU_MESSAGE : thankYouMessage,
    sections: sections.map((s) => ({
      id: s.id,
      title: s.title.trim(),
      description: s.description?.trim() ?? "",
      type: s.type ?? "REGULAR",
      minRating: s.minRating,
      maxRating: s.maxRating,
      ratingLabels: s.ratingLabels,
    })),
    questions: questions.map((q) => ({
      ...q,
      options:
        q.type === "MULTIPLE_CHOICE"
          ? q.options?.filter((o) => o.label.trim())
          : undefined,
    })),
    logoSettings,
  });

  const validatePublish = () => {
    if (!title.trim()) {
      setError("נא להזין כותרת לשאלון");
      return false;
    }
    if (sections.some((s) => !s.title.trim())) {
      setError("לכל הפרקים נדרשת כותרת");
      return false;
    }
    if (questions.some((q) => !q.title.trim())) {
      setError("לכל השאלות נדרשת כותרת");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validatePublish()) return;
    await onSubmit(buildFormData());
  };

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;
    setError("");
    if (!title.trim()) {
      setError("נא להזין כותרת לשמירת הטיוטה");
      return;
    }
    await onSaveDraft(buildFormData());
    toast.success("הטיוטה נשמרה");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <SectionCard title="פרטי השאלון" description="הגדרות כלליות לשאלון">
        <div className="grid gap-5">
          <div>
            <Label htmlFor="title">כותרת השאלון</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="לדוגמה: שאלון שביעות רצון"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור קצר למשיבים"
              className="mt-2"
            />
          </div>
          <div className="flex flex-wrap items-center gap-8">
            <div className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="active" />
              <Label htmlFor="active">שאלון פעיל</Label>
            </div>
          </div>
          <div>
            <Label htmlFor="closesAt">תאריך ושעת סגירה (אופציונלי)</Label>
            <Input
              id="closesAt"
              type="datetime-local"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              className="mt-2 max-w-xs"
            />
          </div>
          <div>
            <div className="mb-3 flex items-center gap-3">
              <Switch
                checked={useDefaultMessage}
                onCheckedChange={setUseDefaultMessage}
                id="defaultMsg"
              />
              <Label htmlFor="defaultMsg">הודעת סיום ברירת מחדל</Label>
            </div>
            {useDefaultMessage ? (
              <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                {DEFAULT_THANK_YOU_MESSAGE}
              </div>
            ) : (
              <Textarea
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
                placeholder="הודעה שתוצג לאחר שליחת השאלון"
              />
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="לוגואים בראש השאלון"
        description="לוגואי הסביבה מוצגים כברירת מחדל. ניתן לשנות גודל, להסתיר או להוסיף לוגואים."
      >
        <QuestionnaireLogoSettingsEditor
          environmentLogos={environmentLogos}
          environmentDefaultLogoSize={environmentDefaultLogoSize}
          settings={logoSettings}
          onChange={setLogoSettings}
        />
      </SectionCard>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">פרקים ושאלות</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addSection("REGULAR")}
            >
              <Plus className="h-4 w-4" />
              פרק רגיל
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addSection("RATING")}
            >
              <Plus className="h-4 w-4" />
              פרק דירוג
            </Button>
          </div>
        </div>

        {sections.map((section, sectionIndex) => {
          const isRatingSection = section.type === "RATING";
          const sectionQuestions = questions
            .map((q, index) => ({ q, index }))
            .filter(({ q }) => q.sectionId === section.id);
          const questionsBefore = sections
            .slice(0, sectionIndex)
            .reduce(
              (sum, s) =>
                sum + questions.filter((q) => q.sectionId === s.id).length,
              0
            );

          return (
            <SectionCard
              key={section.id}
              title={`פרק ${sectionIndex + 1}${isRatingSection ? " · דירוג" : ""}`}
              description={
                isRatingSection
                  ? "סולם דירוג משותף — כותרות המספרים למעלה, שאלות בצד"
                  : "הגדר כותרת, תיאור ושאלות לפרק זה"
              }
              contentClassName="space-y-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid flex-1 gap-4">
                  <FormField label="סוג פרק" htmlFor={`section-type-${section.id}`}>
                    <select
                      id={`section-type-${section.id}`}
                      value={section.type ?? "REGULAR"}
                      onChange={(e) =>
                        setSectionType(sectionIndex, e.target.value as SectionType)
                      }
                      className="mt-2 flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
                    >
                      <option value="REGULAR">פרק רגיל (כל סוגי השאלות)</option>
                      <option value="RATING">פרק דירוג (טבלת דירוג)</option>
                    </select>
                  </FormField>
                  <FormField label="כותרת הפרק" htmlFor={`section-title-${section.id}`}>
                    <Input
                      id={`section-title-${section.id}`}
                      value={section.title}
                      onChange={(e) =>
                        updateSection(sectionIndex, { title: e.target.value })
                      }
                      placeholder="לדוגמה: פרטים אישיים"
                    />
                  </FormField>
                  <FormField
                    label="תיאור הפרק (אופציונלי)"
                    htmlFor={`section-desc-${section.id}`}
                  >
                    <Textarea
                      id={`section-desc-${section.id}`}
                      value={section.description ?? ""}
                      onChange={(e) =>
                        updateSection(sectionIndex, { description: e.target.value })
                      }
                      placeholder="הסבר קצר למשיבים לפני השאלות בפרק"
                      rows={2}
                    />
                  </FormField>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => section.id && removeSection(section.id)}
                  disabled={sections.length <= 1}
                >
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </Button>
              </div>

              {isRatingSection && (
                <BuilderRatingScaleEditor
                  minRating={section.minRating ?? 1}
                  maxRating={section.maxRating ?? 5}
                  ratingLabels={section.ratingLabels ?? []}
                  onMinChange={(min) =>
                    updateSectionRatingRange(
                      sectionIndex,
                      min,
                      section.maxRating ?? 5
                    )
                  }
                  onMaxChange={(max) =>
                    updateSectionRatingRange(
                      sectionIndex,
                      section.minRating ?? 1,
                      max
                    )
                  }
                  onLabelsChange={(ratingLabels) =>
                    updateSection(sectionIndex, { ratingLabels })
                  }
                />
              )}

              <div className="space-y-4">
                {sectionQuestions.map(({ q: question, index }, localIndex) => {
                  const displayIndex = questionsBefore + localIndex + 1;
                  return (
                    <Card key={index} className="relative">
                      <CardContent className="space-y-4 pr-12">
                        <div className="absolute left-6 top-6 text-muted-foreground/40">
                          <GripVertical className="size-5" />
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 grid gap-4 sm:grid-cols-2">
                            <div>
                              <Label>סוג שאלה</Label>
                              <select
                                value={question.type}
                                onChange={(e) =>
                                  updateQuestion(index, {
                                    type: e.target.value as QuestionType,
                                  })
                                }
                                className="mt-2 flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
                              >
                                {QUESTION_TYPE_OPTIONS.map((t) => (
                                  <option key={t.value} value={t.value}>
                                    {t.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-end gap-3 pb-1">
                              <Switch
                                checked={question.required}
                                onCheckedChange={(v) =>
                                  updateQuestion(index, { required: v })
                                }
                              />
                              <Label>שאלת חובה</Label>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeQuestion(index)}
                            disabled={sectionQuestions.length <= 1}
                          >
                            <Trash2 className="h-4 w-4 text-rose-500" />
                          </Button>
                        </div>

                        <div>
                          <Label>נוסח השאלה</Label>
                          <Input
                            value={question.title}
                            onChange={(e) =>
                              updateQuestion(index, { title: e.target.value })
                            }
                            className="mt-2"
                            placeholder={`שאלה ${displayIndex}`}
                          />
                        </div>

                        {!isRatingSection && question.type === "MULTIPLE_CHOICE" && (
                          <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                            <div className="flex flex-wrap items-center gap-6">
                              <Label className="shrink-0">סוג בחירה:</Label>
                              <label className="flex cursor-pointer items-center gap-2 text-sm">
                                <input
                                  type="radio"
                                  name={`choice-mode-${index}`}
                                  checked={!question.allowMultiple}
                                  onChange={() =>
                                    updateQuestion(index, { allowMultiple: false })
                                  }
                                  className="accent-primary"
                                />
                                בחירה יחידה
                              </label>
                              <label className="flex cursor-pointer items-center gap-2 text-sm">
                                <input
                                  type="radio"
                                  name={`choice-mode-${index}`}
                                  checked={!!question.allowMultiple}
                                  onChange={() =>
                                    updateQuestion(index, { allowMultiple: true })
                                  }
                                  className="accent-primary"
                                />
                                בחירה מרובה
                              </label>
                            </div>
                            <div className="space-y-2">
                              <Label>אפשרויות</Label>
                              {(question.options ?? []).map((opt, optIndex) => (
                                <div
                                  key={optIndex}
                                  className="space-y-2 rounded-lg border border-border/50 bg-background p-3"
                                >
                                  <div className="flex gap-2">
                                    <Input
                                      value={opt.label}
                                      onChange={(e) => {
                                        const options = [...(question.options ?? [])];
                                        options[optIndex] = {
                                          ...options[optIndex],
                                          label: e.target.value,
                                        };
                                        updateQuestion(index, { options });
                                      }}
                                      placeholder={`אפשרות ${optIndex + 1}`}
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const options = (question.options ?? []).filter(
                                          (_, i) => i !== optIndex
                                        );
                                        updateQuestion(index, { options });
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={!!opt.allowFreeText}
                                      onCheckedChange={(v) => {
                                        const options = [...(question.options ?? [])];
                                        const current = options[optIndex];
                                        options[optIndex] = {
                                          ...current,
                                          allowFreeText: v,
                                          label:
                                            v && /^אפשרות \d+$/.test(current.label.trim())
                                              ? "אחר"
                                              : current.label,
                                        };
                                        updateQuestion(index, { options });
                                      }}
                                      id={`free-text-${index}-${optIndex}`}
                                    />
                                    <Label
                                      htmlFor={`free-text-${index}-${optIndex}`}
                                      className="text-sm font-normal"
                                    >
                                      אפשרות ״אחר״ עם שדה להשלמה
                                    </Label>
                                  </div>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  updateQuestion(index, {
                                    options: [
                                      ...(question.options ?? []),
                                      {
                                        label: `אפשרות ${(question.options?.length ?? 0) + 1}`,
                                      },
                                    ],
                                  })
                                }
                              >
                                <Plus className="h-4 w-4" />
                                הוסף אפשרות
                              </Button>
                            </div>
                          </div>
                        )}

                        {!isRatingSection && question.type === "RATING" && (
                          <>
                            <div className="flex gap-4">
                              <div>
                                <Label>מינימום</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={10}
                                  value={question.minRating ?? 1}
                                  onChange={(e) => {
                                    const min = Number(e.target.value);
                                    updateQuestion(index, {
                                      minRating: min,
                                      ratingLabels: normalizeRatingLabels(
                                        min,
                                        question.maxRating ?? 5,
                                        question.ratingLabels
                                      ),
                                    });
                                  }}
                                  className="mt-2 w-24"
                                />
                              </div>
                              <div>
                                <Label>מקסימום</Label>
                                <Input
                                  type="number"
                                  min={2}
                                  max={10}
                                  value={question.maxRating ?? 5}
                                  onChange={(e) => {
                                    const max = Number(e.target.value);
                                    updateQuestion(index, {
                                      maxRating: max,
                                      ratingLabels: normalizeRatingLabels(
                                        question.minRating ?? 1,
                                        max,
                                        question.ratingLabels
                                      ),
                                    });
                                  }}
                                  className="mt-2 w-24"
                                />
                              </div>
                            </div>
                            <BuilderRatingScaleEditor
                              minRating={question.minRating ?? 1}
                              maxRating={question.maxRating ?? 5}
                              ratingLabels={question.ratingLabels ?? []}
                              onMinChange={(min) =>
                                updateQuestion(index, {
                                  minRating: min,
                                  ratingLabels: normalizeRatingLabels(
                                    min,
                                    question.maxRating ?? 5,
                                    question.ratingLabels
                                  ),
                                })
                              }
                              onMaxChange={(max) =>
                                updateQuestion(index, {
                                  maxRating: max,
                                  ratingLabels: normalizeRatingLabels(
                                    question.minRating ?? 1,
                                    max,
                                    question.ratingLabels
                                  ),
                                })
                              }
                              onLabelsChange={(ratingLabels) =>
                                updateQuestion(index, { ratingLabels })
                              }
                            />
                          </>
                        )}

                        <BuilderFollowUpSettings
                          enabled={!!question.followUp}
                          label={question.followUp?.label ?? "נימוק:"}
                          required={question.followUp?.required ?? false}
                          onChange={(fu) => updateQuestion(index, { followUp: fu })}
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => section.id && addQuestion(section.id)}
              >
                <Plus className="h-4 w-4" />
                הוספת שאלה לפרק
              </Button>
            </SectionCard>
          );
        })}
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex flex-wrap gap-3">
        {onSaveDraft && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={loading || draftLoading}
            onClick={handleSaveDraft}
          >
            {draftLoading ? "שומר טיוטה..." : "שמירת טיוטה"}
          </Button>
        )}
        <Button type="submit" size="lg" disabled={loading || draftLoading}>
          {loading ? "יוצר שאלון..." : "יצירת שאלון וקבלת קישור"}
        </Button>
      </div>
    </form>
  );
}
