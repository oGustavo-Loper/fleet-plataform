import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";

import { PtBrMessage } from "../../common/messages.js";
import { PrismaService } from "../../common/prisma.service.js";
import { CreateFuelLogInput } from "./dto/create-fuel-log.input.js";

@Injectable()
export class FuelsService {
  constructor(private readonly prisma: PrismaService) {}

  private async enrichLog(
    item: {
      id: string;
      tenantId: string;
      vehicleId: string;
      driverId?: string;
      fueledAt: string;
      odometerKm: number;
      fuelType: string;
      liters: number;
      totalCost: number;
      pricePerLiter: number;
      stationName?: string;
      notes?: string;
      receiptPhotoDataUrl?: string;
      fuelingAddress?: string;
      fuelingLatitude?: number;
      fuelingLongitude?: number;
      previousKm?: number;
      distanceKm: number;
      averageConsumption: number;
    },
    tenantId: string
  ) {
    const [vehicles, drivers] = await Promise.all([
      this.prisma.vehicle.findMany({
        where: { tenantId }
      }),
      this.prisma.driver.findMany({
        where: { tenantId }
      })
    ]);

    const vehicle = vehicles.find((candidate) => candidate.id === item.vehicleId);
    const driver = drivers.find((candidate) => candidate.id === item.driverId);

    return {
      ...item,
      vehicleLabel: vehicle ? `${vehicle.plate} • ${vehicle.model}` : item.vehicleId,
      driverName: driver?.fullName,
      receiptPhotoDataUrl: item.receiptPhotoDataUrl,
      fuelingAddress: item.fuelingAddress,
      fuelingLatitude: item.fuelingLatitude,
      fuelingLongitude: item.fuelingLongitude
    };
  }

  async listByTenant(tenantId: string) {
    const items = await this.prisma.fuelLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" }
    });

    return Promise.all(items.map((item) => this.enrichLog(item, tenantId)));
  }

  async create(input: CreateFuelLogInput) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: {
        id: input.vehicleId
      }
    });

    if (!vehicle) {
      throw new BadRequestException(PtBrMessage.VEHICLE_NOT_FOUND);
    }

    if (vehicle.tenantId !== input.tenantId) {
      throw new ForbiddenException(PtBrMessage.VEHICLE_ACCESS_DENIED);
    }

    if (input.odometerKm <= Number(vehicle.currentKm)) {
      throw new BadRequestException(PtBrMessage.ODOMETER_MUST_BE_GREATER_THAN_CURRENT_VEHICLE);
    }

    if (input.liters <= 0) {
      throw new BadRequestException(PtBrMessage.LITERS_MUST_BE_GREATER_THAN_ZERO);
    }

    const previousKm = Number(vehicle.currentKm);
    const distanceKm = input.odometerKm - previousKm;
    const averageConsumption = Number((distanceKm / input.liters).toFixed(2));

    if (input.driverId) {
      const driverUser = await this.prisma.user.findMany({
        where: {
          tenantId: input.tenantId,
          driverId: input.driverId
        }
      });
      const assignedVehicleIds =
        (driverUser[0]?.assignedVehicleIds as string[] | undefined) ?? [];
      const allowAnyVehicle = Boolean(driverUser[0]?.allowAnyVehicle);

      if (!allowAnyVehicle && assignedVehicleIds.length > 0 && !assignedVehicleIds.includes(input.vehicleId)) {
        throw new BadRequestException(PtBrMessage.DRIVER_RESTRICTED_TO_ASSIGNED_VEHICLE);
      }
    }

    const created = await this.prisma.fuelLog.create({
      data: {
        tenantId: input.tenantId,
        vehicleId: input.vehicleId,
        driverId: input.driverId,
        fueledAt: input.fueledAt,
        odometerKm: input.odometerKm,
        fuelType: input.fuelType,
        liters: input.liters,
        totalCost: input.totalCost,
        pricePerLiter: input.pricePerLiter,
        stationName: input.stationName,
        notes: input.notes,
        receiptPhotoDataUrl: input.receiptPhotoDataUrl,
        fuelingAddress: input.fuelingAddress,
        fuelingLatitude: input.fuelingLatitude,
        fuelingLongitude: input.fuelingLongitude,
        previousKm,
        distanceKm,
        averageConsumption
      }
    });

    await this.prisma.vehicle.update({
      where: {
        id: input.vehicleId
      },
      data: {
        currentKm: input.odometerKm
      }
    });

    await this.prisma.activityLog.create({
      data: {
        tenantId: input.tenantId,
        entity: "fuel",
        action: "create",
        title: `Abastecimento registrado: ${vehicle.plate}`,
        details: `${vehicle.brand} ${vehicle.model} | R$ ${Number(input.totalCost).toFixed(2)}${input.fuelingAddress ? ` | ${input.fuelingAddress}` : ""}`
      }
    });

    await this.prisma.alert.create({
      data: {
        tenantId: input.tenantId,
        title: `Novo abastecimento em ${vehicle.plate} • ${vehicle.model}`,
        severity: "info"
      }
    });

    return this.enrichLog(created, input.tenantId);
  }
}
