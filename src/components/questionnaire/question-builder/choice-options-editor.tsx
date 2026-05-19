"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import type { QuestionInput } from "@/lib/services/questionnaire.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { isDefaultOptionLabel } from "@/components/questionnaire/question-builder/utils";

interface ChoiceOptionsEditorProps {
  question: QuestionInput;
  questionIndex: number;
  onChange: (options: NonNullable<QuestionInput["options"]>) => void;
}

export function ChoiceOptionsEditor({
  question,
  questionIndex,
  onChange,
}: ChoiceOptionsEditorProps) {
  const options = question.options ?? [];
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const updateOption = (
    optIndex: number,
    patch: Partial<NonNullable<QuestionInput["options"]>[number]>
  ) => {
    const next = [...options];
    next[optIndex] = { ...next[optIndex], ...patch };
    onChange(next);
  };

  const moveOption = (from: number, to: number) => {
    if (to < 0 || to >= options.length || from === to) return;
    const next = [...options];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null) return;
    moveOption(dragIndex, targetIndex);
    setDragIndex(null);
  };

  return (
    <div className="space-y-2">
      <Label>אפשרויות</Label>
      {options.map((opt, optIndex) => (
        <div
          key={opt.id ?? `opt-${optIndex}`}
          className={`space-y-2 rounded-lg border border-border/50 bg-background p-3 ${
            dragIndex === optIndex ? "opacity-60 ring-2 ring-primary/30" : ""
          }`}
          draggable
          onDragStart={() => setDragIndex(optIndex)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(optIndex);
          }}
          onDragEnd={() => setDragIndex(null)}
        >
          <div className="flex gap-2">
            <button
              type="button"
              className="flex size-11 shrink-0 cursor-grab items-center justify-center rounded-xl border border-border/60 text-muted-foreground active:cursor-grabbing"
              aria-label="גרירה לשינוי סדר"
            >
              <GripVertical className="size-5" />
            </button>
            <Input
              value={opt.label}
              onChange={(e) => updateOption(optIndex, { label: e.target.value })}
              placeholder={`אפשרות ${optIndex + 1}`}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange(options.filter((_, i) => i !== optIndex))}
              disabled={options.length <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={!!opt.allowFreeText}
              onCheckedChange={(v) => {
                const current = options[optIndex];
                updateOption(optIndex, {
                  allowFreeText: v,
                  label:
                    v && isDefaultOptionLabel(current.label)
                      ? "אחר"
                      : current.label,
                });
              }}
              id={`free-text-${questionIndex}-${optIndex}`}
            />
            <Label
              htmlFor={`free-text-${questionIndex}-${optIndex}`}
              className="text-sm font-normal"
            >
              אפשרות ״אחר״ עם שדה להשלמה
            </Label>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...options, { id: uuidv4(), label: "" }])}
      >
        <Plus className="h-4 w-4" />
        הוסף אפשרות
      </Button>
    </div>
  );
}
