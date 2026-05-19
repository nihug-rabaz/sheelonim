import { config } from "dotenv";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDatabaseUrl } from "../src/lib/env";
import { getDb } from "../src/lib/db";
import { users } from "../src/lib/db/schema";

config({ path: ".env.local" });
config({ path: ".env" });

const ADMIN_EMAIL = "admin@mitav.local";
const NEW_PASSWORD = process.argv[2] ?? "admin123";

async function main() {
  if (!getDatabaseUrl()) {
    throw new Error("DATABASE_URL is required (copy from Vercel → Project → Settings → Environment Variables)");
  }

  const db = getDb();
  const rows = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.role, "ADMIN"));

  if (rows.length === 0) {
    throw new Error("No admin user found in database");
  }

  const passwordHash = bcrypt.hashSync(NEW_PASSWORD, 10);
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.email, ADMIN_EMAIL));

  console.log(`Password updated for ${ADMIN_EMAIL}`);
  console.log("Admins in database:", rows.map((r) => r.email).join(", "));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
