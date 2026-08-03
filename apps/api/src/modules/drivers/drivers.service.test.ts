import assert from "node:assert/strict";
import test from "node:test";

import { DriversService } from "./drivers.service.js";

function createDriversService(options?: {
  deliveryMode?: "console" | "email" | "resend";
  throwOnSend?: boolean;
}) {
  const activityLogCalls: Array<Record<string, unknown>> = [];
  const sendDriverCredentialsCalls: Array<{ email: string; temporaryPassword: string; fullName: string }> = [];

  const prisma = {
    driver: {
      async findUnique(args: { where: { id: string } }) {
        return {
          id: args.where.id,
          tenantId: "tenant-sol",
          fullName: "Carlos Almeida",
          loginEmail: undefined,
          cnh: "99887766550",
          createdAt: new Date("2026-05-01T00:00:00.000Z"),
          updatedAt: new Date("2026-05-01T00:00:00.000Z")
        };
      },
      async create(args: { data: Record<string, unknown> }) {
        return {
          id: "driver-1",
          createdAt: new Date("2026-05-01T00:00:00.000Z"),
          updatedAt: new Date("2026-05-01T00:00:00.000Z"),
          ...args.data,
          temporaryPassword: args.data.loginEmail ? "654321" : undefined
        };
      },
      async update(args: { where: { id: string }; data: Record<string, unknown> }) {
        return {
          id: args.where.id,
          tenantId: "tenant-sol",
          fullName: "Carlos Almeida",
          loginEmail: undefined,
          cnh: "99887766550",
          createdAt: new Date("2026-05-01T00:00:00.000Z"),
          updatedAt: new Date("2026-05-01T00:00:00.000Z"),
          ...args.data,
          temporaryPassword: args.data.loginEmail ? "654321" : undefined
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
    },
    user: {
      async findMany() {
        return [];
      }
    }
  };

  const mailService = {
    async sendDriverCredentials(email: string, temporaryPassword: string, fullName: string) {
      sendDriverCredentialsCalls.push({ email, temporaryPassword, fullName });
      if (options?.throwOnSend) {
        throw new Error("Falha ao enviar e-mail via Resend.");
      }
      return { deliveryMode: options?.deliveryMode ?? "console" };
    }
  };

  return {
    service: new DriversService(prisma as never, mailService as never),
    activityLogCalls,
    sendDriverCredentialsCalls
  };
}

test("create defaults active drivers to ACTIVE employment status", async () => {
  const { service, activityLogCalls } = createDriversService();

  const result = await service.create({
    tenantId: "tenant-sol",
    fullName: "Carlos Almeida",
    cpf: "123.456.789-10",
    registrationId: "MT-1001",
    cnh: "99887766550",
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

test("create e-mails the temporary password and hides it from the response once actually sent", async () => {
  const { service, sendDriverCredentialsCalls } = createDriversService({ deliveryMode: "email" });

  const result = await service.create({
    tenantId: "tenant-sol",
    fullName: "Carlos Almeida",
    cpf: "123.456.789-10",
    registrationId: "MT-1001",
    cnh: "99887766550",
    cnhCategory: "B",
    cnhExpiresAt: "2027-08-10",
    loginEmail: "carlos@fleet.local",
    assignedVehicleIds: ["veh-1"],
    allowAnyVehicle: false,
    photoDataUrl: undefined
  });

  assert.equal(sendDriverCredentialsCalls.length, 1);
  assert.equal(sendDriverCredentialsCalls[0]?.email, "carlos@fleet.local");
  assert.equal(sendDriverCredentialsCalls[0]?.temporaryPassword, "654321");
  assert.equal((result as { temporaryPassword?: string }).temporaryPassword, undefined);
});

test("create keeps the temporary password visible when no mail provider is configured", async () => {
  const { service, sendDriverCredentialsCalls } = createDriversService({ deliveryMode: "console" });

  const result = await service.create({
    tenantId: "tenant-sol",
    fullName: "Carlos Almeida",
    cpf: "123.456.789-10",
    registrationId: "MT-1001",
    cnh: "99887766550",
    cnhCategory: "B",
    cnhExpiresAt: "2027-08-10",
    loginEmail: "carlos@fleet.local",
    assignedVehicleIds: ["veh-1"],
    allowAnyVehicle: false,
    photoDataUrl: undefined
  });

  assert.equal(sendDriverCredentialsCalls.length, 1);
  assert.equal((result as { temporaryPassword?: string }).temporaryPassword, "654321");
});

test("create does not fail when the mail provider throws after the driver was already saved", async () => {
  const { service, sendDriverCredentialsCalls } = createDriversService({ throwOnSend: true });

  const result = await service.create({
    tenantId: "tenant-sol",
    fullName: "Carlos Almeida",
    cpf: "123.456.789-10",
    registrationId: "MT-1001",
    cnh: "99887766550",
    cnhCategory: "B",
    cnhExpiresAt: "2027-08-10",
    loginEmail: "carlos@fleet.local",
    assignedVehicleIds: ["veh-1"],
    allowAnyVehicle: false,
    photoDataUrl: undefined
  });

  assert.equal(sendDriverCredentialsCalls.length, 1);
  assert.equal((result as { temporaryPassword?: string }).temporaryPassword, "654321");
});

test("create does not attempt to send mail when no login e-mail is set", async () => {
  const { service, sendDriverCredentialsCalls } = createDriversService();

  await service.create({
    tenantId: "tenant-sol",
    fullName: "Mariana Souza",
    cpf: undefined,
    registrationId: "MT-1002",
    cnh: "11223344550",
    cnhCategory: "AB",
    cnhExpiresAt: "2026-12-14",
    loginEmail: undefined,
    assignedVehicleIds: [],
    allowAnyVehicle: false,
    photoDataUrl: undefined
  });

  assert.equal(sendDriverCredentialsCalls.length, 0);
});

test("create maps inactive flag to VACATION status", async () => {
  const { service } = createDriversService();

  const result = await service.create({
    tenantId: "tenant-sol",
    fullName: "Mariana Souza",
    cpf: undefined,
    registrationId: "MT-1002",
    cnh: "11223344550",
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
    cnh: "99887766550",
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
