import { NextResponse } from "next/server";
import {
  DuplicateSubmissionError,
  questionnaireService,
  submissionService,
} from "@/lib/services";
import type { SubmissionAnswer } from "@/lib/domain/types";

export async function POST(request: Request) {
  const { slug, phone, answers, preview } = await request.json();
  const isPreview = preview === true;

  const questionnaire = await questionnaireService.getBySlug(slug);
  if (!questionnaire) {
    return NextResponse.json({ error: "שאלון לא נמצא" }, { status: 404 });
  }

  try {
    const submission = isPreview
      ? await submissionService.submitPreview(
          questionnaire,
          phone,
          answers as SubmissionAnswer[]
        )
      : await submissionService.submit(
          questionnaire,
          phone,
          answers as SubmissionAnswer[]
        );
    return NextResponse.json({
      submissionId: submission.id,
      thankYouMessage: questionnaire.thankYouMessage,
    });
  } catch (e) {
    const duplicate = e instanceof DuplicateSubmissionError;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "שגיאה בשליחה" },
      { status: duplicate ? 409 : 400 }
    );
  }
}
