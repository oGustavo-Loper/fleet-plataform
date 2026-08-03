const STORAGE_PREFIX = "fleet-notifications-seen";
const CLEARED_STORAGE_PREFIX = "fleet-notifications-cleared-before";

function buildKey(userId: string, tenantId: string) {
  return `${STORAGE_PREFIX}:${tenantId}:${userId}`;
}

function buildClearedKey(userId: string, tenantId: string) {
  return `${CLEARED_STORAGE_PREFIX}:${tenantId}:${userId}`;
}

export function getSeenNotificationIds(userId: string, tenantId: string) {
  const raw = window.localStorage.getItem(buildKey(userId, tenantId));
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export function setSeenNotificationIds(userId: string, tenantId: string, ids: string[]) {
  window.localStorage.setItem(buildKey(userId, tenantId), JSON.stringify(ids.slice(0, 100)));
}

export function getNotificationsClearedBefore(userId: string, tenantId: string) {
  return window.localStorage.getItem(buildClearedKey(userId, tenantId));
}

export function setNotificationsClearedBefore(userId: string, tenantId: string, isoDate: string) {
  window.localStorage.setItem(buildClearedKey(userId, tenantId), isoDate);
}
