"use client";

import { useMemo, useState } from "react";
import type { Questionnaire, Submission } from "@/lib/domain/types";
import { computeCrossTabulation } from "@/lib/analytics-cross-tab";
import {
  answerMatchesFilter,
  canCrossTabSource,
  getCrossTabFilterOptions,
  getSubmissionAnswer,
} from "@/lib/submission-utils";
import { isLabelQuestion } from "@/lib/question-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CrossTabPanelProps {
  questionnaire: Questionnaire;
  submissions: Submission[];
}

export function CrossTabPanel({
  questionnaire,
  submissions,
}: CrossTabPanelProps) {
  const sourceQuestions = useMemo(
    () => questionnaire.questions.filter(canCrossTabSource),
    [questionnaire.questions]
  );
  const targetQuestions = useMemo(
    () => questionnaire.questions.filter((q) => !isLabelQuestion(q)),
    [questionnaire.questions]
  );

  const [sourceQuestionId, setSourceQuestionId] = useState(
    () => sourceQuestions[0]?.id ?? ""
  );
  const [sourceValue, setSourceValue] = useState("");
  const [targetQuestionId, setTargetQuestionId] = useState(
    () => targetQuestions[0]?.id ?? ""
  );
  const [expanded, setExpanded] = useState(false);

  const sourceQuestion = sourceQuestions.find((q) => q.id === sourceQuestionId);
  const targetQuestion = targetQuestions.find((q) => q.id === targetQuestionId);
  const sourceOptions = sourceQuestion
    ? getCrossTabFilterOptions(sourceQuestion)
    : [];

  const effectiveSourceValue =
    sourceValue || sourceOptions[0]?.value || "";

  const rows = useMemo(() => {
    if (!sourceQuestion || !targetQuestion || !effectiveSourceValue) {
      return [];
    }
    return computeCrossTabulation(
      submissions,
      sourceQuestion,
      effectiveSourceValue,
      targetQuestion
    );
  }, [
    submissions,
    sourceQuestion,
    targetQuestion,
    effectiveSourceValue,
  ]);

  const matchedCount = useMemo(() => {
    if (!sourceQuestion || !effectiveSourceValue) return 0;
    return submissions.filter((s) =>
      answerMatchesFilter(
        sourceQuestion,
        getSubmissionAnswer(s, sourceQuestion.id),
        effectiveSourceValue
      )
    ).length;
  }, [submissions, sourceQuestion, effectiveSourceValue]);

  if (sourceQuestions.length === 0 || targetQuestions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-4">
        <div>
          <CardTitle className="text-base">הצלבת נתונים</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            אופציונלי — בדיקת קשר בין תשובות בשאלות שונות
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <>
              <ChevronDown className="size-4" />
              הסתר
            </>
          ) : (
            <>
              <ChevronLeft className="size-4" />
              הצג הצלבה
            </>
          )}
        </Button>
      </CardHeader>
      {expanded && (
      <CardContent className="space-y-4 border-t border-border/60 pt-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="cross-source-q">שאלת מקור</Label>
            <select
              id="cross-source-q"
              value={sourceQuestionId}
              onChange={(e) => {
                setSourceQuestionId(e.target.value);
                setSourceValue("");
              }}
              className="mt-2 flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
            >
              {sourceQuestions.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="cross-source-v">ערך בשאלת המקור</Label>
            <select
              id="cross-source-v"
              value={effectiveSourceValue}
              onChange={(e) => setSourceValue(e.target.value)}
              className="mt-2 flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
            >
              {sourceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="cross-target-q">שאלת יעד</Label>
            <select
              id="cross-target-q"
              value={targetQuestionId}
              onChange={(e) => setTargetQuestionId(e.target.value)}
              className="mt-2 flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
            >
              {targetQuestions.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {targetQuestion && sourceQuestion && (
          <p className="text-sm text-muted-foreground">
            מי שענה &quot;
            {sourceOptions.find((o) => o.value === effectiveSourceValue)?.label}
            &quot; ב&quot;{sourceQuestion.title}&quot; — פירוט תשובות ל&quot;
            {targetQuestion.title}&quot; ({matchedCount} מענים)
          </p>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">תשובה</TableHead>
                <TableHead className="text-right w-28">כמות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    אין נתונים להצגה
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell>{row.label}</TableCell>
                    <TableCell>{row.count}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      )}
    </Card>
  );
}
