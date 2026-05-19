import { DEFAULT_THANK_YOU_MESSAGE } from "@/lib/domain/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SectionCard } from "@/components/ui/section-card";

type DetailsPanelProps = {
  title: string;
  subtitle: string;
  description: string;
  isActive: boolean;
  closesAt: string;
  useDefaultMessage: boolean;
  thankYouMessage: string;
  allowRespondentPdfDownload: boolean;
  showActiveToggle: boolean;
  onTitleChange: (value: string) => void;
  onSubtitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIsActiveChange: (value: boolean) => void;
  onClosesAtChange: (value: string) => void;
  onUseDefaultMessageChange: (value: boolean) => void;
  onThankYouMessageChange: (value: string) => void;
  onAllowPdfChange: (value: boolean) => void;
};

export function DetailsPanel({
  title,
  subtitle,
  description,
  isActive,
  closesAt,
  useDefaultMessage,
  thankYouMessage,
  allowRespondentPdfDownload,
  showActiveToggle,
  onTitleChange,
  onSubtitleChange,
  onDescriptionChange,
  onIsActiveChange,
  onClosesAtChange,
  onUseDefaultMessageChange,
  onThankYouMessageChange,
  onAllowPdfChange,
}: DetailsPanelProps) {
  return (
    <SectionCard title="פרטי השאלון" description="הגדרות כלליות לשאלון">
      <div className="grid gap-5">
        <div>
          <Label htmlFor="subtitle">כותרת משנית (אופציונלי)</Label>
          <Input
            id="subtitle"
            value={subtitle}
            onChange={(e) => onSubtitleChange(e.target.value)}
            placeholder="מוצגת מתחת ללוגואים ומעל הכותרת הראשית"
            className="mt-2"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            גודל קטן יותר מהכותרת הראשית. השאר ריק אם אין צורך.
          </p>
        </div>
        <div>
          <Label htmlFor="title">כותרת השאלון</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="לדוגמה: שאלון שביעות רצון"
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="description">תיאור</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="תיאור קצר למשיבים"
            className="mt-2"
          />
        </div>
        {showActiveToggle && (
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={onIsActiveChange} id="active" />
            <Label htmlFor="active">שאלון פעיל</Label>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Switch
            checked={allowRespondentPdfDownload}
            onCheckedChange={onAllowPdfChange}
            id="allowPdf"
          />
          <Label htmlFor="allowPdf">אפשר למשיב להוריד עותק PDF בסיום</Label>
        </div>
        <div>
          <Label htmlFor="closesAt">תאריך ושעת סגירה (אופציונלי)</Label>
          <Input
            id="closesAt"
            type="datetime-local"
            value={closesAt}
            onChange={(e) => onClosesAtChange(e.target.value)}
            className="mt-2 max-w-xs"
          />
        </div>
        <div>
          <div className="mb-3 flex items-center gap-3">
            <Switch
              checked={useDefaultMessage}
              onCheckedChange={onUseDefaultMessageChange}
              id="defaultMsg"
            />
            <Label htmlFor="defaultMsg">הודעת סיום ברירת מחדל</Label>
          </div>
          {useDefaultMessage ? (
            <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {DEFAULT_THANK_YOU_MESSAGE}
            </div>
          ) : (
            <Textarea
              value={thankYouMessage}
              onChange={(e) => onThankYouMessageChange(e.target.value)}
              placeholder="הודעה שתוצג לאחר שליחת השאלון"
            />
          )}
        </div>
      </div>
    </SectionCard>
  );
}
