import type { SyncQueueItem } from "@fleet/shared-types";

import { apolloClient } from "./apollo";
import { db } from "./db";
import { getDeviceId } from "./device";
import { PUSH_SYNC_EVENT_MUTATION } from "./queries";

type PushSyncEventResult = {
  pushSyncEvent: {
    operationId: string;
    status: string;
    errorMessage?: string;
  };
};

let isFlushing = false;
let listenersBound = false;

export async function queueOfflineMutation(params: {
  tenantId: string;
  entity: SyncQueueItem["entity"];
  payload: Record<string, unknown>;
}) {
  const item: SyncQueueItem<Record<string, unknown>> = {
    id: crypto.randomUUID(),
    tenantId: params.tenantId,
    entity: params.entity,
    operation: "create",
    payload: params.payload,
    createdAt: new Date().toISOString(),
    status: "PENDING"
  };

  await db.outbox.add(item);
  void flushOutbox();
  return item;
}

export async function flushOutbox() {
  if (isFlushing || !navigator.onLine) {
    return;
  }

  isFlushing = true;

  try {
    const pending = (await db.outbox.orderBy("createdAt").toArray()).filter(
      (item) => item.status === "PENDING" || item.status === "ERROR"
    );

    for (const item of pending) {
      await db.outbox.update(item.id, { status: "SYNCING" });

      try {
        const result = await apolloClient.mutate<PushSyncEventResult>({
          mutation: PUSH_SYNC_EVENT_MUTATION,
          variables: {
            input: {
              tenantId: item.tenantId,
              deviceId: getDeviceId(),
              entity: item.entity,
              operation: item.operation,
              operationId: item.id,
              payloadJson: JSON.stringify(item.payload)
            }
          }
        });

        const payload = result.data?.pushSyncEvent;
        if (payload?.status === "SYNCED") {
          await db.outbox.delete(item.id);
        } else {
          await db.outbox.update(item.id, {
            status: "ERROR",
            errorMessage: payload?.errorMessage ?? "Falha ao sincronizar."
          });
        }
      } catch (error) {
        await db.outbox.update(item.id, {
          status: "ERROR",
          errorMessage: error instanceof Error ? error.message : "Falha ao sincronizar."
        });
      }
    }
  } finally {
    isFlushing = false;
  }
}

export async function getPendingMaxOdometerKm(entity: SyncQueueItem["entity"], vehicleId: string) {
  if (!vehicleId) {
    return 0;
  }

  const items = await db.outbox.where("entity").equals(entity).toArray();

  return items.reduce((max, item) => {
    const payload = item.payload as Record<string, unknown>;
    if (payload?.vehicleId !== vehicleId) {
      return max;
    }
    const km = Number(payload.odometerKm);
    return Number.isFinite(km) ? Math.max(max, km) : max;
  }, 0);
}

export function initSyncManager() {
  if (listenersBound || typeof window === "undefined") {
    return;
  }
  listenersBound = true;

  window.addEventListener("online", () => void flushOutbox());
  void flushOutbox();
}
