import { useEffect, useRef, useState } from "react";
import { liveQuery } from "dexie";

import type { SyncStatus } from "@fleet/shared-types";

import { db } from "../lib/db";
import { deriveSyncStatus } from "./sync-status.logic";
import { useConnectivity } from "./useConnectivity";

const SYNCED_FLASH_MS = 2500;

export function useSyncStatus() {
  const online = useConnectivity();
  const [pendingItems, setPendingItems] = useState(0);
  const [justSynced, setJustSynced] = useState(false);
  const previousPendingRef = useRef(0);

  useEffect(() => {
    const subscription = liveQuery(() => db.outbox.count()).subscribe({
      next: (count) => {
        if (previousPendingRef.current > 0 && count === 0) {
          setJustSynced(true);
          window.setTimeout(() => setJustSynced(false), SYNCED_FLASH_MS);
        }
        previousPendingRef.current = count;
        setPendingItems(count);
      },
      error: () => setPendingItems(0)
    });

    return () => subscription.unsubscribe();
  }, []);

  const status: SyncStatus = justSynced && online ? "SYNCED" : deriveSyncStatus(online, pendingItems);

  return { status, pendingItems };
}
