import { PtBrMessage } from "./messages.js";

function resolveJwtSecret(
  rawValue: string | undefined,
  testFallback: string,
  requiredMessage: PtBrMessage
) {
  const trimmed = rawValue?.trim();
  if (trimmed) {
    return trimmed;
  }

  if (process.env.NODE_ENV === "test") {
    return testFallback;
  }

  throw new Error(requiredMessage);
}

export function getJwtAccessSecret() {
  return resolveJwtSecret(
    process.env.JWT_ACCESS_SECRET,
    "fleet-test-access-secret",
    PtBrMessage.JWT_ACCESS_SECRET_REQUIRED
  );
}

export function getJwtRefreshSecret() {
  return resolveJwtSecret(
    process.env.JWT_REFRESH_SECRET,
    "fleet-test-refresh-secret",
    PtBrMessage.JWT_REFRESH_SECRET_REQUIRED
  );
}
