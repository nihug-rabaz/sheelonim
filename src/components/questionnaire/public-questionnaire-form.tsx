"use client";

import { useEffect, useState } from "react";
import { Download, Send } from "lucide-react";
import type { Question, QuestionSection, SubmissionAnswer } from "@/lib/domain/types";
import {
  formatPhoneDisplay,
  isValidIsraeliPhone,
  normalizePhone,
} from "@/lib/validators/phone";
import { exportSubmissionPdf } from "@/lib/pdf/export-submission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { SectionCard } from "@/components/ui/section-card";
import { PublicFollowUpField } from "@/components/questionnaire/question-follow-up-fields";
import {
  PublicRatingButtons,
  PublicRatingSectionMatrix,
} from "@/components/questionnaire/rating-scale-fields";
import { isFollowUpRequired, isFollowUpVisible } from "@/lib/follow-up-logic";
import {
  getYesNoBranchFields,
  normalizeYesNoBranchFieldValue,
  validateYesNoBranchFieldValue,
} from "@/lib/yes-no-logic";
import {
  countAnswerableQuestions,
  isAnswerableQuestion,
  isLabelQuestion,
} from "@/lib/question-utils";
import { PublicYesNoBranchFields } from "@/components/questionnaire/yes-no-branch-fields";
import { cn } from "@/lib/utils";
import { UserRound } from "lucide-react";
import type { BrandLogo, LogoSize } from "@/lib/domain/types";
import { QuestionnaireLogoBar } from "@/components/branding/questionnaire-logo-bar";

interface PublicQuestionnaire {
  id: string;
  title: string;
  description: string;
  sections: QuestionSection[];
  questions: Question[];
  thankYouMessage: string;
  allowRespondentPdfDownload: boolean;
  logos: BrandLogo[];
  logoSize: LogoSize;
  respondentAllowlistEnabled: boolean;
}

type FormBlock = {
  section: QuestionSection | null;
  questions: Question[];
};

function getFormBlocks(questionnaire: PublicQuestionnaire): FormBlock[] {
  const sortedQuestions = [...questionnaire.questions].sort(
    (a, b) => a.order - b.order
  );
  const sections = [...(questionnaire.sections ?? [])].sort(
    (a, b) => a.order - b.order
  );
  if (sections.length === 0) {
    return [{ section: null, questions: sortedQuestions }];
  }
  const blocks: FormBlock[] = sections.map((section) => ({
    section,
    questions: sortedQuestions.filter((q) => q.sectionId === section.id),
  }));
  const orphan = sortedQuestions.filter(
    (q) => !q.sectionId || !sections.some((s) => s.id === q.sectionId)
  );
  if (orphan.length > 0) {
    blocks.push({ section: null, questions: orphan });
  }
  return blocks;
}

export function PublicQuestionnaireForm({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [unavailableReason, setUnavailableReason] = useState("");
  const [questionnaire, setQuestionnaire] = useState<PublicQuestionnaire | null>(
    null
  );
  const [step, setStep] = useState<"identify" | "form" | "done">("identify");
  const [phone, setPhone] = useState("");
  const [answers, setAnswers] = useState<Record<string, SubmissionAnswer["value"]>>(
    {}
  );
  const [optionTexts, setOptionTexts] = useState<
    Record<string, Record<string, string>>
  >({});
  const [followUpTexts, setFollowUpTexts] = useState<Record<string, string>>(
    {}
  );
  const [yesNoFieldTexts, setYesNoFieldTexts] = useState<
    Record<string, Record<string, string>>
  >({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [accessDenied, setAccessDenied] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [thankYou, setThankYou] = useState("");
  const [lastSubmission, setLastSubmission] = useState<{
    answers: SubmissionAnswer[];
    phone: string;
    submittedAt: string;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/public/questionnaires/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setQuestionnaire(data.questionnaire);
        setAvailable(data.available);
        setUnavailableReason(data.unavailableReason ?? "");
        setLoading(false);
      });
  }, [slug]);

  const validateIdentity = () => {
    const errs: Record<string, string> = {};
    if (!isValidIsraeliPhone(phone)) {
      errs.phone = "מספר טלפון לא תקין (05X-XXXXXXX)";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const proceedToForm = async () => {
    if (!validateIdentity() || !questionnaire) return;
    setAccessDenied("");
    if (!questionnaire.respondentAllowlistEnabled) {
      setStep("form");
      return;
    }
    setVerifying(true);
    const res = await fetch(`/api/public/questionnaires/${slug}/verify-respondent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setVerifying(false);
    if (!res.ok) {
      setAccessDenied(data.error ?? "אין לך הרשאה לענות על שאלון זה");
      return;
    }
    setStep("form");
  };

  const validateForm = () => {
    if (!questionnaire) return false;
    const errs: Record<string, string> = {};
    for (const q of questionnaire.questions) {
      if (!isAnswerableQuestion(q)) continue;
      const val = answers[q.id];
      if (q.required) {
        if (val === undefined || val === "" || (Array.isArray(val) && !val.length)) {
          errs[q.id] = "שדה חובה";
        }
      }
      if (q.type === "MULTIPLE_CHOICE") {
        const selected = Array.isArray(val) ? val : val ? [String(val)] : [];
        for (const optionId of selected) {
          const option = q.options?.find((o) => o.id === optionId);
          if (option?.allowFreeText && !optionTexts[q.id]?.[optionId]?.trim()) {
            errs[`${q.id}:${optionId}`] = "נא למלא השלמה";
          }
        }
      }
      if (
        isFollowUpRequired(q.followUp, q, val) &&
        !followUpTexts[q.id]?.trim()
      ) {
        errs[`${q.id}:followUp`] = "שדה חובה";
      }
      if (q.type === "YES_NO" && q.yesNoConfig) {
        const branchFields = getYesNoBranchFields(q.yesNoConfig, val);
        for (const field of branchFields) {
          const err = validateYesNoBranchFieldValue(
            field,
            yesNoFieldTexts[q.id]?.[field.id]
          );
          if (err) errs[`${q.id}:yn:${field.id}`] = err;
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const setAnswer = (questionId: string, value: SubmissionAnswer["value"]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[questionId];
      delete next[`${questionId}:followUp`];
      return next;
    });
    const question = questionnaire?.questions.find((q) => q.id === questionId);
    if (
      question?.followUp &&
      !isFollowUpVisible(question.followUp, question, value)
    ) {
      setFollowUpTexts((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
    if (question?.type === "YES_NO") {
      const activeIds = new Set(
        getYesNoBranchFields(question.yesNoConfig, value).map((f) => f.id)
      );
      setYesNoFieldTexts((prev) => {
        const current = prev[questionId] ?? {};
        const nextFields = Object.fromEntries(
          Object.entries(current).filter(([id]) => activeIds.has(id))
        );
        if (Object.keys(nextFields).length === 0) {
          const next = { ...prev };
          delete next[questionId];
          return next;
        }
        return { ...prev, [questionId]: nextFields };
      });
      setErrors((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          if (key.startsWith(`${questionId}:yn:`)) delete next[key];
        }
        return next;
      });
    }
  };

  const toggleMulti = (questionId: string, optionId: string) => {
    const current = (answers[questionId] as string[]) ?? [];
    const next = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];
    setAnswer(questionId, next);
  };

  const setOptionText = (
    question: Question,
    optionId: string,
    text: string
  ) => {
    setOptionTexts((prev) => ({
      ...prev,
      [question.id]: { ...prev[question.id], [optionId]: text },
    }));
    if (!question.allowMultiple && text.trim()) {
      setAnswer(question.id, optionId);
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`${question.id}:${optionId}`];
      return next;
    });
  };

  const selectChoice = (question: Question, optionId: string) => {
    if (question.allowMultiple) {
      toggleMulti(question.id, optionId);
      return;
    }
    setAnswer(question.id, optionId);
  };

  const isChoiceSelected = (question: Question, optionId: string) => {
    const val = answers[question.id];
    if (question.allowMultiple) {
      return ((val as string[]) ?? []).includes(optionId);
    }
    return val === optionId;
  };

  const submit = async () => {
    if (!validateForm() || !questionnaire) return;
    setSubmitError("");
    const payload: SubmissionAnswer[] = Object.entries(answers)
      .filter(([questionId]) => {
        const q = questionnaire.questions.find((item) => item.id === questionId);
        return q && isAnswerableQuestion(q);
      })
      .map(([questionId, value]) => {
        const texts = optionTexts[questionId];
        const followUpText = followUpTexts[questionId];
        const branchTexts = yesNoFieldTexts[questionId];
        const question = questionnaire.questions.find((item) => item.id === questionId);
        const trimmedBranch =
          branchTexts &&
          question?.yesNoConfig &&
          Object.fromEntries(
            Object.entries(branchTexts)
              .filter(([, t]) => t.trim())
              .map(([fieldId, text]) => {
                const field = getYesNoBranchFields(
                  question.yesNoConfig,
                  value
                ).find((f) => f.id === fieldId);
                return [
                  fieldId,
                  field
                    ? normalizeYesNoBranchFieldValue(field, text)
                    : text.trim(),
                ];
              })
          );
        return {
          questionId,
          value,
          ...(texts && Object.keys(texts).length > 0
            ? { optionTexts: texts }
            : {}),
          ...(followUpText?.trim() ? { followUpText: followUpText.trim() } : {}),
          ...(trimmedBranch && Object.keys(trimmedBranch).length > 0
            ? { branchFieldTexts: trimmedBranch }
            : {}),
        };
      }
    );

    const res = await fetch("/api/public/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        phone: normalizePhone(phone),
        answers: payload,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSubmitError(data.error ?? "שגיאה בשליחה");
      return;
    }

    setThankYou(data.thankYouMessage);
    setLastSubmission({
      answers: payload,
      phone: normalizePhone(phone),
      submittedAt: new Date().toISOString(),
    });
    setStep("done");
  };

  const downloadPdf = () => {
    if (!questionnaire || !lastSubmission) return;
    exportSubmissionPdf(questionnaire.title, questionnaire.questions, {
      id: "local",
      questionnaireId: questionnaire.id,
      nationalId: "",
      phone: lastSubmission.phone,
      answers: lastSubmission.answers,
      submittedAt: lastSubmission.submittedAt,
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <p className="text-slate-500">טוען שאלון...</p>
      </div>
    );
  }

  if (!available || !questionnaire) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-slate-50 p-6">
        <Card className="max-w-md">
          <CardContent className="py-10 text-center">
            <p className="text-lg font-medium text-foreground">
              {unavailableReason || "השאלון אינו זמין כרגע"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-gradient-to-br from-teal-50 to-white p-6">
        <Card className="max-w-lg shadow-lg shadow-primary/10">
          <CardContent className="py-10 text-center">
            <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-primary/10 text-3xl text-primary">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-foreground">תודה!</h1>
            <p className="mt-4 leading-relaxed text-muted-foreground">{thankYou}</p>
            {questionnaire.allowRespondentPdfDownload && (
              <Button className="mt-8 gap-2" variant="outline" onClick={downloadPdf}>
                <Download className="size-4" />
                הורדת עותק PDF
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full flex-1 bg-gradient-to-br from-slate-50 via-white to-teal-50/30 py-10 px-4">
      <div className="mx-auto w-full max-w-6xl px-2">
        <header className="mb-8 text-center">
          <QuestionnaireLogoBar
            logos={questionnaire.logos}
            size={questionnaire.logoSize}
            className="mb-6"
          />
          <h1 className="text-3xl font-bold text-slate-900">{questionnaire.title}</h1>
          {questionnaire.description && (
            <p className="mt-2 text-slate-500">{questionnaire.description}</p>
          )}
        </header>

        {step === "identify" ? (
          <SectionCard
            title="זיהוי לפני מילוי השאלון"
            description="נא להזין מספר טלפון לזיהוי לפני תחילת המילוי"
            icon={UserRound}
          >
            <div className="space-y-5">
              <FormField label="מספר טלפון" htmlFor="phone">
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05X-XXXXXXX"
                  inputMode="tel"
                  dir="ltr"
                />
                {phone && formatPhoneDisplay(phone) !== phone && (
                  <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
                    {formatPhoneDisplay(phone)}
                  </p>
                )}
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </FormField>
              {accessDenied && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {accessDenied}
                </p>
              )}
              <Button
                className="w-full"
                size="lg"
                disabled={verifying}
                onClick={() => proceedToForm()}
              >
                {verifying ? "בודק הרשאה..." : "המשך לשאלון"}
              </Button>
            </div>
          </SectionCard>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="space-y-8"
          >
            {getFormBlocks(questionnaire).map((block, blockIndex) => {
              const questionsBefore = getFormBlocks(questionnaire)
                .slice(0, blockIndex)
                .reduce((sum, b) => sum + countAnswerableQuestions(b.questions), 0);

              return (
                <div
                  key={block.section?.id ?? `block-${blockIndex}`}
                  className="overflow-hidden rounded-2xl border-2 border-primary/15 bg-card shadow-sm"
                >
                  {block.section && (
                    <div className="border-b border-primary/10 bg-primary/[0.06] px-6 py-4">
                      <h2 className="text-lg font-semibold text-foreground">
                        {block.section.title}
                      </h2>
                      {block.section.description && (
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {block.section.description}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="space-y-4 p-5 sm:p-6">
                  {block.section?.type === "RATING" ? (
                    <PublicRatingSectionMatrix
                      section={block.section}
                      questions={block.questions.filter(isAnswerableQuestion)}
                      answers={answers as Record<string, number | undefined>}
                      errors={errors}
                      onAnswer={(questionId, value) => setAnswer(questionId, value)}
                    />
                  ) : (
                  (() => {
                    let answerableInBlock = 0;
                    return block.questions.map((q) => {
                    if (isLabelQuestion(q)) {
                      return (
                        <div
                          key={q.id}
                          className="rounded-xl border border-dashed border-border/60 bg-muted/25 px-4 py-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground"
                        >
                          {q.title}
                        </div>
                      );
                    }
                    answerableInBlock += 1;
                    const displayIndex = questionsBefore + answerableInBlock;
                    return (
                <Card key={q.id} className="border-border/50 shadow-none">
                  <CardContent>
                  <p className="mb-4 font-medium text-foreground">
                    {displayIndex}. {q.title}
                    {q.required && <span className="text-destructive"> *</span>}
                  </p>

                  {q.type === "YES_NO" && (
                    <>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant={
                            answers[q.id] === true ? "default" : "outline"
                          }
                          onClick={() => setAnswer(q.id, true)}
                        >
                          כן
                        </Button>
                        <Button
                          type="button"
                          variant={
                            answers[q.id] === false ? "default" : "outline"
                          }
                          onClick={() => setAnswer(q.id, false)}
                        >
                          לא
                        </Button>
                      </div>
                      <PublicYesNoBranchFields
                        questionId={q.id}
                        fields={getYesNoBranchFields(
                          q.yesNoConfig,
                          answers[q.id]
                        )}
                        texts={yesNoFieldTexts[q.id] ?? {}}
                        errors={errors}
                        onChange={(fieldId, text) => {
                          setYesNoFieldTexts((prev) => ({
                            ...prev,
                            [q.id]: { ...prev[q.id], [fieldId]: text },
                          }));
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next[`${q.id}:yn:${fieldId}`];
                            return next;
                          });
                        }}
                      />
                    </>
                  )}

                  {q.type === "MULTIPLE_CHOICE" && (
                    <ul className="space-y-2">
                      {q.options?.map((opt) => (
                        <li key={opt.id}>
                          <label
                            className={cn(
                              "flex cursor-pointer gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                              opt.allowFreeText
                                ? "flex-col items-stretch sm:flex-row sm:items-center"
                                : "items-center",
                              isChoiceSelected(q, opt.id)
                                ? "border-primary/35 bg-primary/5"
                                : "border-border/60 bg-muted/15 hover:bg-muted/30"
                            )}
                          >
                            <span className="flex items-start gap-3">
                              <input
                                type={q.allowMultiple ? "checkbox" : "radio"}
                                name={q.allowMultiple ? undefined : q.id}
                                checked={isChoiceSelected(q, opt.id)}
                                onChange={() => selectChoice(q, opt.id)}
                                className="mt-0.5 size-4 shrink-0 accent-primary"
                              />
                              <span className="text-sm leading-snug">
                                {opt.allowFreeText
                                  ? `${opt.label || "אחר"}:`
                                  : opt.label}
                              </span>
                            </span>
                            {opt.allowFreeText && (
                              <Input
                                value={optionTexts[q.id]?.[opt.id] ?? ""}
                                onChange={(e) =>
                                  setOptionText(q, opt.id, e.target.value)
                                }
                                onClick={(e) => e.stopPropagation()}
                                placeholder="השלמה..."
                                className="w-full"
                              />
                            )}
                          </label>
                          {errors[`${q.id}:${opt.id}`] && (
                            <p className="mt-1 pr-7 text-sm text-destructive">
                              {errors[`${q.id}:${opt.id}`]}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {q.type === "TEXT" && (
                    <Textarea
                      value={(answers[q.id] as string) ?? ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      rows={4}
                    />
                  )}

                  {q.type === "RATING" && (
                    <PublicRatingButtons
                      minRating={q.minRating ?? 1}
                      maxRating={q.maxRating ?? 5}
                      ratingLabels={q.ratingLabels}
                      value={answers[q.id] as number | undefined}
                      onChange={(n) => setAnswer(q.id, n)}
                    />
                  )}

                  {q.followUp &&
                    isFollowUpVisible(q.followUp, q, answers[q.id]) && (
                      <PublicFollowUpField
                        label={q.followUp.label}
                        required={isFollowUpRequired(
                          q.followUp,
                          q,
                          answers[q.id]
                        )}
                        value={followUpTexts[q.id] ?? ""}
                        error={errors[`${q.id}:followUp`]}
                        onChange={(text) =>
                          setFollowUpTexts((prev) => ({ ...prev, [q.id]: text }))
                        }
                      />
                    )}

                  {errors[q.id] && (
                    <p className="mt-2 text-sm text-destructive">{errors[q.id]}</p>
                  )}
                  </CardContent>
                </Card>
                    );
                  });
                  })()
                  )}
                  </div>
                </div>
              );
            })}

            {submitError && (
              <p className="text-center text-sm text-rose-600">{submitError}</p>
            )}

            <Button type="submit" size="lg" className="w-full gap-2">
              <Send className="h-4 w-4" />
              שליחת השאלון
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
