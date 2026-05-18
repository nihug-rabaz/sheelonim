"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { isNavItemActive } from "@/lib/nav-active";
import type { NavItem } from "@/lib/manage-nav";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ManageEnvFrameProps {
  userName: string;
  navItems: NavItem[];
  children: React.ReactNode;
}

export function ManageEnvFrame({
  userName,
  navItems,
  children,
}: ManageEnvFrameProps) {
  const pathname = usePathname();
  const navHrefs = navItems.map((item) => item.href);
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="flex min-h-full flex-1 bg-muted/30">
      <aside className="hidden w-[17.5rem] shrink-0 border-l border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-full flex-col p-5">
          <Link
            href="/manage"
            prefetch
            className="mb-8 flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-sidebar-accent"
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20">
              <ClipboardList className="size-6" />
            </div>
            <div>
              <p className="font-semibold text-sidebar-foreground">שאלונים</p>
              <p className="text-xs text-muted-foreground">מערכת למיטב</p>
            </div>
          </Link>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const active = isNavItemActive(pathname, item.href, navHrefs);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Separator className="my-4" />

          <div className="flex items-center gap-3 rounded-lg p-2">
            <Avatar className="size-9 border border-sidebar-border">
              <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">מחובר</p>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST" className="mt-2">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
            >
              <LogOut className="size-4" />
              התנתקות
            </Button>
          </form>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
