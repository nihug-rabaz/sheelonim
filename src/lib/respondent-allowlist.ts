import { v4 as uuidv4 } from "uuid";
import type {
  AllowedRespondent,
  Questionnaire,
  QuestionnaireRespondentAllowlist,
} from "@/lib/domain/types";
import {
  isValidIsraeliPhone,
  normalizePhone,
} from "@/lib/validators/phone";

export const RESPONDENT_ACCESS_DENIED_MESSAGE =
  "אין לך הרשאה לענות על שאלון זה";

export function emptyRespondentAllowlist(): QuestionnaireRespondentAllowlist {
  return {
    enabled: false,
    entries: [],
    googleSheetsUrl: null,
    googleSheetsSyncedAt: null,
  };
}

export function isRespondentAllowlistEnabled(
  allowlist: QuestionnaireRespondentAllowlist | undefined
): boolean {
  return Boolean(allowlist?.enabled);
}

export function isRespondentAllowed(
  questionnaire: Questionnaire,
  phone: string
): boolean {
  const allowlist = questionnaire.respondentAllowlist ?? emptyRespondentAllowlist();
  if (!allowlist.enabled) return true;
  const normalizedPhone = normalizePhone(phone);
  return allowlist.entries.some((entry) => entry.phone === normalizedPhone);
}

type AllowlistEntryInput = AllowedRespondent & { nationalId?: string };

export function normalizeAllowlistEntries(
  entries: AllowlistEntryInput[]
): AllowedRespondent[] {
  const seen = new Set<string>();
  const result: AllowedRespondent[] = [];
  for (const entry of entries) {
    const phone = normalizePhone(entry.phone);
    if (!isValidIsraeliPhone(phone)) continue;
    if (seen.has(phone)) continue;
    seen.add(phone);
    result.push({
      id: entry.id || uuidv4(),
      phone,
    });
  }
  return result;
}

export function parseAllowlistCsv(csv: string): AllowedRespondent[] {
  const lines = csv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const rows = lines.map(parseCsvLine);
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const phoneCol = findColumnIndex(header, [
    "טלפון",
    "phone",
    "mobile",
    "נייד",
    "פלאפון",
  ]);
  const hasHeader = phoneCol >= 0;
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const resolvedPhoneCol = phoneCol >= 0 ? phoneCol : 0;

  const entries: AllowedRespondent[] = [];
  for (const row of dataRows) {
    const phone = row[resolvedPhoneCol]?.trim() ?? "";
    if (!phone) continue;
    entries.push({
      id: uuidv4(),
      phone,
    });
  }
  return normalizeAllowlistEntries(entries);
}

function findColumnIndex(header: string[], aliases: string[]): number {
  for (const alias of aliases) {
    const index = header.findIndex(
      (cell) => cell === alias.toLowerCase() || cell.includes(alias.toLowerCase())
    );
    if (index >= 0) return index;
  }
  return -1;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}
