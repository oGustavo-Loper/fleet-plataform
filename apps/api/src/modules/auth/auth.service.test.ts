import assert from "node:assert/strict";
import test from "node:test";

import { UnauthorizedException } from "@nestjs/common";
import * as argon2 from "argon2";

import { PtBrMessage } from "../../common/messages.js";
import { AuthService } from "./auth.service.js";

type MockUser = {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "COMPANY" | "DRIVER" | "INDIVIDUAL";
  demoPassword?: string | null;
  passwordHash?: string | null;
  mustChangePassword: boolean;
  driverId?: string;
  assignedVehicleIds?: string[];
  allowAnyVehicle?: boolean;
  isActive: boolean;
};

function createAuthService(options?: {
  users?: MockUser[];
  drivers?: Array<{ id: string; cpf?: string; loginEmail?: string; registrationId?: string }>;
}) {
  const users = options?.users ?? [];
  const drivers = options?.drivers ?? [];
  let updatedUserPayload: Record<string, unknown> | null = null;

  const prisma = {
    user: {
      async findUnique(args: { where: { email?: string; id?: string } }) {
        if (args.where.email) {
          return users.find((user) => user.email === args.where.email) ?? null;
        }
        if (args.where.id) {
          return users.find((user) => user.id === args.where.id) ?? null;
        }
        return null;
      },
      async update(args: { where: { id: string }; data: Record<string, unknown> }) {
        const current = users.find((user) => user.id === args.where.id);
        if (!current) {
          throw new Error("User not found in test double");
        }
        updatedUserPayload = args.data;
        const updated = {
          ...current,
          ...args.data
        };
        return updated;
      }
    },
    driver: {
      async findMany() {
        return drivers;
      }
    },
    passwordResetCode: {
      async create() {
        throw new Error("not implemented in test");
      },
      async findLatestByEmail() {
        return null;
      },
      async incrementAttempts() {
        return undefined;
      },
      async markUsed() {
        return undefined;
      }
    },
    tenant: {}
  };

  const jwtService = {
    async signAsync(payload: { sub: string; email: string }, options: { expiresIn: string }) {
      return `${options.expiresIn}:${payload.sub}:${payload.email}`;
    },
    async verifyAsync(token: string) {
      const [expiresIn, sub, email] = token.split(":");
      if (!expiresIn || !sub || !email) {
        throw new Error("invalid token");
      }
      return { sub, email };
    }
  };

  const mailService = {
    async sendPasswordResetCode() {
      return undefined;
    }
  };

  return {
    service: new AuthService(prisma as never, jwtService as never, mailService as never),
    getUpdatedUserPayload: () => updatedUserPayload
  };
}

test("login accepts e-mail credentials", async () => {
  const { service } = createAuthService({
    users: [
      {
        id: "user-admin",
        tenantId: "tenant-sol",
        email: "demo@fleet.local",
        fullName: "Administrador Demo",
        role: "ADMIN",
        demoPassword: "demo1234",
        mustChangePassword: false,
        isActive: true
      }
    ]
  });

  const result = await service.login({
    identifier: "demo@fleet.local",
    password: "demo1234"
  });

  assert.equal(result.userId, "user-admin");
  assert.equal(result.role, "ADMIN");
  assert.equal(result.accessToken, "15m:user-admin:demo@fleet.local");
});

test("login rejects CPF credentials even for linked drivers", async () => {
  const { service } = createAuthService({
    users: [
      {
        id: "user-driver-1",
        tenantId: "tenant-sol",
        email: "carlos@fleet.local",
        fullName: "Carlos Almeida",
        role: "DRIVER",
        demoPassword: "demo1234",
        mustChangePassword: true,
        driverId: "driver-1",
        assignedVehicleIds: ["veh-1"],
        allowAnyVehicle: false,
        isActive: true
      }
    ],
    drivers: [
      {
        id: "driver-1",
        cpf: "123.456.789-10",
        loginEmail: "carlos@fleet.local"
      }
    ]
  });

  await assert.rejects(
    () =>
      service.login({
        identifier: " 12345678910 ",
        password: "demo1234"
      }),
    (error: unknown) =>
      error instanceof UnauthorizedException &&
      error.message === PtBrMessage.INVALID_CREDENTIALS
  );
});

test("login rejects inactive accounts before checking password", async () => {
  const { service } = createAuthService({
    users: [
      {
        id: "user-driver-2",
        tenantId: "tenant-sol",
        email: "mariana@fleet.local",
        fullName: "Mariana Souza",
        role: "DRIVER",
        demoPassword: "demo1234",
        mustChangePassword: false,
        isActive: false
      }
    ]
  });

  await assert.rejects(
    () =>
      service.login({
        identifier: "mariana@fleet.local",
        password: "demo1234"
      }),
    (error: unknown) =>
      error instanceof UnauthorizedException && error.message === PtBrMessage.ACCOUNT_INACTIVE
  );
});

test("login rejects invalid passwords", async () => {
  const { service } = createAuthService({
    users: [
      {
        id: "user-admin",
        tenantId: "tenant-sol",
        email: "demo@fleet.local",
        fullName: "Administrador Demo",
        role: "ADMIN",
        demoPassword: "demo1234",
        mustChangePassword: false,
        isActive: true
      }
    ]
  });

  await assert.rejects(
    () =>
      service.login({
        identifier: "demo@fleet.local",
        password: "senha-errada"
      }),
    (error: unknown) =>
      error instanceof UnauthorizedException &&
      error.message === PtBrMessage.INVALID_CREDENTIALS
  );
});

test("login accepts hashed passwords without relying on temporary plain text passwords", async () => {
  const { service } = createAuthService({
    users: [
      {
        id: "user-admin",
        tenantId: "tenant-sol",
        email: "owner@fleet.local",
        fullName: "Owner",
        role: "ADMIN",
        passwordHash: await argon2.hash("SenhaForte123"),
        mustChangePassword: false,
        isActive: true
      }
    ]
  });

  const result = await service.login({
    identifier: "owner@fleet.local",
    password: "SenhaForte123"
  });

  assert.equal(result.userId, "user-admin");
  assert.equal(result.role, "ADMIN");
});

test("login rejects CPF when driver is not linked to a login account", async () => {
  const { service } = createAuthService({
    drivers: [
      {
        id: "driver-without-user",
        cpf: "555.444.333-22"
      }
    ]
  });

  await assert.rejects(
    () =>
      service.login({
        identifier: "55544433322",
        password: "demo1234"
      }),
    (error: unknown) =>
      error instanceof UnauthorizedException &&
      error.message === PtBrMessage.INVALID_CREDENTIALS
  );
});

test("completeFirstLogin clears the temporary password requirement", async () => {
  const { service, getUpdatedUserPayload } = createAuthService({
    users: [
      {
        id: "user-driver-1",
        tenantId: "tenant-sol",
        email: "carlos@fleet.local",
        fullName: "Carlos Almeida",
        role: "DRIVER",
        demoPassword: "demo1234",
        mustChangePassword: true,
        isActive: true
      }
    ]
  });

  const result = await service.completeFirstLogin({
    email: "carlos@fleet.local",
    currentPassword: "demo1234",
    newPassword: "senhaNova123"
  });

  assert.equal(result.mustChangePassword, false);
  assert.equal(getUpdatedUserPayload()?.mustChangePassword, false);
  assert.equal(getUpdatedUserPayload()?.demoPassword, null);
  assert.equal(typeof getUpdatedUserPayload()?.passwordHash, "string");
});

test("completeFirstLogin rejects inactive accounts", async () => {
  const { service } = createAuthService({
    users: [
      {
        id: "user-driver-3",
        tenantId: "tenant-sol",
        email: "inactive-driver@fleet.local",
        fullName: "Inactive Driver",
        role: "DRIVER",
        demoPassword: "demo1234",
        mustChangePassword: true,
        isActive: false
      }
    ]
  });

  await assert.rejects(
    () =>
      service.completeFirstLogin({
        email: "inactive-driver@fleet.local",
        currentPassword: "demo1234",
        newPassword: "SenhaNova123"
      }),
    (error: unknown) =>
      error instanceof UnauthorizedException && error.message === PtBrMessage.ACCOUNT_INACTIVE
  );
});

test("refreshSession issues a new auth payload for active users", async () => {
  const { service } = createAuthService({
    users: [
      {
        id: "user-admin",
        tenantId: "tenant-sol",
        email: "demo@fleet.local",
        fullName: "Administrador Demo",
        role: "ADMIN",
        mustChangePassword: false,
        isActive: true
      }
    ]
  });

  const result = await service.refreshSession({
    refreshToken: "7d:user-admin:demo@fleet.local"
  });

  assert.equal(result.userId, "user-admin");
  assert.equal(result.refreshToken, "7d:user-admin:demo@fleet.local");
});

test("refreshSession rejects inactive users", async () => {
  const { service } = createAuthService({
    users: [
      {
        id: "user-admin",
        tenantId: "tenant-sol",
        email: "demo@fleet.local",
        fullName: "Administrador Demo",
        role: "ADMIN",
        mustChangePassword: false,
        isActive: false
      }
    ]
  });

  await assert.rejects(
    () =>
      service.refreshSession({
        refreshToken: "7d:user-admin:demo@fleet.local"
      }),
    (error: unknown) =>
      error instanceof UnauthorizedException && error.message === PtBrMessage.ACCOUNT_INACTIVE
  );
});
