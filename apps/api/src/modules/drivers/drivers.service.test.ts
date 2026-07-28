import assert from "node:assert/strict";
import test from "node:test";

import { DriversService } from "./drivers.service.js";

function createDriversService() {
  const activityLogCalls: Array<Record<string, unknown>> = [];

  const prisma = {
    driver: {
      async findUnique(args: { where: { id: string } }) {
        return {
          id: args.where.id,
          tenantId: "tenant-sol",
          fullName: "Carlos Almeida",
          loginEmail: undefined,
          cnh: "9988776655",
          createdAt: new Date("2026-05-01T00:00:00.000Z"),
          updatedAt: new Date("2026-05-01T00:00:00.000Z")
        };
      },
      async create(args: { data: Record<string, unknown> }) {
        return {
          id: "driver-1",
          createdAt: new Date("2026-05-01T00:00:00.000Z"),
          updatedAt: new Date("2026-05-01T00:00:00.000Z"),
          ...args.data
        };
      },
      async update(args: { where: { id: string }; data: Record<string, unknown> }) {
        return {
          id: args.where.id,
          tenantId: "tenant-sol",
          fullName: "Carlos Almeida",
          loginEmail: undefined,
          cnh: "9988776655",
          createdAt: new Date("2026-05-01T00:00:00.000Z"),
          updatedAt: new Date("2026-05-01T00:00:00.000Z"),
          ...args.data
        };
      },
      async findMany() {
        return [];
      }
    },
    activityLog: {
      async create(args: { data: Record<string, unknown> }) {
        activityLogCalls.push(args.data);
        return args.data;
      }
    }
  };

  return {
    service: new DriversService(prisma as never),
    activityLogCalls
  };
}

test("create defaults active drivers to ACTIVE employment status", async () => {
  const { service, activityLogCalls } = createDriversService();

  const result = await service.create({
    tenantId: "tenant-sol",
    fullName: "Carlos Almeida",
    cpf: "123.456.789-10",
    registrationId: "MT-1001",
    cnh: "9988776655",
    cnhCategory: "B",
    cnhExpiresAt: "2027-08-10",
    loginEmail: "carlos@fleet.local",
    assignedVehicleIds: ["veh-1"],
    allowAnyVehicle: false,
    photoDataUrl: undefined
  });

  assert.equal(result.employmentStatus, "ACTIVE");
  assert.equal(result.isActive, true);
  assert.equal((result as { registrationId?: string }).registrationId, "MT-1001");
  assert.equal(activityLogCalls[0]?.details, "carlos@fleet.local");
});

test("create maps inactive flag to VACATION status", async () => {
  const { service } = createDriversService();

  const result = await service.create({
    tenantId: "tenant-sol",
    fullName: "Mariana Souza",
    cpf: undefined,
    registrationId: "MT-1002",
    cnh: "1122334455",
    cnhCategory: "AB",
    cnhExpiresAt: "2026-12-14",
    loginEmail: undefined,
    assignedVehicleIds: [],
    allowAnyVehicle: false,
    isActive: false,
    photoDataUrl: undefined
  });

  assert.equal(result.employmentStatus, "VACATION");
  assert.equal(result.isActive, false);
  assert.equal((result as { registrationId?: string }).registrationId, "MT-1002");
});

test("update preserves LGPD by not logging CNH as activity detail", async () => {
  const { service, activityLogCalls } = createDriversService();

  const result = await service.update({
    id: "driver-1",
    fullName: "Carlos Almeida",
    cpf: "123.456.789-10",
    registrationId: "MT-1001",
    cnh: "9988776655",
    cnhCategory: "B",
    cnhExpiresAt: "2027-08-10",
    loginEmail: undefined,
    assignedVehicleIds: ["veh-1"],
    allowAnyVehicle: false,
    employmentStatus: "ACTIVE",
    isActive: true,
    photoDataUrl: undefined
  });

  assert.equal(result.employmentStatus, "ACTIVE");
  assert.equal(activityLogCalls[0]?.details, undefined);
});

test("delete transitions driver to TERMINATED and blocks access", async () => {
  const { service } = createDriversService();

  const result = await service.delete({
    id: "driver-1"
  });

  assert.equal(result.employmentStatus, "TERMINATED");
  assert.equal(result.isActive, false);
});
