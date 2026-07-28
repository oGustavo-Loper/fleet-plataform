import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";

import { PtBrMessage } from "../../common/messages.js";
import { PrismaService } from "../../common/prisma.service.js";
import { CreateMaintenanceInput } from "./dto/create-maintenance.input.js";

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async listByTenant(tenantId: string) {
    const items = await this.prisma.maintenanceLog.findMany({
      where: { tenantId },
      orderBy: { performedAt: "desc" },
      take: 50
    });

    return items.map((item) => ({
      id: item.id,
      tenantId: item.tenantId,
      vehicleId: item.vehicleId,
      vehicleLabel: `${item.vehicle.plate} • ${item.vehicle.model}`,
      title: item.title,
      maintenanceType: item.maintenanceType,
      performedAt: item.performedAt.toISOString().slice(0, 10),
      odometerKm: item.odometerKm,
      totalCost: item.totalCost,
      supplierName: item.supplierName,
      notes: item.notes,
      nextMaintenanceAt: item.nextMaintenanceAt?.toISOString().slice(0, 10),
      nextMaintenanceKm: item.nextMaintenanceKm,
      oilType: item.oilType,
      oilBrand: item.oilBrand,
      oilCost: item.oilCost,
      previousOilChangeAt: item.previousOilChangeAt,
      previousOilChangeKm: item.previousOilChangeKm,
      previousOilChangeNotes: item.previousOilChangeNotes,
      changedOilFilter: item.changedOilFilter,
      changedAirFilter: item.changedAirFilter,
      changedFuelFilter: item.changedFuelFilter,
      tireBrand: item.tireBrand,
      tireQuantity: item.tireQuantity,
      tireUnitCost: item.tireUnitCost,
      batteryBrand: item.batteryBrand,
      batteryCost: item.batteryCost,
      batteryVoltage: item.batteryVoltage,
      brakeService: item.brakeService,
      beltChanged: item.beltChanged,
      partName: item.partName,
      partBrand: item.partBrand,
      partCost: item.partCost
    }));
  }

  async create(input: CreateMaintenanceInput) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: input.vehicleId }
    });

    if (!vehicle) {
      throw new BadRequestException(PtBrMessage.VEHICLE_NOT_FOUND);
    }

    if (vehicle.tenantId !== input.tenantId) {
      throw new ForbiddenException(PtBrMessage.VEHICLE_ACCESS_DENIED);
    }

    if (input.odometerKm <= Number(vehicle.currentKm)) {
      throw new BadRequestException(PtBrMessage.ODOMETER_MUST_BE_GREATER_THAN_CURRENT_MAINTENANCE);
    }

    const created = await this.prisma.maintenanceLog.create({
      data: {
        tenantId: input.tenantId,
        vehicleId: input.vehicleId,
        title: input.title,
        maintenanceType: input.maintenanceType,
        performedAt: input.performedAt,
        odometerKm: input.odometerKm,
        totalCost: input.totalCost,
        supplierName: input.supplierName,
        notes: input.notes,
        nextMaintenanceAt: input.nextMaintenanceAt,
        nextMaintenanceKm: input.nextMaintenanceKm,
        oilType: input.oilType,
        oilBrand: input.oilBrand,
        oilCost: input.oilCost,
        previousOilChangeAt: input.previousOilChangeAt,
        previousOilChangeKm: input.previousOilChangeKm,
        previousOilChangeNotes: input.previousOilChangeNotes,
        changedOilFilter: input.changedOilFilter,
        changedAirFilter: input.changedAirFilter,
        changedFuelFilter: input.changedFuelFilter,
        tireBrand: input.tireBrand,
        tireQuantity: input.tireQuantity,
        tireUnitCost: input.tireUnitCost,
        batteryBrand: input.batteryBrand,
        batteryCost: input.batteryCost,
        batteryVoltage: input.batteryVoltage,
        brakeService: input.brakeService,
        beltChanged: input.beltChanged,
        partName: input.partName,
        partBrand: input.partBrand,
        partCost: input.partCost
      }
    });

    await this.prisma.vehicle.update({
      where: { id: input.vehicleId },
      data: { currentKm: input.odometerKm }
    });

    await this.prisma.activityLog.create({
      data: {
        tenantId: input.tenantId,
        entity: "maintenance",
        action: "create",
        title: `Manutenção registrada: ${created.vehicle.plate}`,
        details: created.title
      }
    });

    return {
      id: created.id,
      tenantId: created.tenantId,
      vehicleId: created.vehicleId,
      vehicleLabel: `${created.vehicle.plate} • ${created.vehicle.model}`,
      title: created.title,
      maintenanceType: created.maintenanceType,
      performedAt: created.performedAt.toISOString().slice(0, 10),
      odometerKm: created.odometerKm,
      totalCost: created.totalCost,
      supplierName: created.supplierName,
      notes: created.notes,
      nextMaintenanceAt: created.nextMaintenanceAt?.toISOString().slice(0, 10),
      nextMaintenanceKm: created.nextMaintenanceKm,
      oilType: created.oilType,
      oilBrand: created.oilBrand,
      oilCost: created.oilCost,
      previousOilChangeAt: created.previousOilChangeAt,
      previousOilChangeKm: created.previousOilChangeKm,
      previousOilChangeNotes: created.previousOilChangeNotes,
      changedOilFilter: created.changedOilFilter,
      changedAirFilter: created.changedAirFilter,
      changedFuelFilter: created.changedFuelFilter,
      tireBrand: created.tireBrand,
      tireQuantity: created.tireQuantity,
      tireUnitCost: created.tireUnitCost,
      batteryBrand: created.batteryBrand,
      batteryCost: created.batteryCost,
      batteryVoltage: created.batteryVoltage,
      brakeService: created.brakeService,
      beltChanged: created.beltChanged,
      partName: created.partName,
      partBrand: created.partBrand,
      partCost: created.partCost
    };
  }
}
