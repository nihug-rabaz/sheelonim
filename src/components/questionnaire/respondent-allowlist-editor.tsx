"use client";

import { useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ChevronDown, Download, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import type { AllowedRespondent, QuestionnaireRespondentAllowlist } from "@/lib/domain/types";
import { parseAllowlistCsv, parseAllowlistTxt } from "@/lib/respondent-allowlist";
import { formatPhoneDisplay, normalizePhone } from "@/lib/validators/phone";
import { exportAllowlistToExcel } from "@/lib/export-allowlist-excel";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/ui/form-field";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function findDuplicateEntryIds(entries: AllowedRespondent[]): Set<string> {
  const seen = new Map<string, string>();
  const duplicates = new Set<string>();
  for (const entry of entries) {
    const key = normalizePhone(entry.phone);
    if (!key) continue;
    if (seen.has(key)) {
      duplicates.add(entry.id);
    } else {
      seen.set(key, entry.id);
    }
  }
  return duplicates;
}

interface RespondentAllowlistEditorProps {
  allowlist: QuestionnaireRespondentAllowlist;
  onChange: (allowlist: QuestionnaireRespondentAllowlist) => void;
  onSyncGoogleSheets: () => Promise<void>;
  syncing?: boolean;
  questionnaireTitle?: string;
}

export function RespondentAllowlistEditor({
  allowlist,
  onChange,
  onSyncGoogleSheets,
  syncing = false,
  questionnaireTitle = "",
}: RespondentAllowlistEditorProps) {
  const csvFileRef = useRef<HTMLInputElement>(null);
  const txtFileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState("");
  const [exporting, setExporting] = useState(false);

  const duplicateIds = useMemo(
    () => findDuplicateEntryIds(allowlist.entries),
    [allowlist.entries]
  );

  const handleExport = async () => {
    if (exporting || allowlist.entries.length === 0) return;
    setExporting(true);
    try {
      await exportAllowlistToExcel(questionnaireTitle, allowlist);
    } catch {
      setImportError("שגיאה בייצוא הקובץ");
    } finally {
      setExporting(false);
    }
  };

  const updateEntry = (id: string, patch: Partial<{ phone: string }>) => {
    onChange({
      ...allowlist,
      entries: allowlist.entries.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry
      ),
    });
  };

  const addRow = () => {
    onChange({
      ...allowlist,
      entries: [...allowlist.entries, { id: uuidv4(), phone: "" }],
    });
  };

  const removeRow = (id: string) => {
    onChange({
      ...allowlist,
      entries: allowlist.entries.filter((entry) => entry.id !== id),
    });
  };

  const importAllowlistFile = async (
    files: FileList | null,
    format: "csv" | "txt"
  ) => {
    if (!files?.[0]) return;
    setImportError("");
    try {
      const text = await files[0].text();
      const parsed =
        format === "txt" ? parseAllowlistTxt(text) : parseAllowlistCsv(text);
      if (!parsed.length) {
        setImportError("לא נמצאו מספרי טלפון תקינים בקובץ");
        return;
      }
      onChange({ ...allowlist, entries: parsed });
    } catch {
      setImportError("שגיאה בקריאת הקובץ");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-4">
        <div>
          <Label htmlFor="allowlist-enabled" className="font-medium">
            הגבלת מענה לרשימה בלבד
          </Label>
          <p className="mt-1 text-sm text-muted-foreground">
            רק מספרי טלפון ברשימה יוכלו למלא את השאלון
          </p>
        </div>
        <Switch
          id="allowlist-enabled"
          checked={allowlist.enabled}
          onCheckedChange={(enabled) => onChange({ ...allowlist, enabled })}
        />
      </div>

      <FormField label="קישור לגוגל שיטס (אופציונלי)">
        <Input
          value={allowlist.googleSheetsUrl ?? ""}
          onChange={(e) =>
            onChange({
              ...allowlist,
              googleSheetsUrl: e.target.value.trim() || null,
            })
          }
          placeholder="https://docs.google.com/spreadsheets/d/..."
          dir="ltr"
          className="font-mono text-sm"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          פרסמו את הגיליון לצפייה ברשת. עמודה נדרשת: טלפון. הסנכרון יתבצע
          אוטומטית בזמן ניסיון מענה וגם בלחיצה על &quot;סנכרון מגוגל שיטס&quot;.
        </p>
        {allowlist.googleSheetsSyncedAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            סנכרון אחרון:{" "}
            {new Date(allowlist.googleSheetsSyncedAt).toLocaleString("he-IL")}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!allowlist.googleSheetsUrl || syncing}
            onClick={() => onSyncGoogleSheets()}
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            סנכרון מגוגל שיטס
          </Button>
          <input
            ref={csvFileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              importAllowlistFile(e.target.files, "csv");
              e.target.value = "";
            }}
          />
          <input
            ref={txtFileRef}
            type="file"
            accept=".txt,text/plain"
            className="hidden"
            onChange={(e) => {
              importAllowlistFile(e.target.files, "txt");
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4" />
            הוספת שורה
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-2"
              )}
            >
              פעולות
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => csvFileRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                ייבוא CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => txtFileRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                ייבוא TXT
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExport}
                disabled={exporting || allowlist.entries.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {exporting ? "מייצא..." : "הורדה לאקסל"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {importError && <p className="mt-2 text-sm text-destructive">{importError}</p>}
      </FormField>

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>טלפון</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {allowlist.entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                  אין רשומות ברשימה
                </TableCell>
              </TableRow>
            ) : (
              allowlist.entries.map((entry, index) => {
                const isDuplicate = duplicateIds.has(entry.id);
                return (
                <TableRow key={entry.id}>
                  <TableCell className="text-center text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="p-2">
                    <Input
                      value={entry.phone}
                      onChange={(e) =>
                        updateEntry(entry.id, { phone: e.target.value })
                      }
                      placeholder="05X-XXXXXXX"
                      dir="ltr"
                      aria-invalid={isDuplicate || undefined}
                      className={cn(
                        "h-9 font-mono",
                        isDuplicate &&
                          "border-destructive focus-visible:ring-destructive/40"
                      )}
                    />
                    {isDuplicate ? (
                      <p className="mt-1 text-xs text-destructive">
                        מספר זה כבר מופיע ברשימה
                      </p>
                    ) : (
                      entry.phone &&
                      formatPhoneDisplay(entry.phone) !== entry.phone && (
                        <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
                          {formatPhoneDisplay(entry.phone)}
                        </p>
                      )
                    )}
                  </TableCell>
                  <TableCell className="p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(entry.id)}
                      aria-label="הסרת שורה"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
