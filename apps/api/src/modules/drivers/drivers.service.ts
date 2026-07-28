import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";

import { PtBrMessage } from "../../common/messages.js";
import { PrismaService } from "../../common/prisma.service.js";
import { CreateDriverInput } from "./dto/create-driver.input.js";
import { DeleteDriverInput } from "./dto/delete-driver.input.js";
import { UpdateDriverInput } from "./dto/update-driver.input.js";

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  listByTenant(tenantId: string) {
    return this.prisma.driver.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" }
    });
  }

  create(input: CreateDriverInput) {
    const employmentStatus =
      input.employmentStatus ?? (input.isActive === false ? "VACATION" : "ACTIVE");

    return this.prisma.driver.create({
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
    }).then(async (created) => {
      await this.prisma.activityLog.create({
        data: {
          tenantId: created.tenantId,
          entity: "driver",
          action: "create",
          title: `Motorista cadastrado: ${created.fullName}`,
          details: created.loginEmail ?? undefined
        }
      });
      return created;
    });
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

    return this.prisma.driver.update({
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
    }).then(async (updated) => {
      await this.prisma.activityLog.create({
        data: {
          tenantId: updated.tenantId,
          entity: "driver",
          action: "update",
          title: `Motorista atualizado: ${updated.fullName}`,
          details: updated.loginEmail ?? undefined
        }
      });
      return updated;
    });
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

    return this.prisma.driver.update({
      where: {
        id: input.id
      },
      data: {
        employmentStatus: "TERMINATED",
        isActive: false
      }
    }).then(async (deleted) => {
      await this.prisma.activityLog.create({
        data: {
          tenantId: deleted.tenantId,
          entity: "driver",
          action: "update",
          title: `Motorista desligado: ${deleted.fullName}`,
          details: deleted.loginEmail ?? undefined
        }
      });
      return deleted;
    });
  }
}
