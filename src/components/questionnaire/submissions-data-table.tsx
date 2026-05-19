"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Questionnaire, Submission } from "@/lib/domain/types";
import { formatQuestionAnswer } from "@/lib/format-question-answer";
import { isAnswerableQuestion } from "@/lib/question-utils";
import { formatDateTime } from "@/lib/utils";
import { formatPhoneDisplay } from "@/lib/validators/phone";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SortKey = "phone" | "date" | string;
type SortDir = "asc" | "desc";

interface SubmissionsDataTableProps {
  questionnaire: Questionnaire;
  submissions: Submission[];
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

export function SubmissionsDataTable({
  questionnaire,
  submissions,
}: SubmissionsDataTableProps) {
  const answerableQuestions = useMemo(
    () => questionnaire.questions.filter(isAnswerableQuestion),
    [questionnaire.questions]
  );

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const hasActiveFilters = Object.values(filters).some((v) => v.trim());

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      if (
        filters.phone?.trim() &&
        !formatPhoneDisplay(s.phone)
          .toLowerCase()
          .includes(filters.phone.trim().toLowerCase()) &&
        !s.phone.includes(filters.phone.trim())
      ) {
        return false;
      }
      if (
        filters.date?.trim() &&
        !formatDateTime(s.submittedAt)
          .toLowerCase()
          .includes(filters.date.trim().toLowerCase())
      ) {
        return false;
      }
      for (const q of answerableQuestions) {
        const filterVal = filters[q.id]?.trim();
        if (!filterVal) continue;
        const cell = answerText(questionnaire, s, q.id).toLowerCase();
        if (!cell.includes(filterVal.toLowerCase())) return false;
      }
      return true;
    });
  }, [submissions, filters, answerableQuestions, questionnaire]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "phone") {
        cmp = a.phone.localeCompare(b.phone, "he");
      } else if (sortKey === "date") {
        cmp =
          new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      } else {
        cmp = answerText(questionnaire, a, sortKey).localeCompare(
          answerText(questionnaire, b, sortKey),
          "he"
        );
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortKey, sortDir, questionnaire]);

  const columnSummaries = useMemo(() => {
    const summaries: Record<string, string> = {
      phone: `${sorted.length}`,
      date: `${sorted.length}`,
    };
    for (const q of answerableQuestions) {
      const counts = new Map<string, number>();
      let answered = 0;
      for (const s of sorted) {
        const text = answerText(questionnaire, s, q.id);
        if (text === "—") continue;
        answered += 1;
        counts.set(text, (counts.get(text) ?? 0) + 1);
      }
      if (!hasActiveFilters) {
        summaries[q.id] = `${answered} ענו`;
      } else {
        const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
        summaries[q.id] = top
          ? `${answered} ענו · ${top[0].slice(0, 24)}${top[0].length > 24 ? "…" : ""} (${top[1]})`
          : `${answered} ענו`;
      }
    }
    return summaries;
  }, [sorted, answerableQuestions, questionnaire, hasActiveFilters]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return <ArrowUpDown className="ms-1 inline size-3.5 opacity-40" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="ms-1 inline size-3.5" />
    ) : (
      <ArrowDown className="ms-1 inline size-3.5" />
    );
  };

  const setFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        מוצגים {sorted.length} מתוך {submissions.length} מענים
        {hasActiveFilters ? " (לאחר סינון)" : ""}
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-right">
                <button
                  type="button"
                  className="inline-flex items-center font-semibold"
                  onClick={() => toggleSort("phone")}
                >
                  טלפון
                  <SortIcon column="phone" />
                </button>
              </th>
              <th className="p-3 text-right">
                <button
                  type="button"
                  className="inline-flex items-center font-semibold"
                  onClick={() => toggleSort("date")}
                >
                  תאריך
                  <SortIcon column="date" />
                </button>
              </th>
              {answerableQuestions.map((q) => (
                <th key={q.id} className="max-w-[140px] p-3 text-right">
                  <button
                    type="button"
                    className="inline-flex max-w-full items-center font-semibold"
                    onClick={() => toggleSort(q.id)}
                    title={q.title}
                  >
                    <span className="truncate">{q.title}</span>
                    <SortIcon column={q.id} />
                  </button>
                </th>
              ))}
            </tr>
            <tr className="border-t border-slate-200 bg-white">
              <th className="p-2">
                <Input
                  value={filters.phone ?? ""}
                  onChange={(e) => setFilter("phone", e.target.value)}
                  placeholder="סינון..."
                  className="h-8 text-xs"
                />
              </th>
              <th className="p-2">
                <Input
                  value={filters.date ?? ""}
                  onChange={(e) => setFilter("date", e.target.value)}
                  placeholder="סינון..."
                  className="h-8 text-xs"
                />
              </th>
              {answerableQuestions.map((q) => (
                <th key={q.id} className="p-2">
                  <Input
                    value={filters[q.id] ?? ""}
                    onChange={(e) => setFilter(q.id, e.target.value)}
                    placeholder="סינון..."
                    className="h-8 text-xs"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={2 + answerableQuestions.length}
                  className="p-8 text-center text-slate-400"
                >
                  {submissions.length === 0
                    ? "אין תשובות עדיין"
                    : "אין שורות התואמות לסינון"}
                </td>
              </tr>
            ) : (
              sorted.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="p-3">{formatPhoneDisplay(s.phone)}</td>
                  <td className="p-3 whitespace-nowrap">
                    {formatDateTime(s.submittedAt)}
                  </td>
                  {answerableQuestions.map((q) => (
                    <td key={q.id} className="max-w-[150px] truncate p-3">
                      {answerText(questionnaire, s, q.id)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {sorted.length > 0 && (
            <tfoot className="border-t-2 border-slate-200 bg-slate-50/80">
              <tr>
                <td className="p-3 text-xs font-medium text-muted-foreground">
                  סיכום: {columnSummaries.phone}
                </td>
                <td className="p-3 text-xs font-medium text-muted-foreground">
                  {columnSummaries.date}
                </td>
                {answerableQuestions.map((q) => (
                  <td
                    key={q.id}
                    className={cn(
                      "max-w-[150px] truncate p-3 text-xs font-medium text-muted-foreground"
                    )}
                    title={columnSummaries[q.id]}
                  >
                    {columnSummaries[q.id]}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
