import { getManageContext } from "@/lib/manage-context";
import { questionnaireService } from "@/lib/services";
import { ManagePageHeader } from "@/components/layout/manage-page-header";
import {
  QuestionnairesList,
  type QuestionnaireListItem,
} from "@/components/questionnaire/questionnaires-list";

export default async function QuestionnairesListPage({
  params,
}: {
  params: Promise<{ envId: string }>;
}) {
  const { envId } = await params;
  const ctx = await getManageContext(envId);
  const questionnaires = await questionnaireService.getByEnvironment(envId);
  const items: QuestionnaireListItem[] = questionnaires.map((q) => ({
    ...q,
    publicUrl: questionnaireService.getPublicUrl(q.slug),
  }));

  return (
    <>
      <ManagePageHeader
        title="השאלונים שלי"
        subtitle={ctx.environment.name}
      />
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <QuestionnairesList envId={envId} questionnaires={items} />
      </div>
    </>
  );
}
