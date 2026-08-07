import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";

import type { AuthenticatedUser } from "../../common/auth-user.js";
import { PtBrMessage } from "../../common/messages.js";
import { PrismaService } from "../../common/prisma.service.js";
import { getVisibleVehicleIds } from "../../common/vehicle-visibility.js";
import { CreateFuelLogInput } from "./dto/create-fuel-log.input.js";

@Injectable()
export class FuelsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildEnrichedLog(
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
    vehicle?: { plate: string; model: string },
    driver?: { fullName: string }
  ) {
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

  async listByTenant(tenantId: string, user?: AuthenticatedUser) {
    const items = await this.prisma.fuelLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" }
    });

    const visibleItems = user
      ? items.filter((item) =>
          getVisibleVehicleIds(user, [item.vehicleId]).includes(item.vehicleId)
        )
      : items;

    // Fetched once for the whole page instead of per fuel log — this used
    // to be a 2N-query N+1 (full vehicle + driver table scan per item).
    const [vehicles, drivers] = await Promise.all([
      this.prisma.vehicle.findMany({ where: { tenantId } }),
      this.prisma.driver.findMany({ where: { tenantId } })
    ]);
    const vehicleById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
    const driverById = new Map(drivers.map((driver) => [driver.id, driver]));

    return visibleItems.map((item) =>
      this.buildEnrichedLog(item, vehicleById.get(item.vehicleId), driverById.get(item.driverId ?? ""))
    );
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

    const driver = input.driverId
      ? await this.prisma.driver.findUnique({ where: { id: input.driverId } })
      : undefined;

    return this.buildEnrichedLog(created, vehicle, driver ?? undefined);
  }
}
