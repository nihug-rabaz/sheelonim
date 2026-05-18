import { NextResponse } from "next/server";
import { requireEnvironmentAccess } from "@/lib/api/guard";
import { authService, environmentService } from "@/lib/services";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireEnvironmentAccess(id);
  if (session instanceof NextResponse) return session;

  const managers = await environmentService.getManagers(id);
  return NextResponse.json({ managers });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireEnvironmentAccess(id);
  if (session instanceof NextResponse) return session;

  if (
    session.role !== "ADMIN" &&
    !(await environmentService.isPrimaryManager(session.userId, id))
  ) {
    return NextResponse.json(
      { error: "רק מנהל ראשי יכול להוסיף מנהלים" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { email, password, name, existingUserId } = body;

  let userId = existingUserId;
  if (!userId) {
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "נא למלא שם, אימייל וסיסמה" },
        { status: 400 }
      );
    }
    try {
      const user = await authService.createManagerUser(email, password, name);
      userId = user.id;
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "שגיאה" },
        { status: 400 }
      );
    }
  }

  try {
    const link = await environmentService.addManager(id, userId, false);
    return NextResponse.json({ link }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "שגיאה" },
      { status: 400 }
    );
  }
}
