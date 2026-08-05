const DEFAULT_DEV_ORIGINS = ["http://127.0.0.1:5173", "http://localhost:5173"];

function parseOriginList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/**
 * `CORS_ALLOWED_ORIGINS` (comma-separated) wins when set, so a deploy can
 * allow more than one front-end origin (e.g. staging + prod). Otherwise
 * falls back to WEB_BASE_URL (already required for other outbound links),
 * and finally to the local Vite dev origins so local dev keeps working
 * without any env setup.
 */
export function resolveCorsOrigins(): string[] {
  const configured = parseOriginList(process.env.CORS_ALLOWED_ORIGINS);
  if (configured.length > 0) {
    return configured;
  }

  const webBaseUrl = process.env.WEB_BASE_URL?.trim();
  if (webBaseUrl) {
    return [webBaseUrl];
  }

  return DEFAULT_DEV_ORIGINS;
}
