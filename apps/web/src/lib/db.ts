import Dexie, { Table } from "dexie";

import type { SyncQueueItem, VehicleListItem } from "@fleet/shared-types";

export class FleetDatabase extends Dexie {
  vehicles!: Table<VehicleListItem, string>;
  outbox!: Table<SyncQueueItem<Record<string, unknown>>, string>;

  constructor() {
    super("fleet-platform");

    this.version(1).stores({
      vehicles: "id, plate, status",
      outbox: "id, status, createdAt"
    });
  }
}

export const db = new FleetDatabase();
