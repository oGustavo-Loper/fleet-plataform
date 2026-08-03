import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";

import { PtBrMessage } from "../../common/messages.js";
import { PrismaService } from "../../common/prisma.service.js";
import { CreateDriverInput } from "./dto/create-driver.input.js";
import { DeleteDriverInput } from "./dto/delete-driver.input.js";
import { UpdateDriverInput } from "./dto/update-driver.input.js";

type DriverAccountInfo = {
  accountRole?: string;
  hasCompletedFirstLogin: boolean;
};

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  private async findLinkedUser(driverId: string) {
    const users = await this.prisma.user.findMany({ where: { driverId } });
    return users[0] ?? null;
  }

  private accountInfoFromUser(user: { role: string; mustChangePassword: boolean } | null): DriverAccountInfo {
    return {
      accountRole: user?.role,
      hasCompletedFirstLogin: user ? !user.mustChangePassword : false
    };
  }

  async listByTenant(tenantId: string) {
    const [drivers, users] = await Promise.all([
      this.prisma.driver.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.user.findMany({ where: { tenantId } })
    ]);

    const userByDriverId = new Map(
      users.filter((user) => user.driverId).map((user) => [user.driverId, user])
    );

    return drivers.map((driver) => ({
      ...driver,
      ...this.accountInfoFromUser(userByDriverId.get(driver.id) ?? null)
    }));
  }

  async create(input: CreateDriverInput) {
    const employmentStatus =
      input.employmentStatus ?? (input.isActive === false ? "VACATION" : "ACTIVE");

    const created = await this.prisma.driver.create({
      data: {
        tenantId: input.tenantId,
        fullName: input.fullName,
        cpf: input.cpf,
        registrationId: input.registrationId,
        cnh: input.cnh,
        cnhCategory: input.cnhCategory,
        cnhExpiresAt: input.cnhExpiresAt,
        loginEmail: input.loginEmail,
        assignedVehicleIds: input.assignedVehicleIds,
        allowAnyVehicle: input.allowAnyVehicle,
        employmentStatus,
        isActive: employmentStatus === "ACTIVE",
        photoDataUrl: input.photoDataUrl
      }
    });

    await this.prisma.activityLog.create({
      data: {
        tenantId: created.tenantId,
        entity: "driver",
        action: "create",
        title: `Motorista cadastrado: ${created.fullName}`,
        details: created.loginEmail ?? undefined
      }
    });

    const linkedUser = await this.findLinkedUser(created.id);
    return { ...created, ...this.accountInfoFromUser(linkedUser) };
  }

  async update(input: UpdateDriverInput, actorTenantId?: string) {
    const currentDriver = await this.prisma.driver.findUnique({
      where: {
        id: input.id
      }
    });

    if (!currentDriver) {
      throw new BadRequestException(PtBrMessage.DRIVER_NOT_FOUND);
    }

    if (actorTenantId && currentDriver.tenantId !== actorTenantId) {
      throw new ForbiddenException(PtBrMessage.DRIVER_ACCESS_DENIED);
    }

    const employmentStatus =
      input.employmentStatus ?? (input.isActive === false ? "VACATION" : "ACTIVE");

    const updated = await this.prisma.driver.update({
      where: {
        id: input.id
      },
      data: {
        fullName: input.fullName,
        cpf: input.cpf,
        registrationId: input.registrationId,
        cnh: input.cnh,
        cnhCategory: input.cnhCategory,
        cnhExpiresAt: input.cnhExpiresAt,
        loginEmail: input.loginEmail,
        assignedVehicleIds: input.assignedVehicleIds,
        allowAnyVehicle: input.allowAnyVehicle,
        employmentStatus,
        isActive: employmentStatus === "ACTIVE",
        photoDataUrl: input.photoDataUrl
      }
    });

    await this.prisma.activityLog.create({
      data: {
        tenantId: updated.tenantId,
        entity: "driver",
        action: "update",
        title: `Motorista atualizado: ${updated.fullName}`,
        details: updated.loginEmail ?? undefined
      }
    });

    const linkedUser = await this.findLinkedUser(updated.id);
    return { ...updated, ...this.accountInfoFromUser(linkedUser) };
  }

  async delete(input: DeleteDriverInput, actorTenantId?: string) {
    const currentDriver = await this.prisma.driver.findUnique({
      where: {
        id: input.id
      }
    });

    if (!currentDriver) {
      throw new BadRequestException(PtBrMessage.DRIVER_NOT_FOUND);
    }

    if (actorTenantId && currentDriver.tenantId !== actorTenantId) {
      throw new ForbiddenException(PtBrMessage.DRIVER_ACCESS_DENIED);
    }

    const deleted = await this.prisma.driver.update({
      where: {
        id: input.id
      },
      data: {
        employmentStatus: "TERMINATED",
        isActive: false
      }
    });

    await this.prisma.activityLog.create({
      data: {
        tenantId: deleted.tenantId,
        entity: "driver",
        action: "update",
        title: `Motorista desligado: ${deleted.fullName}`,
        details: deleted.loginEmail ?? undefined
      }
    });

    const linkedUser = await this.findLinkedUser(deleted.id);
    return { ...deleted, ...this.accountInfoFromUser(linkedUser) };
  }

  async promoteToManager(driverId: string, actorTenantId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });

    if (!driver) {
      throw new BadRequestException(PtBrMessage.DRIVER_NOT_FOUND);
    }

    if (driver.tenantId !== actorTenantId) {
      throw new ForbiddenException(PtBrMessage.DRIVER_ACCESS_DENIED);
    }

    if (!driver.loginEmail) {
      throw new BadRequestException(PtBrMessage.DRIVER_LOGIN_REQUIRED_FOR_MANAGER);
    }

    const linkedUser = await this.findLinkedUser(driverId);

    if (!linkedUser) {
      throw new BadRequestException(PtBrMessage.DRIVER_LOGIN_REQUIRED_FOR_MANAGER);
    }

    if (linkedUser.mustChangePassword) {
      throw new BadRequestException(PtBrMessage.DRIVER_FIRST_LOGIN_REQUIRED_FOR_MANAGER);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: linkedUser.id },
      data: { role: "MANAGER" }
    });

    return { ...driver, ...this.accountInfoFromUser(updatedUser) };
  }

  async demoteToDriver(driverId: string, actorTenantId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });

    if (!driver) {
      throw new BadRequestException(PtBrMessage.DRIVER_NOT_FOUND);
    }

    if (driver.tenantId !== actorTenantId) {
      throw new ForbiddenException(PtBrMessage.DRIVER_ACCESS_DENIED);
    }

    const linkedUser = await this.findLinkedUser(driverId);

    if (!linkedUser) {
      throw new BadRequestException(PtBrMessage.DRIVER_NOT_FOUND);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: linkedUser.id },
      data: { role: "DRIVER" }
    });

    return { ...driver, ...this.accountInfoFromUser(updatedUser) };
  }
}
