import { getManageContext } from "@/lib/manage-context";
import { ManagePageHeader } from "@/components/layout/manage-page-header";
import { QuestionnaireAdminPanel } from "@/components/questionnaire/questionnaire-admin-panel";

export default async function QuestionnaireManagePage({
  params,
}: {
  params: Promise<{ envId: string; id: string }>;
}) {
  const { envId, id } = await params;
  const ctx = await getManageContext(envId);

  return (
    <>
      <ManagePageHeader
        title="ניהול שאלון"
        subtitle={ctx.environment.name}
      />
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <QuestionnaireAdminPanel questionnaireId={id} />
      </div>
    </>
  );
}
