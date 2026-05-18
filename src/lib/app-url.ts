const PRODUCTION_APP_URL = "https://sheelonim.rabaz.co.il";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function isVercelDeploymentHost(host: string): boolean {
  return host === "vercel.app" || host.endsWith(".vercel.app");
}

export function getAppBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return normalizeBaseUrl(fromEnv);

  if (process.env.VERCEL_ENV === "production") {
    return PRODUCTION_APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function resolveAppBaseUrl(host: string | null, proto = "https"): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return normalizeBaseUrl(fromEnv);

  if (host && !isVercelDeploymentHost(host)) {
    return normalizeBaseUrl(`${proto}://${host}`);
  }

  return getAppBaseUrl();
}

export function getPublicQuestionnaireUrl(slug: string): string {
  return `${getAppBaseUrl()}/q/${slug}`;
}
