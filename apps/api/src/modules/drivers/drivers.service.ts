import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";

import type { AuthenticatedUser } from "../../common/auth-user.js";
import { PtBrMessage } from "../../common/messages.js";
import { PrismaService } from "../../common/prisma.service.js";
import { MailService } from "../auth/mail.service.js";
import { MediaService } from "../media/media.service.js";
import { CreateDriverInput } from "./dto/create-driver.input.js";
import { DeleteDriverInput } from "./dto/delete-driver.input.js";
import { UpdateDriverInput } from "./dto/update-driver.input.js";

type DriverAccountInfo = {
  accountRole?: string;
  hasCompletedFirstLogin: boolean;
};

const ANONYMIZED_DRIVER_NAME = "Motorista removido";

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly mediaService: MediaService
  ) {}

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

  private assertValidCnh(cnh?: string) {
    if (cnh && cnh.replace(/\D/g, "").length !== 11) {
      throw new BadRequestException(PtBrMessage.CNH_INVALID);
    }
  }

  private async assertDriverPlanLimit(tenantId: string) {
    const FREE_TIER_DRIVER_LIMIT = 2;

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const isFreeTier =
      tenant?.planCode === "ESSENTIAL_FREE" ||
      (tenant?.accountType === "COMPANY" && tenant?.planStatus !== "ACTIVE");

    if (!isFreeTier) {
      return;
    }

    const activeDriverCount = await this.prisma.driver.count({
      where: { tenantId, employmentStatus: { not: "TERMINATED" } }
    });

    if (activeDriverCount >= FREE_TIER_DRIVER_LIMIT) {
      throw new BadRequestException(PtBrMessage.DRIVER_PLAN_LIMIT_REACHED);
    }
  }

  private async deliverTemporaryPassword<
    T extends { loginEmail?: string; fullName: string; temporaryPassword?: string }
  >(driver: T): Promise<T & { credentialsEmailSent?: boolean }> {
    if (!driver.temporaryPassword || !driver.loginEmail) {
      return driver;
    }

    try {
      const delivery = await this.mailService.sendDriverCredentials(
        driver.loginEmail,
        driver.temporaryPassword,
        driver.fullName
      );

      if (delivery.deliveryMode !== "console") {
        return { ...driver, temporaryPassword: undefined, credentialsEmailSent: true };
      }
    } catch {
      // The driver (and its login) were already committed before this call —
      // a mail provider failure must not surface as if creation itself failed.
      // Fall back to showing the password on screen, same as the "not configured" case.
    }

    return { ...driver, credentialsEmailSent: false };
  }

  async listByTenant(tenantId: string, user?: AuthenticatedUser) {
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

    const visibleDrivers =
      user?.role === "DRIVER" ? drivers.filter((driver) => driver.id === user.driverId) : drivers;

    return visibleDrivers.map((driver) => ({
      ...driver,
      ...this.accountInfoFromUser(userByDriverId.get(driver.id) ?? null)
    }));
  }

  async create(input: CreateDriverInput) {
    this.assertValidCnh(input.cnh);
    await this.assertDriverPlanLimit(input.tenantId);
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

    const deliveredCreated = await this.deliverTemporaryPassword(created);
    const linkedUser = await this.findLinkedUser(created.id);
    return { ...deliveredCreated, ...this.accountInfoFromUser(linkedUser) };
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

    // Termination already anonymized this driver's name/CPF/CNH/login (see
    // delete() below) — there's nothing left to edit, and "reactivating"
    // would just flip employmentStatus back on top of wiped personal data.
    if (currentDriver.employmentStatus === "TERMINATED") {
      throw new BadRequestException(PtBrMessage.DRIVER_TERMINATED_CANNOT_BE_UPDATED);
    }

    this.assertValidCnh(input.cnh);

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

    const deliveredUpdated = await this.deliverTemporaryPassword(updated);
    const linkedUser = await this.findLinkedUser(updated.id);
    return { ...deliveredUpdated, ...this.accountInfoFromUser(linkedUser) };
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
        fullName: ANONYMIZED_DRIVER_NAME,
        cpf: null,
        cnh: null,
        cnhCategory: null,
        cnhExpiresAt: null,
        photoDataUrl: null,
        loginEmail: null,
        employmentStatus: "TERMINATED",
        isActive: false,
        // Free up the vehicle(s) this driver was tied to instead of leaving
        // them permanently "assigned" to a terminated, anonymized record.
        assignedVehicleIds: [],
        allowAnyVehicle: false
      }
    });

    // Nulling loginEmail above stops driver.update's own sync from touching
    // the linked login, since it has nothing left to sync — anonymize that
    // row explicitly here instead, or its name/e-mail would survive intact.
    if (currentDriver.loginEmail) {
      const linkedAccount = await this.findLinkedUser(input.id);
      if (linkedAccount) {
        await this.prisma.user.update({
          where: { id: linkedAccount.id },
          data: {
            fullName: ANONYMIZED_DRIVER_NAME,
            email: `motorista-removido-${input.id}@anonimizado.fleet.local`,
            photoDataUrl: null,
            isActive: false
          }
        });
      }
    }

    await this.mediaService.deleteFileByPublicPath(currentDriver.photoDataUrl);

    await this.prisma.activityLog.create({
      data: {
        tenantId: deleted.tenantId,
        entity: "driver",
        action: "update",
        title: currentDriver.registrationId
          ? `Motorista desligado (matrícula ${currentDriver.registrationId})`
          : "Motorista desligado"
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
