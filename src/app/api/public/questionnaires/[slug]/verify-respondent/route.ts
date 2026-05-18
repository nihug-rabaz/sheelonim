import { NextResponse } from "next/server";
import { RESPONDENT_ACCESS_DENIED_MESSAGE } from "@/lib/respondent-allowlist";
import { repositories } from "@/lib/repositories";
import { allowlistService, questionnaireService } from "@/lib/services";
import { isValidIsraeliId, normalizeIsraeliId } from "@/lib/validators/israeli-id";
import {
  isValidIsraeliPhone,
  normalizePhone,
} from "@/lib/validators/phone";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { nationalId, phone } = await request.json();

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

  const normalizedId = normalizeIsraeliId(String(nationalId ?? ""));
  const normalizedPhone = normalizePhone(String(phone ?? ""));

  if (!isValidIsraeliId(normalizedId)) {
    return NextResponse.json({ error: "מספר תעודת זהות לא תקין" }, { status: 400 });
  }
  if (!isValidIsraeliPhone(normalizedPhone)) {
    return NextResponse.json({ error: "מספר טלפון לא תקין" }, { status: 400 });
  }

  const latestQuestionnaire =
    (await repositories.questionnaires.findById(questionnaire.id)) ??
    questionnaire;
  const allowed = await allowlistService.verifyRespondent(
    latestQuestionnaire,
    normalizedId,
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
