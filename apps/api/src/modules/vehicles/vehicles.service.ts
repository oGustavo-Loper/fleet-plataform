import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";

import { PtBrMessage } from "../../common/messages.js";
import { PrismaService } from "../../common/prisma.service.js";
import { CreateVehicleInput } from "./dto/create-vehicle.input.js";
import { UpdateVehicleInput } from "./dto/update-vehicle.input.js";

function normalizePlate(value: string) {
  const clean = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
  if (clean.length <= 3) {
    return clean;
  }
  return `${clean.slice(0, 3)} ${clean.slice(3)}`;
}

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  listByTenant(tenantId: string) {
    return this.prisma.vehicle.findMany({
      where: { tenantId },
      orderBy: { updatedAt: "desc" }
    });
  }

  async create(input: CreateVehicleInput) {
    const normalizedPlate = normalizePlate(input.plate);
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: input.tenantId
      }
    });

    const tenantVehicleCount = (
      await this.prisma.vehicle.findMany({
        where: {
          tenantId: input.tenantId
        }
      })
    ).length;

    const companyTrialLimit =
      tenant?.accountType === "COMPANY" && tenant?.planStatus !== "ACTIVE" ? 3 : undefined;
    const vehicleLimit = tenant?.vehicleLimit ?? companyTrialLimit;

    if (
      vehicleLimit !== undefined &&
      vehicleLimit !== null &&
      tenantVehicleCount >= Number(vehicleLimit)
    ) {
      throw new BadRequestException(PtBrMessage.PLAN_LIMIT_REACHED);
    }

    const ownerName = input.ownerName?.trim() || tenant?.name || PtBrMessage.NOT_INFORMED;

    return this.prisma.vehicle.create({
      data: {
        tenantId: input.tenantId,
        plate: normalizedPlate,
        vehicleType: input.vehicleType,
        model: input.model,
        brand: input.brand,
        year: input.year,
        fuelType: input.fuelType,
        currentKm: input.currentKm,
        ownerName,
        companyName: input.companyName,
        status: input.status
      }
    }).then(async (created) => {
      await this.prisma.activityLog.create({
        data: {
          tenantId: input.tenantId,
          entity: "vehicle",
          action: "create",
          title: `Veículo cadastrado: ${created.plate}`,
          details: `${created.brand} ${created.model}`
        }
      });
      return created;
    });
  }

  async update(input: UpdateVehicleInput, actorTenantId?: string) {
    const normalizedPlate = normalizePlate(input.plate);
    const currentVehicle = await this.prisma.vehicle.findUnique({
      where: {
        id: input.id
      }
    });

    if (!currentVehicle) {
      throw new BadRequestException(PtBrMessage.VEHICLE_NOT_FOUND);
    }

    if (actorTenantId && currentVehicle.tenantId !== actorTenantId) {
      throw new ForbiddenException(PtBrMessage.VEHICLE_ACCESS_DENIED);
    }

    const tenant = currentVehicle
      ? await this.prisma.tenant.findUnique({
          where: {
            id: currentVehicle.tenantId
          }
        })
      : null;

    const ownerName =
      input.ownerName?.trim() || tenant?.name || currentVehicle?.ownerName || PtBrMessage.NOT_INFORMED;

    return this.prisma.vehicle.update({
      where: {
        id: input.id
      },
      data: {
        plate: normalizedPlate,
        vehicleType: input.vehicleType,
        model: input.model,
        brand: input.brand,
        year: input.year,
        fuelType: input.fuelType,
        currentKm: input.currentKm,
        ownerName,
        companyName: input.companyName,
        status: input.status
      }
    }).then(async (updated) => {
      await this.prisma.activityLog.create({
        data: {
          tenantId: updated.tenantId,
          entity: "vehicle",
          action: "update",
          title: `Veículo atualizado: ${updated.plate}`,
          details: `${updated.brand} ${updated.model}`
        }
      });
      return updated;
    });
  }
}
