import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api/guard";
import {
  analyticsService,
  environmentService,
  questionnaireService,
  submissionService,
} from "@/lib/services";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const questionnaire = await questionnaireService.getById(id);
  if (!questionnaire) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }
  if (!(await environmentService.canAccess(session, questionnaire.environmentId))) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const url = new URL(request.url);
  const phone = url.searchParams.get("phone") ?? undefined;

  const submissions = phone
    ? await submissionService.findRespondentSubmissions(id, phone)
    : await submissionService.getByQuestionnaire(id);

  const analytics = analyticsService.analyze(questionnaire, submissions);

  return NextResponse.json({ submissions, analytics, questionnaire });
}
