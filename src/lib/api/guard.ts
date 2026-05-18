import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth/session";
import { environmentService } from "@/lib/services";

export async function requireSession(): Promise<
  SessionPayload | NextResponse
> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }
  return session;
}

export async function requireEnvironmentAccess(
  environmentId: string
): Promise<SessionPayload | NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  if (!(await environmentService.canAccess(session, environmentId))) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  return session;
}

export async function requireAdmin(): Promise<SessionPayload | NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "גישת אדמין בלבד" }, { status: 403 });
  }
  return session;
}
