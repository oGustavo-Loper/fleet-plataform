const STORAGE_PREFIX = "fleet-notifications-seen";

function buildKey(userId: string, tenantId: string) {
  return `${STORAGE_PREFIX}:${tenantId}:${userId}`;
}

export function getSeenNotificationIds(userId: string, tenantId: string) {
  const raw = window.localStorage.getItem(buildKey(userId, tenantId));
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export function setSeenNotificationIds(userId: string, tenantId: string, ids: string[]) {
  window.localStorage.setItem(buildKey(userId, tenantId), JSON.stringify(ids.slice(0, 100)));
}
