import { NextResponse } from "next/server";
import { requireEnvironmentAccess } from "@/lib/api/guard";
import { environmentService } from "@/lib/services";
import type { BrandLogo, LogoSize } from "@/lib/domain/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireEnvironmentAccess(id);
  if (session instanceof NextResponse) return session;

  const environment = await environmentService.getAccessibleEnvironments(session);
  const env = environment.find((e) => e.id === id);
  if (!env) {
    return NextResponse.json({ error: "סביבה לא נמצאה" }, { status: 404 });
  }

  return NextResponse.json({ environment: env });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireEnvironmentAccess(id);
  if (session instanceof NextResponse) return session;

  const body = await request.json();

  if (body.logos !== undefined || body.defaultLogoSize !== undefined) {
    const existing = (await environmentService.getAccessibleEnvironments(session)).find(
      (e) => e.id === id
    );
    if (!existing) {
      return NextResponse.json({ error: "סביבה לא נמצאה" }, { status: 404 });
    }
    const logos = (body.logos ?? existing.logos) as BrandLogo[];
    const defaultLogoSize = (body.defaultLogoSize ??
      existing.defaultLogoSize) as LogoSize;
    const environment = await environmentService.updateBranding(
      id,
      logos,
      defaultLogoSize
    );
    return NextResponse.json({ environment });
  }

  const { name, description } = body;
  if (!name?.trim()) {
    return NextResponse.json({ error: "שם סביבה נדרש" }, { status: 400 });
  }
  const environment = await environmentService.updateEnvironment(
    id,
    name.trim(),
    description?.trim() ?? ""
  );
  return NextResponse.json({ environment });
}
