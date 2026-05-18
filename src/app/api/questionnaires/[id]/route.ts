import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api/guard";
import { environmentService, questionnaireService } from "@/lib/services";
import type { QuestionInput } from "@/lib/services/questionnaire.service";

export async function GET(
  _request: Request,
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

  return NextResponse.json({
    questionnaire,
    publicUrl: questionnaireService.getPublicUrl(questionnaire.slug),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const existing = await questionnaireService.getById(id);
  if (!existing) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }
  if (!(await environmentService.canAccess(session, existing.environmentId))) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const updated = await questionnaireService.update(id, {
      ...body,
      sections: body.sections,
      questions: body.questions as QuestionInput[] | undefined,
    });

    return NextResponse.json({
      questionnaire: updated,
      publicUrl: questionnaireService.getPublicUrl(updated.slug),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "שגיאה בעדכון" },
      { status: 400 }
    );
  }
}
