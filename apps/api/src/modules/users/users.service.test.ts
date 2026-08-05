import assert from "node:assert/strict";
import test from "node:test";

import * as argon2 from "argon2";

import { UsersService } from "./users.service.js";

async function createUsersService(options?: {
  tenantPhotoDataUrl?: string | null;
  userPhotoDataUrl?: string | null;
  driverPhotoDataUrl?: string | null;
  receiptPhotoDataUrl?: string | null;
}) {
  const passwordHash = await argon2.hash("correct-password");
  const deleteFileCalls: Array<string | null | undefined> = [];
  const tenantDeleteCalls: Array<{ id: string }> = [];

  const prisma = {
    user: {
      async findUnique() {
        return {
          id: "user-1",
          tenantId: "tenant-1",
          role: "ADMIN",
          passwordHash
        };
      },
      async findMany() {
        return [{ photoDataUrl: options?.userPhotoDataUrl ?? "/media/user-photo/user-1.jpg" }];
      }
    },
    tenant: {
      async findUnique() {
        return { photoDataUrl: options?.tenantPhotoDataUrl ?? "/media/tenant-logo/tenant-1.jpg" };
      },
      async delete(args: { where: { id: string } }) {
        tenantDeleteCalls.push(args.where);
      }
    },
    driver: {
      async findMany() {
        return [{ photoDataUrl: options?.driverPhotoDataUrl ?? "/media/driver-photo/driver-1.jpg" }];
      }
    },
    fuelLog: {
      async findMany() {
        return [{ receiptPhotoDataUrl: options?.receiptPhotoDataUrl ?? "/media/fuel-receipt/fuel-1.jpg" }];
      }
    }
  };

  const mediaService = {
    async deleteFileByPublicPath(publicPath?: string | null) {
      deleteFileCalls.push(publicPath);
    }
  };

  return {
    service: new UsersService(prisma as never, mediaService as never),
    deleteFileCalls,
    tenantDeleteCalls
  };
}

test("deleteOwnAccount removes every tenant photo file before deleting the tenant", async () => {
  const { service, deleteFileCalls, tenantDeleteCalls } = await createUsersService();

  await service.deleteOwnAccount("user-1", { password: "correct-password" });

  assert.deepEqual(deleteFileCalls.sort(), [
    "/media/driver-photo/driver-1.jpg",
    "/media/fuel-receipt/fuel-1.jpg",
    "/media/tenant-logo/tenant-1.jpg",
    "/media/user-photo/user-1.jpg"
  ]);
  assert.deepEqual(tenantDeleteCalls, [{ id: "tenant-1" }]);
});

test("deleteOwnAccount rejects an invalid password without touching any files", async () => {
  const { service, deleteFileCalls, tenantDeleteCalls } = await createUsersService();

  await assert.rejects(() => service.deleteOwnAccount("user-1", { password: "wrong-password" }));

  assert.deepEqual(deleteFileCalls, []);
  assert.deepEqual(tenantDeleteCalls, []);
});
