"use client";

import { useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import type { QuestionnaireRespondentAllowlist } from "@/lib/domain/types";
import { parseAllowlistCsv } from "@/lib/respondent-allowlist";
import { formatPhoneDisplay } from "@/lib/validators/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/ui/form-field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RespondentAllowlistEditorProps {
  allowlist: QuestionnaireRespondentAllowlist;
  onChange: (allowlist: QuestionnaireRespondentAllowlist) => void;
  onSyncGoogleSheets: () => Promise<void>;
  syncing?: boolean;
}

export function RespondentAllowlistEditor({
  allowlist,
  onChange,
  onSyncGoogleSheets,
  syncing = false,
}: RespondentAllowlistEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState("");

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

  const importCsvFile = async (files: FileList | null) => {
    if (!files?.[0]) return;
    setImportError("");
    try {
      const text = await files[0].text();
      const parsed = parseAllowlistCsv(text);
      if (!parsed.length) {
        setImportError("לא נמצאו שורות תקינות בקובץ");
        return;
      }
      onChange({ ...allowlist, entries: parsed });
    } catch {
      setImportError("שגיאה בקריאת הקובץ");
    }
    if (fileRef.current) fileRef.current.value = "";
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
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => importCsvFile(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            ייבוא CSV
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4" />
            הוספת שורה
          </Button>
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
              allowlist.entries.map((entry, index) => (
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
                      className="h-9 font-mono"
                    />
                    {entry.phone && formatPhoneDisplay(entry.phone) !== entry.phone && (
                      <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
                        {formatPhoneDisplay(entry.phone)}
                      </p>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
