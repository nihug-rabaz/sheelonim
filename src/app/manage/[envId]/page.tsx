import Link from "next/link";
import { BarChart3, ClipboardList, FilePlus2, MessageSquare } from "lucide-react";
import { getManageContext } from "@/lib/manage-context";
import { questionnaireService, submissionService } from "@/lib/services";
import { ManagePageHeader } from "@/components/layout/manage-page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { formatDateTime } from "@/lib/utils";

export default async function EnvironmentDashboardPage({
  params,
}: {
  params: Promise<{ envId: string }>;
}) {
  const { envId } = await params;
  const ctx = await getManageContext(envId);
  const questionnaires = await questionnaireService.getByEnvironment(envId);
  const submissionLists = await Promise.all(
    questionnaires.map((q) => submissionService.getByQuestionnaire(q.id))
  );
  const totalResponses = submissionLists.reduce(
    (sum, list) => sum + list.length,
    0
  );
  const activeCount = questionnaires.filter((q) => q.isActive).length;

  return (
    <>
      <ManagePageHeader
        title={ctx.environment.name}
        subtitle="לוח בקרה — סקירה מהירה"
        actions={
          <Link href={`/manage/${envId}/questionnaires/new`}>
            <Button size="lg" className="gap-2 shadow-sm">
              <FilePlus2 className="size-4" />
              הקמת שאלון
            </Button>
          </Link>
        }
      />
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="שאלונים"
          value={questionnaires.length}
          icon={ClipboardList}
        />
        <StatCard label="פעילים" value={activeCount} icon={BarChart3} />
        <StatCard
          label="תשובות שהתקבלו"
          value={totalResponses}
          icon={MessageSquare}
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>שאלונים אחרונים</CardTitle>
            <CardDescription>השאלונים שעודכנו לאחרונה בסביבה</CardDescription>
          </div>
          <Link href={`/manage/${envId}/questionnaires`}>
            <Button variant="ghost" size="sm">
              הצג הכל
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          {questionnaires.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              עדיין לא נוצרו שאלונים
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {questionnaires.slice(0, 5).map((q) => (
                <li
                  key={q.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <ClipboardList className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{q.title}</p>
                      <p className="text-xs text-muted-foreground">
                        עודכן {formatDateTime(q.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={q.isActive ? "success" : "muted"}>
                      {q.isActive ? "פעיל" : "לא פעיל"}
                    </Badge>
                    <Link href={`/manage/${envId}/questionnaires/${q.id}`}>
                      <Button variant="outline" size="sm">
                        ניהול
                      </Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  );
}
