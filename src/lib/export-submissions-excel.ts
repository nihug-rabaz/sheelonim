import type { Questionnaire, Submission } from "@/lib/domain/types";
import { isAnswerableQuestion } from "@/lib/question-utils";
import { formatQuestionAnswer } from "@/lib/format-question-answer";
import { formatDateTime } from "@/lib/utils";
import { formatPhoneDisplay } from "@/lib/validators/phone";
import type { Alignment } from "exceljs";

const RTL_CELL: Partial<Alignment> = {
  horizontal: "right",
  vertical: "middle",
  readingOrder: "rtl",
};

function buildExportRows(
  questionnaire: Questionnaire,
  submissions: Submission[]
): { headers: string[]; rows: string[][] } {
  const exportQuestions = questionnaire.questions.filter(isAnswerableQuestion);
  const headers = [
    "טלפון",
    "תאריך מענה",
    ...exportQuestions.map((q) => q.title),
  ];
  const rows = submissions.map((s) => [
    formatPhoneDisplay(s.phone),
    formatDateTime(s.submittedAt),
    ...exportQuestions.map((q) => {
      const answer = s.answers.find((a) => a.questionId === q.id);
      return formatQuestionAnswer(q, answer);
    }),
  ]);
  return { headers, rows };
}

function applyRtlToRow(row: {
  eachCell: (cb: (cell: { alignment: Partial<Alignment> }) => void) => void;
}): void {
  row.eachCell((cell) => {
    cell.alignment = RTL_CELL;
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportSubmissionsToExcel(
  questionnaire: Questionnaire,
  submissions: Submission[]
): Promise<void> {
  const { headers, rows } = buildExportRows(questionnaire, submissions);
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("תשובות", {
    views: [{ rightToLeft: true }],
  });

  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };
  applyRtlToRow(headerRow);

  for (const values of rows) {
    const dataRow = worksheet.addRow(values);
    applyRtlToRow(dataRow);
  }

  worksheet.columns.forEach((column) => {
    column.width = 22;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const safeTitle = questionnaire.title
    .replace(/[^\w\u0590-\u05FF\s-]/g, "")
    .trim();
  downloadBlob(blob, `${safeTitle || "questionnaire"}-responses.xlsx`);
}
