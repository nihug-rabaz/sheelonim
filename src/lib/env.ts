function normalizeEnvValue(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '""' || trimmed === "''") return undefined;
  return trimmed;
}

export function getDatabaseUrl(): string | undefined {
  return normalizeEnvValue(process.env.DATABASE_URL);
}

export function getAuthSecret(): string {
  return normalizeEnvValue(process.env.AUTH_SECRET) ?? "dev-secret-change-in-production";
}

export function isDatabaseEnabled(): boolean {
  return Boolean(getDatabaseUrl());
}
