const AUTH_KEY = "fleet-auth";

export type StoredAuth = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  userId: string;
  tenantId: string;
  email: string;
  role: "ADMIN" | "COMPANY" | "DRIVER" | "INDIVIDUAL";
  fullName: string;
  driverId?: string;
  assignedVehicleIds: string[];
  allowAnyVehicle: boolean;
  mustChangePassword: boolean;
  rememberMe: boolean;
};

function parseJwtExpiration(token: string) {
  const [, payload] = token.split(".");
  if (!payload) {
    return undefined;
  }

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalizedPayload));
    if (typeof decoded.exp !== "number") {
      return undefined;
    }

    return new Date(decoded.exp * 1000).toISOString();
  } catch {
    return undefined;
  }
}

export function getTokenExpiration(token?: string) {
  if (!token) {
    return undefined;
  }

  return parseJwtExpiration(token);
}

function normalizeStoredAuth(auth: StoredAuth) {
  return {
    ...auth,
    rememberMe: auth.rememberMe ?? true,
    accessTokenExpiresAt: auth.accessTokenExpiresAt ?? parseJwtExpiration(auth.accessToken),
    refreshTokenExpiresAt: auth.refreshTokenExpiresAt ?? parseJwtExpiration(auth.refreshToken)
  } satisfies StoredAuth;
}

function readStoredAuthFrom(storage: Storage) {
  const raw = storage.getItem(AUTH_KEY);
  if (!raw) {
    return null;
  }

  try {
    return normalizeStoredAuth(JSON.parse(raw) as StoredAuth);
  } catch {
    storage.removeItem(AUTH_KEY);
    return null;
  }
}

function isExpired(auth: StoredAuth) {
  if (!auth.refreshTokenExpiresAt) {
    return false;
  }

  return new Date(auth.refreshTokenExpiresAt).getTime() <= Date.now();
}

export function getStoredAuth() {
  const sessionAuth = readStoredAuthFrom(window.sessionStorage);
  if (sessionAuth) {
    if (isExpired(sessionAuth)) {
      window.sessionStorage.removeItem(AUTH_KEY);
    } else {
      return sessionAuth;
    }
  }

  const localAuth = readStoredAuthFrom(window.localStorage);
  if (!localAuth) {
    return null;
  }

  if (isExpired(localAuth)) {
    window.localStorage.removeItem(AUTH_KEY);
    return null;
  }

  return localAuth;
}

export function getAccessToken() {
  return getStoredAuth()?.accessToken ?? "";
}

export function setStoredAuth(auth: StoredAuth) {
  const normalized = normalizeStoredAuth(auth);
  const targetStorage = normalized.rememberMe ? window.localStorage : window.sessionStorage;
  window.localStorage.removeItem(AUTH_KEY);
  window.sessionStorage.removeItem(AUTH_KEY);
  targetStorage.setItem(AUTH_KEY, JSON.stringify(normalized));
}

export function clearStoredAuth() {
  window.localStorage.removeItem(AUTH_KEY);
  window.sessionStorage.removeItem(AUTH_KEY);
}
