"use client";

import Link from "next/link";
import { useState } from "react";
import { ClipboardList, Pencil } from "lucide-react";
import type { Questionnaire } from "@/lib/domain/types";
import { CopyLinkButton } from "@/components/questionnaire/copy-link-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

export interface QuestionnaireListItem extends Questionnaire {
  publicUrl: string;
}

export function QuestionnairesList({
  envId,
  questionnaires: initial,
}: {
  envId: string;
  questionnaires: QuestionnaireListItem[];
}) {
  const [items, setItems] = useState(initial);

  const toggleActive = async (id: string, isActive: boolean) => {
    const res = await fetch(`/api/questionnaires/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "שגיאה בעדכון");
      return;
    }
    setItems((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isActive: data.questionnaire.isActive } : q))
    );
    toast.success(isActive ? "השאלון הופעל" : "השאלון הושבת");
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-14 text-center">
          <ClipboardList className="mx-auto size-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">אין שאלונים בסביבה זו</p>
          <Link href={`/manage/${envId}/questionnaires/new`} className="mt-6 inline-block">
            <Button>הקמת שאלון ראשון</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((q) => (
        <li key={q.id}>
          <Card className="flex h-full flex-col transition-all hover:border-primary/30 hover:shadow-md">
            <CardContent className="flex flex-1 flex-col gap-4">
              <Link
                href={
                  q.isDraft
                    ? `/manage/${envId}/questionnaires/new?draft=${q.id}`
                    : `/manage/${envId}/questionnaires/${q.id}`
                }
                className="block min-w-0 flex-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{q.title}</h3>
                  <div className="flex shrink-0 flex-wrap gap-1">
                    {q.isDraft && <Badge variant="warning">טיוטה</Badge>}
                    {!q.isDraft && (
                      <Badge variant={q.isActive ? "success" : "muted"}>
                        {q.isActive ? "פעיל" : "לא פעיל"}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {q.description || "ללא תיאור"}
                </p>
                <p className="mt-4 text-xs text-muted-foreground/80">
                  {q.questions.length} שאלות · עודכן {formatDateTime(q.updatedAt)}
                </p>
              </Link>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
                {!q.isDraft ? (
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`active-${q.id}`}
                      checked={q.isActive}
                      onCheckedChange={(checked) => toggleActive(q.id, checked)}
                    />
                    <Label htmlFor={`active-${q.id}`} className="text-sm">
                      פעיל
                    </Label>
                  </div>
                ) : (
                  <Link href={`/manage/${envId}/questionnaires/new?draft=${q.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Pencil className="h-4 w-4" />
                      המשך עריכה
                    </Button>
                  </Link>
                )}
                <CopyLinkButton
                  url={q.publicUrl}
                  disabled={q.isDraft || !q.isActive}
                  label="העתק קישור"
                />
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
