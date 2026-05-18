import { NextResponse } from "next/server";
import { resolveQuestionnaireLogos } from "@/lib/brand-logos";
import { isRespondentAllowlistEnabled } from "@/lib/respondent-allowlist";
import { repositories } from "@/lib/repositories";
import { questionnaireService } from "@/lib/services";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const questionnaire = await questionnaireService.getBySlug(slug);

  if (!questionnaire) {
    return NextResponse.json({ error: "שאלון לא נמצא" }, { status: 404 });
  }

  const availability = questionnaireService.isAvailable(questionnaire);
  const environment = await repositories.environments.findById(
    questionnaire.environmentId
  );
  const resolved =
    environment && resolveQuestionnaireLogos(environment, questionnaire);

  return NextResponse.json({
    questionnaire: {
      id: questionnaire.id,
      title: questionnaire.title,
      description: questionnaire.description,
      sections: questionnaire.sections,
      questions: questionnaire.questions,
      thankYouMessage: questionnaire.thankYouMessage,
      allowRespondentPdfDownload: questionnaire.allowRespondentPdfDownload ?? true,
      logos: resolved?.logos ?? [],
      logoSize: resolved?.size ?? "md",
      respondentAllowlistEnabled: isRespondentAllowlistEnabled(
        questionnaire.respondentAllowlist
      ),
    },
    available: availability.available,
    unavailableReason: availability.reason,
  });
}
