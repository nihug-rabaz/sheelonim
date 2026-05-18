import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });
import { eq } from "drizzle-orm";
import { getDb } from "../src/lib/db";
import { createSeedData } from "../src/lib/db/seed-data";
import {
  environmentManagers,
  environments,
  questionnaires,
  users,
} from "../src/lib/db/schema";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const db = getDb();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "admin@mitav.local"))
    .limit(1);

  if (existing.length > 0) {
    console.log("Seed skipped — demo data already exists");
    return;
  }

  const data = createSeedData();

  for (const user of data.users) {
    await db.insert(users).values({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    });
  }

  for (const environment of data.environments) {
    await db.insert(environments).values({
      id: environment.id,
      name: environment.name,
      description: environment.description,
      createdAt: environment.createdAt,
    });
  }

  for (const link of data.environmentManagers) {
    await db.insert(environmentManagers).values({
      id: link.id,
      environmentId: link.environmentId,
      userId: link.userId,
      isPrimary: link.isPrimary,
    });
  }

  for (const questionnaire of data.questionnaires) {
    await db.insert(questionnaires).values({
      id: questionnaire.id,
      environmentId: questionnaire.environmentId,
      title: questionnaire.title,
      description: questionnaire.description,
      slug: questionnaire.slug,
      isActive: questionnaire.isActive,
      closesAt: questionnaire.closesAt,
      thankYouMessage: questionnaire.thankYouMessage,
      questions: questionnaire.questions,
      createdById: questionnaire.createdById,
      createdAt: questionnaire.createdAt,
      updatedAt: questionnaire.updatedAt,
    });
  }

  console.log("Seed completed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
