import { useEffect, useState } from "react";

import type { SyncStatus } from "@fleet/shared-types";

import { db } from "../lib/db";
import { deriveSyncStatus } from "./sync-status.logic";
import { useConnectivity } from "./useConnectivity";

export function useSyncStatus() {
  const online = useConnectivity();
  const [status, setStatus] = useState<SyncStatus>(online ? "ONLINE" : "OFFLINE");
  const [pendingItems, setPendingItems] = useState(0);

  useEffect(() => {
    void db.outbox.count().then(setPendingItems);
  }, []);

  useEffect(() => {
    if (!online) {
      setStatus("OFFLINE");
      return;
    }

    if (pendingItems > 0) {
      setStatus(deriveSyncStatus(online, pendingItems));
      const timeout = window.setTimeout(() => setStatus("SYNCED"), 800);
      return () => window.clearTimeout(timeout);
    }

    setStatus(deriveSyncStatus(online, pendingItems));
  }, [online, pendingItems]);

  return { status, pendingItems };
}
