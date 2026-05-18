import { getSession } from "@/lib/auth/session";
import { environmentService } from "@/lib/services";
import { AdminEnvironmentsClient } from "@/app/admin/admin-client";

export default async function AdminPage() {
  const session = await getSession();
  const environments = await environmentService.getAccessibleEnvironments(
    session!
  );

  return (
    <AdminEnvironmentsClient
      userName={session!.name}
      initialEnvironments={environments}
    />
  );
}
