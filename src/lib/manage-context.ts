import { getSession } from "@/lib/auth/session";
import { environmentService } from "@/lib/services";
import { redirect } from "next/navigation";

export async function getManageContext(environmentId: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  const environments =
    await environmentService.getAccessibleEnvironmentList(session);
  const environment = await environmentService.getAccessibleEnvironment(
    session,
    environmentId
  );

  if (!environment) redirect("/manage");

  const isPrimary =
    session.role === "ADMIN" ||
    (await environmentService.isPrimaryManager(session.userId, environmentId));

  return {
    session,
    environment,
    environments,
    isPrimary,
    multiEnvironment: environments.length > 1,
  };
}
