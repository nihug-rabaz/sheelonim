"use client";

import { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ChevronDown, ChevronLeft, GripVertical, Plus, Trash2 } from "lucide-react";
import type {
  BrandLogo,
  LogoSize,
  QuestionnaireLogoSettings,
  QuestionType,
  SectionType,
} from "@/lib/domain/types";
import { emptyLogoSettings } from "@/lib/brand-logos";
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
import { BuilderYesNoBranchFields } from "@/components/questionnaire/yes-no-branch-fields";
import { YES_NO_OPTION_NO, YES_NO_OPTION_YES } from "@/lib/follow-up-logic";
import { BuilderRatingScaleEditor } from "@/components/questionnaire/rating-scale-fields";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailsPanel } from "@/components/questionnaire/question-builder/details-panel";
import { LogosPanel } from "@/components/questionnaire/question-builder/logos-panel";
import {
  buildEmptyState,
  createLabelBlock,
  createQuestion,
  createSection,
  questionSummaryLabel,
  type QuestionBuilderFormData,
} from "@/components/questionnaire/question-builder/utils";

export type { QuestionBuilderFormData };

interface QuestionBuilderProps {
  environmentLogos?: BrandLogo[];
  environmentDefaultLogoSize?: LogoSize;
  initialState?: QuestionBuilderInitialState;
  onSubmit: (data: QuestionBuilderFormData) => Promise<void>;
  onSaveDraft?: (data: QuestionBuilderFormData) => Promise<void>;
  isPublishedEdit?: boolean;
  loading?: boolean;
  draftLoading?: boolean;
}

export function QuestionBuilder({
  onSubmit,
  onSaveDraft,
  isPublishedEdit = false,
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
  const [subtitle, setSubtitle] = useState(seed.subtitle);
  const [description, setDescription] = useState(seed.description);
  const [isActive, setIsActive] = useState(seed.isActive);
  const [closesAt, setClosesAt] = useState(seed.closesAt);
  const [useDefaultMessage, setUseDefaultMessage] = useState(seed.useDefaultMessage);
  const [thankYouMessage, setThankYouMessage] = useState(seed.thankYouMessage);
  const [allowRespondentPdfDownload, setAllowRespondentPdfDownload] = useState(
    seed.allowRespondentPdfDownload
  );
  const [sections, setSections] = useState<QuestionSectionInput[]>(seed.sections);
  const [questions, setQuestions] = useState<QuestionInput[]>(seed.questions);
  const [logoSettings, setLogoSettings] = useState<QuestionnaireLogoSettings>(
    seed.logoSettings ?? emptyLogoSettings()
  );
  const [error, setError] = useState("");
  const [builderTab, setBuilderTab] = useState("details");
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string>>(
    () => new Set(seed.sections.map((s) => s.id).filter(Boolean) as string[])
  );
  const [expandedQuestionIndices, setExpandedQuestionIndices] = useState<Set<number>>(
    () => new Set(seed.questions.map((_, i) => i))
  );

  const toggleSectionExpanded = (sectionId: string) => {
    setExpandedSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const toggleQuestionExpanded = (index: number) => {
    setExpandedQuestionIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const updateSection = (index: number, patch: Partial<QuestionSectionInput>) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  };

  const addSection = (type: SectionType = "REGULAR") => {
    const section = createSection(type);
    setSections((prev) => [...prev, section]);
    setQuestions((prev) => [...prev, createQuestion(section.id!, type)]);
    if (section.id) {
      setExpandedSectionIds(new Set([section.id]));
    }
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
    const previousIndex = questions
      .map((q, i) => ({ q, i }))
      .filter(({ q }) => q.sectionId === sectionId)
      .at(-1)?.i;

    setQuestions((prev) => {
      const next = [...prev, createQuestion(sectionId, section?.type ?? "REGULAR")];
      const newIndex = next.length - 1;
      setExpandedQuestionIndices((exp) => {
        const updated = new Set(exp);
        if (previousIndex !== undefined) updated.delete(previousIndex);
        updated.add(newIndex);
        return updated;
      });
      return next;
    });
  };

  const addLabelBlock = (sectionId: string) => {
    setQuestions((prev) => [...prev, createLabelBlock(sectionId)]);
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
    subtitle: subtitle.trim(),
    description: description.trim(),
    isActive,
    closesAt: closesAt ? new Date(closesAt).toISOString() : null,
    thankYouMessage: useDefaultMessage ? DEFAULT_THANK_YOU_MESSAGE : thankYouMessage,
    allowRespondentPdfDownload,
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
          ? q.options
              ?.filter((o) => o.label.trim())
              .map((o) => ({ ...o, id: o.id ?? uuidv4() }))
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
      <Tabs value={builderTab} onValueChange={setBuilderTab}>
        <TabsList className="h-auto w-full flex-wrap gap-1 p-1">
          <TabsTrigger value="details" className="min-w-[7rem] flex-1">
            פרטי השאלון
          </TabsTrigger>
          <TabsTrigger value="logos" className="min-w-[7rem] flex-1">
            לוגואים
          </TabsTrigger>
          <TabsTrigger value="structure" className="min-w-[7rem] flex-1">
            פרקים ושאלות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <DetailsPanel
            title={title}
            subtitle={subtitle}
            description={description}
            isActive={isActive}
            closesAt={closesAt}
            useDefaultMessage={useDefaultMessage}
            thankYouMessage={thankYouMessage}
            allowRespondentPdfDownload={allowRespondentPdfDownload}
            showActiveToggle={!onSaveDraft || isPublishedEdit}
            onTitleChange={setTitle}
            onSubtitleChange={setSubtitle}
            onDescriptionChange={setDescription}
            onIsActiveChange={setIsActive}
            onClosesAtChange={setClosesAt}
            onUseDefaultMessageChange={setUseDefaultMessage}
            onThankYouMessageChange={setThankYouMessage}
            onAllowPdfChange={setAllowRespondentPdfDownload}
          />
        </TabsContent>

        <TabsContent value="logos" className="mt-6">
          <LogosPanel
            environmentLogos={environmentLogos}
            environmentDefaultLogoSize={environmentDefaultLogoSize}
            logoSettings={logoSettings}
            onChange={setLogoSettings}
          />
        </TabsContent>

        <TabsContent value="structure" className="mt-6 space-y-6">

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

          const sectionExpanded = Boolean(
            section.id && expandedSectionIds.has(section.id)
          );

          if (!sectionExpanded && section.id) {
            return (
              <Card key={section.id} className="overflow-hidden border-border/70">
                <CardContent className="flex items-center gap-2 py-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => toggleSectionExpanded(section.id!)}
                    aria-label="הרחבת פרק"
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-start"
                    onClick={() => toggleSectionExpanded(section.id!)}
                  >
                    <p className="font-medium text-foreground">
                      {section.title.trim() || `פרק ${sectionIndex + 1}`}
                      {isRatingSection ? " · דירוג" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {sectionQuestions.length} שאלות
                    </p>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSection(section.id!)}
                    disabled={sections.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                </CardContent>
              </Card>
            );
          }

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
              {section.id ? (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-muted-foreground"
                    onClick={() => toggleSectionExpanded(section.id!)}
                  >
                    <ChevronDown className="size-4" />
                    כיווץ פרק
                  </Button>
                </div>
              ) : null}
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
                  const questionExpanded = expandedQuestionIndices.has(index);

                  if (!questionExpanded) {
                    return (
                      <Card key={index}>
                        <CardContent className="flex items-center gap-2 py-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => toggleQuestionExpanded(index)}
                            aria-label="הרחבת שאלה"
                          >
                            <ChevronLeft className="size-5" />
                          </Button>
                          <button
                            type="button"
                            className="min-w-0 flex-1 text-start"
                            onClick={() => toggleQuestionExpanded(index)}
                          >
                            <p className="text-sm text-muted-foreground">
                              {question.type === "LABEL" ? "טקסט הצגה" : `שאלה ${displayIndex}`}
                            </p>
                            <p className="truncate font-medium text-foreground">
                              {questionSummaryLabel(question, displayIndex)}
                            </p>
                          </button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeQuestion(index)}
                            disabled={sectionQuestions.length <= 1}
                          >
                            <Trash2 className="size-4 text-rose-500" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  }

                  return (
                    <Card key={index}>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-muted-foreground"
                            onClick={() => toggleQuestionExpanded(index)}
                          >
                            <ChevronDown className="size-4" />
                            כיווץ
                          </Button>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex shrink-0 flex-col items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-9"
                              onClick={() => removeQuestion(index)}
                              disabled={sectionQuestions.length <= 1}
                            >
                              <Trash2 className="size-4 text-rose-500" />
                            </Button>
                            <div
                              className="flex size-9 items-center justify-center text-muted-foreground/50"
                              title="גרירה"
                            >
                              <GripVertical className="size-5" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <Label>סוג שאלה</Label>
                              <select
                                value={question.type}
                                onChange={(e) => {
                                  const type = e.target.value as QuestionType;
                                  if (type === "LABEL") {
                                    updateQuestion(index, {
                                      type,
                                      required: false,
                                      followUp: null,
                                      yesNoConfig: null,
                                    });
                                  } else {
                                    updateQuestion(index, { type });
                                  }
                                }}
                                className="mt-2 flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
                              >
                                {(isRatingSection
                                  ? QUESTION_TYPE_OPTIONS.filter((t) => t.value === "RATING")
                                  : QUESTION_TYPE_OPTIONS.filter((t) => t.value !== "RATING")
                                ).map((t) => (
                                  <option key={t.value} value={t.value}>
                                    {t.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {question.type !== "LABEL" && (
                              <div className="flex items-end gap-3 pb-1">
                                <Switch
                                  checked={question.required}
                                  onCheckedChange={(v) =>
                                    updateQuestion(index, { required: v })
                                  }
                                />
                                <Label>שאלת חובה</Label>
                              </div>
                            )}
                        </div>

                        {question.type === "LABEL" ? (
                          <div>
                            <Label>טקסט להצגה</Label>
                            <Textarea
                              value={question.title}
                              onChange={(e) =>
                                updateQuestion(index, { title: e.target.value })
                              }
                              className="mt-2"
                              rows={3}
                              placeholder="טקסט שיופיע בטופס בין השאלות, ללא שדה מענה"
                            />
                          </div>
                        ) : (
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
                        )}

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
                                        id: uuidv4(),
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

                        {question.type === "YES_NO" && (
                          <BuilderYesNoBranchFields
                            config={question.yesNoConfig}
                            onChange={(yesNoConfig) =>
                              updateQuestion(index, { yesNoConfig })
                            }
                          />
                        )}

                        {question.type !== "LABEL" && (
                        <BuilderFollowUpSettings
                          enabled={!!question.followUp}
                          followUp={question.followUp ?? null}
                          options={
                            question.type === "MULTIPLE_CHOICE"
                              ? (question.options ?? [])
                                  .filter((o): o is { id: string; label: string } => !!o.id)
                                  .map((o) => ({ id: o.id!, label: o.label }))
                              : question.type === "YES_NO"
                                ? [
                                    { id: YES_NO_OPTION_YES, label: "כן" },
                                    { id: YES_NO_OPTION_NO, label: "לא" },
                                  ]
                                : []
                          }
                          onChange={(fu) => updateQuestion(index, { followUp: fu })}
                        />
                        )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => section.id && addQuestion(section.id)}
              >
                <Plus className="h-4 w-4" />
                הוספת שאלה לפרק
              </Button>
              {!isRatingSection && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => section.id && addLabelBlock(section.id)}
                >
                  <Plus className="h-4 w-4" />
                  הוספת טקסט הצגה
                </Button>
              )}
              </div>
            </SectionCard>
          );
        })}
        </TabsContent>
      </Tabs>

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
          {loading
            ? isPublishedEdit
              ? "שומר..."
              : "יוצר שאלון..."
            : isPublishedEdit
              ? "שמירת שאלון"
              : "יצירת שאלון וקבלת קישור"}
        </Button>
      </div>
    </form>
  );
}



