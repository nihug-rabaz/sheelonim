import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, ChevronLeft, Settings2 } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { environmentService } from "@/lib/services";
import { AppShell } from "@/components/layout/app-shell";
import { buildManageNav, type NavItem } from "@/lib/manage-nav";
import { Card, CardContent } from "@/components/ui/card";

export default async function ManageEnvironmentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const environments =
    await environmentService.getAccessibleEnvironments(session);

  if (environments.length === 1) {
    redirect(`/manage/${environments[0].id}`);
  }

  const firstEnv = environments[0];
  const isAdmin = session.role === "ADMIN";
  const adminOnlyNav: NavItem[] = [
    {
      href: "/admin",
      label: "הקמת סביבה / כל הסביבות",
      icon: <Settings2 className="h-5 w-5" />,
    },
  ];
  const navItems =
    firstEnv != null
      ? buildManageNav(
          firstEnv.id,
          false,
          environments.length > 1,
          isAdmin
        )
      : isAdmin
        ? adminOnlyNav
        : [];

  return (
    <AppShell
      title="הסביבות שלי"
      subtitle="בחר סביבה לניהול השאלונים שלה"
      userName={session.name}
      navItems={navItems}
    >
      <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-foreground">
        {isAdmin ? (
          <>
            <span className="font-semibold">יצירת סביבה חדשה: </span>
            נכנסים ל־
            <Link href="/admin" className="font-medium text-primary underline-offset-2 hover:underline">
              ניהול סביבות
            </Link>
            — בראש הדף מופיע טופס ״הקמת סביבה חדשה״. בתוך סביבה אפשר גם לפתוח את הקישור ״הקמת סביבה / כל הסביבות״ בתפריט הצד.
          </>
        ) : (
          <>
            <span className="font-semibold">יצירת סביבה חדשה: </span>
            רק למנהל המערכת. אם נדרשת סביבה חדשה, פני למנהל המערכת.
          </>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {environments.map((env) => (
          <Link key={env.id} href={`/manage/${env.id}`}>
            <Card className="group transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary">
                      {env.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {env.description}
                    </p>
                  </div>
                </div>
                <ChevronLeft className="size-5 text-muted-foreground/50 group-hover:text-primary" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
