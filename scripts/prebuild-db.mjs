import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL not set — skipping database setup");
  process.exit(0);
}

console.log("Applying database schema...");
execSync("npx drizzle-kit push", { stdio: "inherit" });

console.log("Seeding database...");
execSync("npx tsx scripts/seed.ts", { stdio: "inherit" });
