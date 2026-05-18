import { NextResponse } from "next/server";
import { requireEnvironmentAccess } from "@/lib/api/guard";
import { questionnaireService } from "@/lib/services";
import type { QuestionInput } from "@/lib/services/questionnaire.service";

export async function GET(request: Request) {
  const environmentId = new URL(request.url).searchParams.get("environmentId");
  if (!environmentId) {
    return NextResponse.json({ error: "חסר מזהה סביבה" }, { status: 400 });
  }

  const session = await requireEnvironmentAccess(environmentId);
  if (session instanceof NextResponse) return session;

  const questionnaires =
    await questionnaireService.getByEnvironment(environmentId);
  return NextResponse.json({
    questionnaires: questionnaires.map((q) => ({
      ...q,
      publicUrl: questionnaireService.getPublicUrl(q.slug),
    })),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    environmentId,
    title,
    description,
    isDraft,
    isActive,
    closesAt,
    thankYouMessage,
    sections,
    questions,
    logoSettings,
  } = body;

  if (!environmentId) {
    return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });
  }
  if (!isDraft && !title?.trim()) {
    return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });
  }

  const session = await requireEnvironmentAccess(environmentId);
  if (session instanceof NextResponse) return session;

  const questionnaire = await questionnaireService.create({
    environmentId,
    title: title.trim(),
    description: description?.trim() ?? "",
    isDraft: isDraft ?? false,
    isActive: isActive ?? true,
    closesAt: closesAt ?? null,
    thankYouMessage: thankYouMessage ?? "",
    sections: sections ?? [],
    questions: (questions ?? []) as QuestionInput[],
    logoSettings,
    createdById: session.userId,
  });

  return NextResponse.json({
    questionnaire,
    publicUrl: questionnaireService.getPublicUrl(questionnaire.slug),
  });
}
