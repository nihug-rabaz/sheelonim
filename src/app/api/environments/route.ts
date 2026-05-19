import { NextResponse } from "next/server";
import { requireAdmin, requireSession } from "@/lib/api/guard";
import { environmentService } from "@/lib/services";

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const environments =
    await environmentService.getAccessibleEnvironmentList(session);
  return NextResponse.json({ environments });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { name, description } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "שם סביבה נדרש" }, { status: 400 });
  }

  const environment = await environmentService.createEnvironment(
    name.trim(),
    description?.trim() ?? ""
  );
  return NextResponse.json({ environment }, { status: 201 });
}
