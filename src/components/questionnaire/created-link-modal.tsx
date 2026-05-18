"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CreatedLinkModal({
  publicUrl,
  onClose,
}: {
  publicUrl: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-7 w-7 text-emerald-600" />
        </div>
        <h2 className="text-center text-xl font-bold text-slate-900">
          השאלון נוצר בהצלחה!
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          שתף את הקישור הבא עם משתמשי החוץ
        </p>
        <div className="mt-6 flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <input
            readOnly
            value={publicUrl}
            className="flex-1 bg-transparent text-sm outline-none"
            dir="ltr"
          />
          <Button type="button" variant="outline" size="sm" onClick={copy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <Button className="mt-6 w-full" onClick={onClose}>
          מעבר לניהול השאלון
        </Button>
      </div>
    </div>
  );
}
