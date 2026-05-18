import { getManageContext } from "@/lib/manage-context";
import { buildManageNav } from "@/lib/manage-nav";
import { ManageEnvFrame } from "@/components/layout/manage-env-frame";

export default async function ManageEnvironmentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ envId: string }>;
}) {
  const { envId } = await params;
  const ctx = await getManageContext(envId);

  return (
    <ManageEnvFrame
      userName={ctx.session.name}
      navItems={buildManageNav(
        envId,
        ctx.isPrimary,
        ctx.multiEnvironment,
        ctx.session.role === "ADMIN"
      )}
    >
      {children}
    </ManageEnvFrame>
  );
}
