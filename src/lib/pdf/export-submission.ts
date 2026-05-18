import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Question, Submission } from "@/lib/domain/types";
import { formatQuestionAnswer } from "@/lib/format-question-answer";
import { isAnswerableQuestion } from "@/lib/question-utils";
import { formatPhoneDisplay } from "@/lib/validators/phone";

export function exportSubmissionPdf(
  questionnaireTitle: string,
  questions: Question[],
  submission: Submission
): void {
  const doc = new jsPDF({ orientation: "portrait" });

  doc.setFontSize(18);
  doc.text(questionnaireTitle, 105, 20, { align: "center" });

  doc.setFontSize(11);
  let detailY = 35;
  if (submission.nationalId.trim()) {
    doc.text(`ת.ז.: ${submission.nationalId}`, 200, detailY, { align: "right" });
    detailY += 7;
  }
  doc.text(`טלפון: ${formatPhoneDisplay(submission.phone)}`, 200, detailY, {
    align: "right",
  });
  detailY += 7;
  doc.text(
    `תאריך: ${new Intl.DateTimeFormat("he-IL").format(new Date(submission.submittedAt))}`,
    200,
    detailY,
    { align: "right" }
  );

  const rows = questions
    .filter(isAnswerableQuestion)
    .sort((a, b) => a.order - b.order)
    .map((q) => {
      const answer = submission.answers.find((a) => a.questionId === q.id);
      return [q.title, formatQuestionAnswer(q, answer)];
    });

  autoTable(doc, {
    startY: 58,
    head: [["שאלה", "תשובה"]],
    body: rows,
    styles: { font: "helvetica", halign: "right" },
    headStyles: { fillColor: [13, 148, 136] },
    margin: { right: 14, left: 14 },
  });

  doc.save(`שאלון-${questionnaireTitle}.pdf`);
}
