import { NextResponse } from "next/server";
import { RESPONDENT_ACCESS_DENIED_MESSAGE } from "@/lib/respondent-allowlist";
import { repositories } from "@/lib/repositories";
import {
  allowlistService,
  DuplicateSubmissionError,
  questionnaireService,
  submissionService,
} from "@/lib/services";
import {
  isValidIsraeliPhone,
  normalizePhone,
} from "@/lib/validators/phone";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { phone } = await request.json();

  const questionnaire = await questionnaireService.getBySlug(slug);
  if (!questionnaire) {
    return NextResponse.json({ error: "שאלון לא נמצא" }, { status: 404 });
  }

  const availability = questionnaireService.isAvailable(questionnaire);
  if (!availability.available) {
    return NextResponse.json(
      { error: availability.reason ?? "השאלון אינו זמין" },
      { status: 403 }
    );
  }

  const normalizedPhone = normalizePhone(String(phone ?? ""));

  if (!isValidIsraeliPhone(normalizedPhone)) {
    return NextResponse.json({ error: "מספר טלפון לא תקין" }, { status: 400 });
  }

  const latestQuestionnaire =
    (await repositories.questionnaires.findById(questionnaire.id)) ??
    questionnaire;

  try {
    await submissionService.assertCanSubmitByPhone(
      latestQuestionnaire.id,
      normalizedPhone
    );
  } catch (e) {
    if (e instanceof DuplicateSubmissionError) {
      return NextResponse.json(
        { error: e.message, allowed: false, alreadySubmitted: true },
        { status: 409 }
      );
    }
    throw e;
  }

  const allowed = await allowlistService.verifyRespondent(
    latestQuestionnaire,
    normalizedPhone
  );

  if (!allowed) {
    return NextResponse.json(
      { error: RESPONDENT_ACCESS_DENIED_MESSAGE, allowed: false },
      { status: 403 }
    );
  }

  return NextResponse.json({ allowed: true });
}
