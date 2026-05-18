"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyLinkButton({
  url,
  label = "העתק קישור",
  size = "sm",
  variant = "outline",
  className,
  disabled,
}: {
  url: string;
  label?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "outline" | "ghost" | "default";
  className?: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!url || disabled) return;
    const ok = await copyToClipboard(url, "הקישור הועתק ללוח");
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
      disabled={disabled || !url}
      onClick={handleCopy}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "הועתק!" : label}
    </Button>
  );
}
