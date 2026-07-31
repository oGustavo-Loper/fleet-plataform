import { ApolloError } from "@apollo/client";

import type { SyncQueueItem } from "@fleet/shared-types";

import { queueOfflineMutation } from "./sync-manager";

function isNetworkFailure(error: unknown) {
  if (!navigator.onLine) {
    return true;
  }

  if (error instanceof ApolloError) {
    return Boolean(error.networkError) && error.graphQLErrors.length === 0;
  }

  return false;
}

export async function submitOrQueueOffline<T>(params: {
  entity: SyncQueueItem["entity"];
  tenantId: string;
  payload: Record<string, unknown>;
  mutate: () => Promise<T>;
}): Promise<{ queued: boolean; result?: T }> {
  if (!navigator.onLine) {
    await queueOfflineMutation({
      tenantId: params.tenantId,
      entity: params.entity,
      payload: params.payload
    });
    return { queued: true };
  }

  try {
    const result = await params.mutate();
    return { queued: false, result };
  } catch (error) {
    if (isNetworkFailure(error)) {
      await queueOfflineMutation({
        tenantId: params.tenantId,
        entity: params.entity,
        payload: params.payload
      });
      return { queued: true };
    }

    throw error;
  }
}
