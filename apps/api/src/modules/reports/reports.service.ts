import { BadRequestException, Injectable } from "@nestjs/common";

import { PtBrMessage } from "../../common/messages.js";
import { PrismaService } from "../../common/prisma.service.js";

type ReportRange = {
  from?: string;
  to?: string;
};

function parseDate(value?: string) {
  return value ? new Date(value) : null;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async vehicleReport(tenantId: string, vehicleId: string, range: ReportRange) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle || vehicle.tenantId !== tenantId) {
      throw new BadRequestException(PtBrMessage.VEHICLE_NOT_FOUND_FOR_ACCOUNT);
    }

    const fromDate = parseDate(range.from);
    const toDate = parseDate(range.to);
    const dateFilter = fromDate || toDate ? { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) } : undefined;

    // Filtered by vehicleId + date range at the DB level (both fields are
    // indexed as [tenantId, vehicleId, <date>]) instead of pulling every
    // fuel/maintenance log for the whole tenant and filtering in JS.
    const [fuelLogsRaw, maintenanceLogsRaw] = await Promise.all([
      this.prisma.fuelLog.findMany({
        where: { tenantId, vehicleId, ...(dateFilter ? { fueledAt: dateFilter } : {}) },
        orderBy: { fueledAt: "desc" }
      }),
      this.prisma.maintenanceLog.findMany({
        where: { tenantId, vehicleId, ...(dateFilter ? { performedAt: dateFilter } : {}) },
        orderBy: { performedAt: "desc" }
      })
    ]);

    const driverIds = [...new Set(fuelLogsRaw.map((item) => item.driverId).filter((id): id is string => Boolean(id)))];
    const drivers = driverIds.length
      ? await this.prisma.driver.findMany({ where: { id: { in: driverIds } } })
      : [];
    const driverById = new Map(drivers.map((driver) => [driver.id, driver]));

    const vehicleLabel = `${vehicle.plate} • ${vehicle.model}`;

    const fuelLogs = fuelLogsRaw.map((item) => ({
      ...item,
      vehicleLabel,
      driverName: item.driverId ? driverById.get(item.driverId)?.fullName : undefined
    }));

    const maintenanceLogs = maintenanceLogsRaw.map((item) => ({
      ...item,
      vehicleLabel
    }));

    const totalFuelCost = fuelLogs.reduce((total, item) => total + Number(item.totalCost), 0);
    const totalMaintenanceCost = maintenanceLogs.reduce(
      (total, item) => total + Number(item.totalCost),
      0
    );
    const totalDistanceKm = fuelLogs.reduce((total, item) => total + Number(item.distanceKm ?? 0), 0);
    const totalLiters = fuelLogs.reduce((total, item) => total + Number(item.liters ?? 0), 0);
    const averageConsumption =
      totalDistanceKm > 0 && totalLiters > 0 ? Number((totalDistanceKm / totalLiters).toFixed(2)) : 0;

    return {
      vehicle,
      period: {
        from: range.from,
        to: range.to
      },
      summary: {
        fuelCount: fuelLogs.length,
        maintenanceCount: maintenanceLogs.length,
        totalLiters,
        totalDistanceKm,
        totalFuelCost: Number(totalFuelCost.toFixed(2)),
        totalMaintenanceCost: Number(totalMaintenanceCost.toFixed(2)),
        totalCost: Number((totalFuelCost + totalMaintenanceCost).toFixed(2)),
        averageConsumption
      },
      fuelLogs,
      maintenanceLogs
    };
  }
}
