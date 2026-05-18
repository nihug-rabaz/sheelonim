import { NextResponse } from "next/server";
import { questionnaireService, submissionService } from "@/lib/services";
import type { SubmissionAnswer } from "@/lib/domain/types";

export async function POST(request: Request) {
  const { slug, phone, answers } = await request.json();

  const questionnaire = await questionnaireService.getBySlug(slug);
  if (!questionnaire) {
    return NextResponse.json({ error: "שאלון לא נמצא" }, { status: 404 });
  }

  try {
    const submission = await submissionService.submit(
      questionnaire,
      phone,
      answers as SubmissionAnswer[]
    );
    return NextResponse.json({
      submissionId: submission.id,
      thankYouMessage: questionnaire.thankYouMessage,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "שגיאה בשליחה" },
      { status: 400 }
    );
  }
}
