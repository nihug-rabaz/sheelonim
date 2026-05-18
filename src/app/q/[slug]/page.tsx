import { PublicQuestionnaireForm } from "@/components/questionnaire/public-questionnaire-form";

export default async function PublicQuestionnairePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicQuestionnaireForm slug={slug} />;
}
