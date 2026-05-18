import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { authService } from "@/lib/services";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "נא למלא אימייל וסיסמה" }, { status: 400 });
    }

    const session = await authService.login(email, password);
    if (!session) {
      return NextResponse.json({ error: "פרטי התחברות שגויים" }, { status: 401 });
    }

    await createSession(session);
    const redirect = session.role === "ADMIN" ? "/admin" : "/manage";
    return NextResponse.json({ success: true, redirect });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "שגיאת שרת. בדוק שהמסד נתונים מוגדר ומחובר." },
      { status: 500 }
    );
  }
}
