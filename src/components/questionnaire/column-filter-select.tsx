"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ColumnFilterSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export function ColumnFilterSelect({
  options,
  selected,
  onChange,
  className,
}: ColumnFilterSelectProps) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const label =
    selected.length === 0
      ? "הכל"
      : selected.length === 1
        ? selected[0].length > 18
          ? `${selected[0].slice(0, 18)}…`
          : selected[0]
        : `${selected.length} נבחרו`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex h-8 w-full min-w-0 items-center justify-between gap-1 rounded-lg border border-input bg-background px-2 text-xs font-normal shadow-xs outline-none hover:bg-muted/50",
          selected.length > 0 && "border-primary/40 bg-primary/5",
          className
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="size-3.5 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-64 w-56 overflow-y-auto">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs">בחירה מרובה</DropdownMenuLabel>
          {options.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
              אין ערכים
            </p>
          ) : (
            options.map((option) => (
              <DropdownMenuCheckboxItem
                key={option}
                checked={selected.includes(option)}
                onCheckedChange={() => toggle(option)}
                className="text-xs"
              >
                <span className="truncate" title={option}>
                  {option}
                </span>
              </DropdownMenuCheckboxItem>
            ))
          )}
        </DropdownMenuGroup>
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="justify-center text-xs text-muted-foreground"
                onClick={() => onChange([])}
              >
                נקה סינון
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
