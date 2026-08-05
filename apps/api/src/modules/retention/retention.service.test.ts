import assert from "node:assert/strict";
import test from "node:test";

import { RetentionService } from "./retention.service.js";

function createRetentionService(options?: {
  inactiveTenantIds?: string[];
  tenant?: { photoDataUrl?: string | null } | null;
  drivers?: Array<{ id: string; employmentStatus: string }>;
  users?: Array<{ id: string; driverId?: string; photoDataUrl?: string | null }>;
}) {
  const driverDeleteCalls: string[] = [];
  const userUpdateCalls: Array<{ id: string; data: Record<string, unknown> }> = [];
  const tenantUpdateCalls: Array<{ id: string; data: Record<string, unknown> }> = [];
  const markPurgedCalls: string[] = [];
  const deleteFileCalls: Array<string | null | undefined> = [];

  const prisma = {
    retention: {
      async findInactiveTenantIds() {
        return options?.inactiveTenantIds ?? [];
      },
      async markTenantPurged(tenantId: string) {
        markPurgedCalls.push(tenantId);
      }
    },
    tenant: {
      async findUnique() {
        return options?.tenant ?? { photoDataUrl: null };
      },
      async update(args: { where: { id: string }; data: Record<string, unknown> }) {
        tenantUpdateCalls.push({ id: args.where.id, data: args.data });
      }
    },
    driver: {
      async findMany() {
        return options?.drivers ?? [];
      }
    },
    user: {
      async findMany() {
        return options?.users ?? [];
      },
      async update(args: { where: { id: string }; data: Record<string, unknown> }) {
        userUpdateCalls.push({ id: args.where.id, data: args.data });
      }
    }
  };

  const driversService = {
    async delete(input: { id: string }) {
      driverDeleteCalls.push(input.id);
    }
  };

  const mediaService = {
    async deleteFileByPublicPath(publicPath?: string | null) {
      deleteFileCalls.push(publicPath);
    }
  };

  return {
    service: new RetentionService(prisma as never, driversService as never, mediaService as never),
    driverDeleteCalls,
    userUpdateCalls,
    tenantUpdateCalls,
    markPurgedCalls,
    deleteFileCalls
  };
}

test("purgeInactiveTenants does nothing when no tenant is inactive", async () => {
  const { service, driverDeleteCalls, userUpdateCalls, tenantUpdateCalls, markPurgedCalls } =
    createRetentionService({ inactiveTenantIds: [] });

  const result = await service.purgeInactiveTenants();

  assert.deepEqual(result, []);
  assert.deepEqual(driverDeleteCalls, []);
  assert.deepEqual(userUpdateCalls, []);
  assert.deepEqual(tenantUpdateCalls, []);
  assert.deepEqual(markPurgedCalls, []);
});

test("purgeInactiveTenants anonymizes drivers, staff users and the tenant, then marks it purged", async () => {
  const { service, driverDeleteCalls, userUpdateCalls, tenantUpdateCalls, markPurgedCalls, deleteFileCalls } =
    createRetentionService({
      inactiveTenantIds: ["tenant-1"],
      tenant: { photoDataUrl: "/media/tenant-logo/tenant-1.jpg" },
      drivers: [
        { id: "driver-active", employmentStatus: "ACTIVE" },
        { id: "driver-terminated", employmentStatus: "TERMINATED" }
      ],
      users: [
        { id: "admin-1", photoDataUrl: "/media/user-photo/admin-1.jpg" },
        { id: "driver-login-1", driverId: "driver-active", photoDataUrl: "/media/driver-photo/x.jpg" }
      ]
    });

  const result = await service.purgeInactiveTenants();

  assert.deepEqual(result, ["tenant-1"]);
  assert.deepEqual(driverDeleteCalls, ["driver-active"]);
  assert.deepEqual(
    userUpdateCalls.map((call) => call.id),
    ["admin-1"]
  );
  assert.equal(userUpdateCalls[0]?.data.isActive, false);
  assert.equal(userUpdateCalls[0]?.data.passwordHash, null);
  assert.deepEqual(tenantUpdateCalls, [
    {
      id: "tenant-1",
      data: {
        name: "Conta desativada por inatividade",
        documentNumber: null,
        photoDataUrl: null
      }
    }
  ]);
  assert.deepEqual(markPurgedCalls, ["tenant-1"]);
  assert.deepEqual(deleteFileCalls.sort(), [
    "/media/tenant-logo/tenant-1.jpg",
    "/media/user-photo/admin-1.jpg"
  ]);
});

test("purgeInactiveTenants keeps going when one tenant fails", async () => {
  const driverDeleteCalls: string[] = [];
  const markPurgedCalls: string[] = [];

  const prisma = {
    retention: {
      async findInactiveTenantIds() {
        return ["tenant-broken", "tenant-ok"];
      },
      async markTenantPurged(tenantId: string) {
        markPurgedCalls.push(tenantId);
      }
    },
    tenant: {
      async findUnique(args: { where: { id: string } }) {
        if (args.where.id === "tenant-broken") {
          throw new Error("boom");
        }
        return { photoDataUrl: null };
      },
      async update() {
        return undefined;
      }
    },
    driver: {
      async findMany() {
        return [];
      }
    },
    user: {
      async findMany() {
        return [];
      },
      async update() {
        return undefined;
      }
    }
  };

  const driversService = {
    async delete(input: { id: string }) {
      driverDeleteCalls.push(input.id);
    }
  };

  const mediaService = {
    async deleteFileByPublicPath() {
      return undefined;
    }
  };

  const service = new RetentionService(prisma as never, driversService as never, mediaService as never);

  const result = await service.purgeInactiveTenants();

  assert.deepEqual(result, ["tenant-broken", "tenant-ok"]);
  assert.deepEqual(markPurgedCalls, ["tenant-ok"]);
});
