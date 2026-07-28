import type { SyncStatus } from "@fleet/shared-types";

export function deriveSyncStatus(online: boolean, pendingItems: number): SyncStatus {
  if (!online) {
    return "OFFLINE";
  }

  if (pendingItems > 0) {
    return "SYNCING";
  }

  return "ONLINE";
}
