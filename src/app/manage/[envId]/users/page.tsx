"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UserPlus, Users } from "lucide-react";
import { ManagePageHeader } from "@/components/layout/manage-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { SectionCard } from "@/components/ui/section-card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ManagerRow {
  link: { id: string; isPrimary: boolean };
  userName: string;
  userEmail: string;
}

export default function EnvironmentUsersPage() {
  const params = useParams();
  const envId = params.envId as string;
  const [managers, setManagers] = useState<ManagerRow[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/environments/${envId}/managers`);
    const data = await res.json();
    setManagers(data.managers ?? []);
  }, [envId]);

  useEffect(() => {
    load();
  }, [load]);

  const addManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(`/api/environments/${envId}/managers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "שגיאה");
      return;
    }
    setName("");
    setEmail("");
    setPassword("");
    load();
  };

  return (
    <>
      <ManagePageHeader
        title="ניהול משתמשי הסביבה"
        subtitle="הוספת מנהלי סביבה נוספים"
      />
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <SectionCard
          title="הוספת מנהל סביבה"
          description="צור משתמש חדש ושייך אותו לסביבה זו"
          icon={UserPlus}
        >
          <form onSubmit={addManager} className="space-y-5">
            <FormField label="שם מלא" htmlFor="manager-name">
              <Input
                id="manager-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </FormField>
            <FormField label="אימייל" htmlFor="manager-email">
              <Input
                id="manager-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                required
              />
            </FormField>
            <FormField label="סיסמה זמנית" htmlFor="manager-password">
              <Input
                id="manager-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
                required
              />
            </FormField>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "מוסיף..." : "הוספת מנהל"}
            </Button>
          </form>
        </SectionCard>

        <SectionCard
          title="מנהלים משויכים"
          description={`${managers.length} מנהלים בסביבה`}
          icon={Users}
          contentClassName="space-y-3"
        >
          {managers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              אין מנהלים נוספים
            </p>
          ) : (
            <ul className="space-y-3">
              {managers.map((m) => (
                <li
                  key={m.link.id}
                  className="rounded-xl border border-border/60 bg-muted/30 p-4"
                >
                  <p className="font-medium">{m.userName}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground" dir="ltr">
                    {m.userEmail}
                  </p>
                  {m.link.isPrimary && (
                    <Badge variant="success" className="mt-2">
                      מנהל ראשי
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
      </div>
    </>
  );
}
