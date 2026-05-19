"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { SectionCard } from "@/components/ui/section-card";
import type { EnvironmentListItem } from "@/lib/domain/types";

export function AdminEnvironmentsClient({
  userName,
  initialEnvironments,
}: {
  userName: string;
  initialEnvironments: EnvironmentListItem[];
}) {
  const [environments, setEnvironments] = useState(initialEnvironments);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await fetch("/api/environments");
    const data = await res.json();
    setEnvironments(data.environments ?? []);
  };

  const createEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/environments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    setName("");
    setDescription("");
    setLoading(false);
    load();
  };

  return (
    <AppShell
      title="ניהול סביבות"
      subtitle="יצירה וניהול של כל הסביבות במערכת"
      userName={userName}
      navItems={[
        {
          href: "/admin",
          label: "כל הסביבות",
          icon: <Building2 className="h-5 w-5" />,
        },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <SectionCard
          title="הקמת סביבה חדשה"
          description="הגדר שם ותיאור לסביבת עבודה חדשה"
          icon={Plus}
        >
          <form onSubmit={createEnvironment} className="space-y-5">
            <FormField label="שם הסביבה" htmlFor="env-name">
              <Input
                id="env-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="לדוגמה: מחלקת משאבי אנוש"
                required
              />
            </FormField>
            <FormField label="תיאור" htmlFor="env-desc" hint="תיאור קצר שיוצג למנהלי הסביבה">
              <Textarea
                id="env-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="מה מטרת הסביבה?"
              />
            </FormField>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "יוצר..." : "יצירת סביבה"}
            </Button>
          </form>
        </SectionCard>

        <SectionCard
          title="סביבות קיימות"
          description={`${environments.length} סביבות פעילות במערכת`}
          icon={Building2}
          contentClassName="space-y-3"
        >
          {environments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              עדיין לא נוצרו סביבות
            </p>
          ) : (
            <ul className="space-y-3">
              {environments.map((env) => (
                <li
                  key={env.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                >
                  <EnvInfo env={env} />
                  <Link href={`/manage/${env.id}`}>
                    <Button variant="outline" size="sm">
                      כניסה
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}

function EnvInfo({ env }: { env: EnvironmentListItem }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="font-medium text-foreground">{env.name}</p>
      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
        {env.description || "ללא תיאור"}
      </p>
    </div>
  );
}
