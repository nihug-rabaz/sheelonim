import { PublicQuestionnaireForm } from "@/components/questionnaire/public-questionnaire-form";

export default async function PublicQuestionnairePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;
  return <PublicQuestionnaireForm slug={slug} previewMode={preview === "1"} />;
}
