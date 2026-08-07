import assert from "node:assert/strict";
import test from "node:test";

import { DriversService } from "./drivers.service.js";

function createDriversService(options?: {
  deliveryMode?: "console" | "email" | "resend";
  throwOnSend?: boolean;
  tenant?: { accountType?: string; planCode?: string; planStatus?: string };
  existingDriverCount?: number;
  existingDriver?: Partial<{
    loginEmail: string | undefined;
    registrationId: string | undefined;
    photoDataUrl: string | undefined;
  }>;
  linkedUser?: { id: string; role: string; mustChangePassword: boolean } | null;
}) {
  const activityLogCalls: Array<Record<string, unknown>> = [];
  const sendDriverCredentialsCalls: Array<{ email: string; temporaryPassword: string; fullName: string }> = [];
  const userUpdateCalls: Array<{ where: { id: string }; data: Record<string, unknown> }> = [];
  const deleteFileCalls: Array<string | null | undefined> = [];

  const prisma = {
    tenant: {
      async findUnique() {
        return {
          accountType: options?.tenant?.accountType ?? "COMPANY",
          planCode: options?.tenant?.planCode ?? "COMPANY_PRO",
          planStatus: options?.tenant?.planStatus ?? "ACTIVE"
        };
      }
    },
    driver: {
      async findUnique(args: { where: { id: string } }) {
        return {
          id: args.where.id,
          tenantId: "tenant-sol",
          fullName: "Carlos Almeida",
          loginEmail: options?.existingDriver?.loginEmail,
          registrationId: options?.existingDriver?.registrationId,
          photoDataUrl: options?.existingDriver?.photoDataUrl,
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
        return Array.from({ length: options?.existingDriverCount ?? 0 }, (_, index) => ({
          id: `existing-driver-${index}`,
          employmentStatus: "ACTIVE"
        }));
      },
      async count() {
        return options?.existingDriverCount ?? 0;
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
        return options?.linkedUser ? [options.linkedUser] : [];
      },
      async update(args: { where: { id: string }; data: Record<string, unknown> }) {
        userUpdateCalls.push(args);
        return { ...options?.linkedUser, ...args.data };
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

  const mediaService = {
    async deleteFileByPublicPath(publicPath?: string | null) {
      deleteFileCalls.push(publicPath);
    }
  };

  return {
    service: new DriversService(prisma as never, mailService as never, mediaService as never),
    activityLogCalls,
    sendDriverCredentialsCalls,
    userUpdateCalls,
    deleteFileCalls
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
  assert.equal((result as { credentialsEmailSent?: boolean }).credentialsEmailSent, true);
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
  assert.equal((result as { credentialsEmailSent?: boolean }).credentialsEmailSent, false);
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
  assert.equal((result as { credentialsEmailSent?: boolean }).credentialsEmailSent, false);
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

test("create rejects a third driver on a free-tier individual account", async () => {
  const { service } = createDriversService({
    tenant: { accountType: "INDIVIDUAL", planCode: "ESSENTIAL_FREE" },
    existingDriverCount: 2
  });

  await assert.rejects(
    () =>
      service.create({
        tenantId: "tenant-sol",
        fullName: "Terceiro Motorista",
        cpf: "111.222.333-44",
        cnh: "99887766550",
        cnhCategory: "B",
        cnhExpiresAt: "2027-08-10",
        assignedVehicleIds: [],
        allowAnyVehicle: false
      }),
    /Limite de motoristas/
  );
});

test("create rejects a third driver on a company trial account", async () => {
  const { service } = createDriversService({
    tenant: { accountType: "COMPANY", planCode: "COMPANY_START", planStatus: "TRIAL" },
    existingDriverCount: 2
  });

  await assert.rejects(() =>
    service.create({
      tenantId: "tenant-sol",
      fullName: "Terceiro Motorista",
      registrationId: "MT-1003",
      cnh: "99887766550",
      cnhCategory: "B",
      cnhExpiresAt: "2027-08-10",
      assignedVehicleIds: [],
      allowAnyVehicle: false
    })
  );
});

test("create allows a third driver once the company plan is active", async () => {
  const { service } = createDriversService({
    tenant: { accountType: "COMPANY", planCode: "COMPANY_PRO", planStatus: "ACTIVE" },
    existingDriverCount: 2
  });

  const result = await service.create({
    tenantId: "tenant-sol",
    fullName: "Terceiro Motorista",
    registrationId: "MT-1003",
    cnh: "99887766550",
    cnhCategory: "B",
    cnhExpiresAt: "2027-08-10",
    assignedVehicleIds: [],
    allowAnyVehicle: false
  });

  assert.equal(result.fullName, "Terceiro Motorista");
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

test("delete anonymizes the driver's personal data (LGPD erasure on termination)", async () => {
  const { service } = createDriversService();

  const result = await service.delete({
    id: "driver-1"
  });

  assert.equal(result.fullName, "Motorista removido");
  assert.equal(result.cpf, null);
  assert.equal(result.cnh, null);
  assert.equal(result.cnhCategory, null);
  assert.equal(result.cnhExpiresAt, null);
  assert.equal(result.photoDataUrl, null);
  assert.equal(result.loginEmail, null);
});

test("delete anonymizes the linked login and deletes the photo file when the driver had a login", async () => {
  const { service, userUpdateCalls, deleteFileCalls, activityLogCalls } = createDriversService({
    existingDriver: {
      loginEmail: "carlos@fleet.local",
      registrationId: "MT-1001",
      photoDataUrl: "/media/driver-photo/1700000000000-uuid.jpg"
    },
    linkedUser: { id: "user-1", role: "DRIVER", mustChangePassword: false }
  });

  await service.delete({ id: "driver-1" });

  assert.equal(userUpdateCalls.length, 1);
  assert.equal(userUpdateCalls[0]?.where.id, "user-1");
  assert.equal(userUpdateCalls[0]?.data.fullName, "Motorista removido");
  assert.equal(userUpdateCalls[0]?.data.isActive, false);
  assert.notEqual(userUpdateCalls[0]?.data.email, "carlos@fleet.local");

  assert.deepEqual(deleteFileCalls, ["/media/driver-photo/1700000000000-uuid.jpg"]);

  assert.equal(activityLogCalls[0]?.title, "Motorista desligado (matrícula MT-1001)");
  assert.equal(activityLogCalls[0]?.details, undefined);
});

test("delete skips anonymizing a login when the driver never had one", async () => {
  const { service, userUpdateCalls } = createDriversService();

  await service.delete({ id: "driver-1" });

  assert.equal(userUpdateCalls.length, 0);
});
