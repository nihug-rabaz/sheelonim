import type { QuestionnaireRespondentAllowlist } from "@/lib/domain/types";
import { formatPhoneDisplay } from "@/lib/validators/phone";
import { downloadRtlExcel } from "@/lib/excel-export";

function buildAllowlistRows(
  allowlist: QuestionnaireRespondentAllowlist
): { headers: string[]; rows: string[][] } {
  const headers = ["#", "טלפון"];
  const rows = allowlist.entries.map((entry, index) => [
    String(index + 1),
    formatPhoneDisplay(entry.phone) || entry.phone,
  ]);
  return { headers, rows };
}

export async function exportAllowlistToExcel(
  questionnaireTitle: string,
  allowlist: QuestionnaireRespondentAllowlist
): Promise<void> {
  const { headers, rows } = buildAllowlistRows(allowlist);
  const base = questionnaireTitle?.trim() || "questionnaire";
  await downloadRtlExcel(`${base}-allowlist`, {
    sheetName: "מורשים למענה",
    headers,
    rows,
    columnWidth: 24,
  });
}
