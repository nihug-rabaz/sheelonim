import { parseAllowlistCsv } from "@/lib/respondent-allowlist";
import type { AllowedRespondent } from "@/lib/domain/types";

export function toGoogleSheetsCsvExportUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error("יש להזין קישור לגוגל שיטס");
  }
  if (trimmed.includes("/export?")) return trimmed;

  const spreadsheetMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!spreadsheetMatch) {
    throw new Error("קישור גוגל שיטס לא תקין");
  }

  const gidMatch = trimmed.match(/[?#&]gid=(\d+)/);
  const gid = gidMatch?.[1] ?? "0";
  return `https://docs.google.com/spreadsheets/d/${spreadsheetMatch[1]}/export?format=csv&gid=${gid}`;
}

export async function fetchAllowlistFromGoogleSheets(
  sheetUrl: string
): Promise<AllowedRespondent[]> {
  const exportUrl = toGoogleSheetsCsvExportUrl(sheetUrl);
  const response = await fetch(exportUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      "לא ניתן לטעון את הגיליון. ודא שהגיליון פורסם לצפייה ברשת (כל מי שיש לו את הקישור)"
    );
  }
  const csv = await response.text();
  const entries = parseAllowlistCsv(csv);
  if (entries.length === 0) {
    throw new Error("הגיליון ריק או שאין בו עמודות תעודת זהות וטלפון");
  }
  return entries;
}
