import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api/guard";
import { environmentService, allowlistService, questionnaireService } from "@/lib/services";

export async function POST(
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

  try {
    const updated = await allowlistService.syncFromGoogleSheets(id);
    return NextResponse.json({ questionnaire: updated });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "שגיאה בסנכרון" },
      { status: 400 }
    );
  }
}
