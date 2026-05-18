"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Search } from "lucide-react";
import { CopyLinkButton } from "@/components/questionnaire/copy-link-button";
import type {
  BrandLogo,
  Environment,
  LogoSize,
  Questionnaire,
  QuestionnaireLogoSettings,
  QuestionnaireRespondentAllowlist,
  Submission,
} from "@/lib/domain/types";
import { emptyLogoSettings } from "@/lib/brand-logos";
import { QuestionnaireLogoSettingsEditor } from "@/components/branding/questionnaire-logo-settings";
import { emptyRespondentAllowlist } from "@/lib/respondent-allowlist";
import { RespondentAllowlistEditor } from "@/components/questionnaire/respondent-allowlist-editor";
import { getQuestionTypeLabel } from "@/lib/question-types";
import type { QuestionAnalytics } from "@/lib/services/analytics.service";
import { QuestionChart } from "@/components/analytics/question-chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatQuestionAnswer } from "@/lib/format-question-answer";
import { formatDateTime } from "@/lib/utils";
import { formatPhoneDisplay } from "@/lib/validators/phone";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { exportSubmissionsToExcel } from "@/lib/export-submissions-excel";

type Tab =
  | "questions"
  | "logos"
  | "allowlist"
  | "table"
  | "respondent"
  | "analytics";

function QuestionsBySectionList({
  questionnaire,
}: {
  questionnaire: Questionnaire;
}) {
  const sortedQuestions = [...questionnaire.questions].sort(
    (a, b) => a.order - b.order
  );
  const sections =
    questionnaire.sections.length > 0
      ? [...questionnaire.sections].sort((a, b) => a.order - b.order)
      : [];

  if (sections.length === 0) {
    return (
      <ul className="space-y-3">
        {sortedQuestions.map((q, i) => (
          <QuestionSummaryCard key={q.id} question={q} index={i} />
        ))}
      </ul>
    );
  }

  let questionIndex = 0;
  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const sectionQuestions = sortedQuestions.filter(
          (q) => q.sectionId === section.id
        );
        return (
          <div key={section.id} className="space-y-3">
            <div className="rounded-xl border border-border/60 bg-muted/20 px-5 py-4">
              <h3 className="font-semibold">
                {section.title}
                {section.type === "RATING" && (
                  <span className="mr-2 text-xs font-normal text-muted-foreground">
                    (פרק דירוג)
                  </span>
                )}
              </h3>
              {section.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {section.description}
                </p>
              )}
            </div>
            {sectionQuestions.map((q) => {
              const card = (
                <QuestionSummaryCard
                  key={q.id}
                  question={q}
                  index={questionIndex}
                />
              );
              questionIndex += 1;
              return card;
            })}
          </div>
        );
      })}
    </div>
  );
}


function QuestionSummaryCard({
  question,
  index,
}: {
  question: Questionnaire["questions"][0];
  index: number;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="font-medium">
          {index + 1}. {question.title}
          {question.required && <span className="mr-2 text-rose-500">*</span>}
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {getQuestionTypeLabel(question.type)}
          {question.type === "MULTIPLE_CHOICE" &&
            ` · ${question.allowMultiple ? "בחירה מרובה" : "בחירה יחידה"}`}
          {question.options?.length ? ` · ${question.options.length} אפשרויות` : ""}
          {question.followUp ? ` · המשך: ${question.followUp.label}` : ""}
        </p>
      </CardContent>
    </Card>
  );
}

function answerText(
  questionnaire: Questionnaire,
  submission: Submission,
  questionId: string
): string {
  const question = questionnaire.questions.find((q) => q.id === questionId);
  const answer = submission.answers.find((a) => a.questionId === questionId);
  if (!question) return "—";
  return formatQuestionAnswer(question, answer);
}

export function QuestionnaireAdminPanel({
  questionnaireId,
}: {
  questionnaireId: string;
}) {
  const [tab, setTab] = useState<Tab>("analytics");
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [analytics, setAnalytics] = useState<QuestionAnalytics[]>([]);
  const [publicUrl, setPublicUrl] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [filtered, setFiltered] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [logoSettings, setLogoSettings] = useState<QuestionnaireLogoSettings>(
    emptyLogoSettings()
  );
  const [logoSaving, setLogoSaving] = useState(false);
  const [logoMessage, setLogoMessage] = useState("");
  const [respondentAllowlist, setRespondentAllowlist] =
    useState<QuestionnaireRespondentAllowlist>(emptyRespondentAllowlist());
  const [allowlistSaving, setAllowlistSaving] = useState(false);
  const [allowlistSyncing, setAllowlistSyncing] = useState(false);
  const [allowlistMessage, setAllowlistMessage] = useState("");
  const [activeSaving, setActiveSaving] = useState(false);

  const load = useCallback(async () => {
    const [qRes, sRes] = await Promise.all([
      fetch(`/api/questionnaires/${questionnaireId}`),
      fetch(`/api/questionnaires/${questionnaireId}/submissions`),
    ]);
    const qData = await qRes.json();
    const sData = await sRes.json();
    const q = qData.questionnaire as Questionnaire;
    setQuestionnaire(q);
    setLogoSettings(q?.logoSettings ?? emptyLogoSettings());
    setRespondentAllowlist(q?.respondentAllowlist ?? emptyRespondentAllowlist());
    setPublicUrl(qData.publicUrl ?? "");
    setSubmissions(sData.submissions ?? []);
    setAnalytics(sData.analytics ?? []);
    setFiltered(sData.submissions ?? []);

    if (q?.environmentId) {
      const envRes = await fetch(`/api/environments/${q.environmentId}`);
      const envData = await envRes.json();
      if (envRes.ok) setEnvironment(envData.environment);
    }
  }, [questionnaireId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveLogos = async () => {
    setLogoSaving(true);
    setLogoMessage("");
    const res = await fetch(`/api/questionnaires/${questionnaireId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logoSettings }),
    });
    setLogoSaving(false);
    if (res.ok) {
      const data = await res.json();
      setQuestionnaire(data.questionnaire);
      setLogoMessage("נשמר");
    } else {
      const data = await res.json();
      setLogoMessage(data.error ?? "שגיאה");
    }
  };

  const saveAllowlist = async () => {
    setAllowlistSaving(true);
    setAllowlistMessage("");
    const res = await fetch(`/api/questionnaires/${questionnaireId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ respondentAllowlist }),
    });
    setAllowlistSaving(false);
    if (res.ok) {
      const data = await res.json();
      setQuestionnaire(data.questionnaire);
      setRespondentAllowlist(
        data.questionnaire.respondentAllowlist ?? emptyRespondentAllowlist()
      );
      setAllowlistMessage("נשמר");
    } else {
      const data = await res.json();
      setAllowlistMessage(data.error ?? "שגיאה");
    }
  };

  const syncAllowlistFromSheets = async () => {
    setAllowlistSyncing(true);
    setAllowlistMessage("");
    const res = await fetch(
      `/api/questionnaires/${questionnaireId}/allowlist/sync`,
      { method: "POST" }
    );
    setAllowlistSyncing(false);
    if (res.ok) {
      const data = await res.json();
      setQuestionnaire(data.questionnaire);
      setRespondentAllowlist(
        data.questionnaire.respondentAllowlist ?? emptyRespondentAllowlist()
      );
      setAllowlistMessage("סונכרן מגוגל שיטס");
    } else {
      const data = await res.json();
      setAllowlistMessage(data.error ?? "שגיאה בסנכרון");
    }
  };

  const toggleActive = async (isActive: boolean) => {
    if (!questionnaire) return;
    setActiveSaving(true);
    const payload = questionnaire.isDraft
      ? { isDraft: false, isActive }
      : { isActive };
    const res = await fetch(`/api/questionnaires/${questionnaireId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setActiveSaving(false);
    if (res.ok) {
      setQuestionnaire(data.questionnaire);
      if (data.publicUrl) setPublicUrl(data.publicUrl);
      if (questionnaire.isDraft && isActive) {
        toast.success("השאלון פורסם והופעל");
      } else {
        toast.success(isActive ? "השאלון הופעל" : "השאלון הושבת");
      }
    } else {
      toast.error(data.error ?? "שגיאה בעדכון");
    }
  };

  const searchRespondent = async () => {
    const phone = searchPhone.trim();
    if (!phone) {
      toast.error("נא להזין מספר טלפון לחיפוש");
      return;
    }
    const params = new URLSearchParams({ phone });
    const res = await fetch(
      `/api/questionnaires/${questionnaireId}/submissions?${params}`
    );
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "שגיאה בחיפוש");
      return;
    }
    setFiltered(data.submissions ?? []);
    setSelected(data.submissions?.[0] ?? null);
  };

  if (!questionnaire) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-10 w-full max-w-md rounded-lg" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }


  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-4 space-y-0">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-xl">{questionnaire.title}</CardTitle>
            <CardDescription className="mt-1">{questionnaire.description}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
              <Switch
                id="questionnaire-active"
                checked={!questionnaire.isDraft && questionnaire.isActive}
                onCheckedChange={(checked) => {
                  if (!activeSaving) toggleActive(checked);
                }}
              />
              <Label htmlFor="questionnaire-active" className="text-sm">
                {questionnaire.isDraft ? "פרסום והפעלת שאלון" : "שאלון פעיל"}
              </Label>
            </div>
            {questionnaire.isDraft && (
              <Badge variant="warning">טיוטה</Badge>
            )}
            {questionnaire.closesAt && (
              <Badge variant="warning">
                נסגר {formatDateTime(questionnaire.closesAt)}
              </Badge>
            )}
            {questionnaire.respondentAllowlist?.enabled && (
              <Badge variant="muted">רשימת מורשים</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 border-t-0 pt-0">
          <Input
            readOnly
            value={publicUrl}
            className="min-w-[200px] flex-1 font-mono text-xs"
            dir="ltr"
          />
          <CopyLinkButton
            url={publicUrl}
            disabled={questionnaire.isDraft || !questionnaire.isActive}
          />
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1 sm:w-auto">
          <TabsTrigger value="analytics">ניתוח גרפי</TabsTrigger>
          <TabsTrigger value="table">טבלת תשובות</TabsTrigger>
          <TabsTrigger value="respondent">תשובה לפי משתמש</TabsTrigger>
          <TabsTrigger value="questions">שאלות</TabsTrigger>
          <TabsTrigger value="logos">לוגואים</TabsTrigger>
          <TabsTrigger value="allowlist">מורשים למענה</TabsTrigger>
        </TabsList>

        <TabsContent value="allowlist" className="mt-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <RespondentAllowlistEditor
                allowlist={respondentAllowlist}
                onChange={setRespondentAllowlist}
                onSyncGoogleSheets={syncAllowlistFromSheets}
                syncing={allowlistSyncing}
              />
              <div className="flex items-center gap-3">
                <Button onClick={saveAllowlist} disabled={allowlistSaving}>
                  {allowlistSaving ? "שומר..." : "שמירת רשימה"}
                </Button>
                {allowlistMessage && (
                  <span className="text-sm text-muted-foreground">
                    {allowlistMessage}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logos" className="mt-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <QuestionnaireLogoSettingsEditor
                environmentLogos={(environment?.logos ?? []) as BrandLogo[]}
                environmentDefaultLogoSize={
                  (environment?.defaultLogoSize ?? "md") as LogoSize
                }
                settings={logoSettings}
                onChange={setLogoSettings}
              />
              <div className="flex items-center gap-3">
                <Button onClick={saveLogos} disabled={logoSaving}>
                  {logoSaving ? "שומר..." : "שמירת לוגואים"}
                </Button>
                {logoMessage && (
                  <span className="text-sm text-muted-foreground">{logoMessage}</span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="mt-4">
        <QuestionsBySectionList questionnaire={questionnaire} />
        </TabsContent>

        <TabsContent value="table" className="mt-4">
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={submissions.length === 0}
            onClick={async () => {
              try {
                await exportSubmissionsToExcel(questionnaire, submissions);
                toast.success("הקובץ יורד למחשב");
              } catch {
                toast.error("ייצוא לאקסל נכשל");
              }
            }}
          >
            <Download className="h-4 w-4" />
            ייצוא לאקסל
          </Button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-right">טלפון</th>
                <th className="p-3 text-right">תאריך</th>
                {questionnaire.questions.map((q) => (
                  <th key={q.id} className="p-3 text-right max-w-[120px] truncate">
                    {q.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={2 + questionnaire.questions.length}
                    className="p-8 text-center text-slate-400"
                  >
                    אין תשובות עדיין
                  </td>
                </tr>
              ) : (
                submissions.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="p-3">{formatPhoneDisplay(s.phone)}</td>
                    <td className="p-3">{formatDateTime(s.submittedAt)}</td>
                    {questionnaire.questions.map((q) => (
                      <td key={q.id} className="p-3 max-w-[150px] truncate">
                        {answerText(questionnaire, s, q.id)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </TabsContent>

        <TabsContent value="respondent" className="mt-4">
        <Card>
          <CardContent>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="טלפון">
              <Input
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="05X-XXXXXXX"
                dir="ltr"
              />
            </FormField>
            <div className="flex items-end">
              <Button onClick={searchRespondent} className="w-full gap-2">
                <Search className="size-4" />
                חיפוש
              </Button>
            </div>
          </div>

          {filtered.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {filtered.map((s) => (
                  <Button
                    key={s.id}
                    variant={selected?.id === s.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelected(s)}
                  >
                    {formatDateTime(s.submittedAt)}
                  </Button>
                ))}
              </div>
              {selected && (
                <ul className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-5">
                  {questionnaire.questions.map((q) => (
                    <li key={q.id}>
                      <p className="text-sm font-medium text-slate-700">{q.title}</p>
                      <p className="text-slate-900">
                        {answerText(questionnaire, selected, q.id)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
        <div className="grid gap-6 lg:grid-cols-2">
          {analytics.map((a) => (
            <QuestionChart key={a.questionId} data={a} />
          ))}
        </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
