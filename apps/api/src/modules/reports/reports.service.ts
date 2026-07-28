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

function inRange(date: Date, range: ReportRange) {
  const fromDate = parseDate(range.from);
  const toDate = parseDate(range.to);
  if (fromDate && date.getTime() < fromDate.getTime()) {
    return false;
  }
  if (toDate && date.getTime() > toDate.getTime()) {
    return false;
  }
  return true;
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

    const [fuelLogsRaw, maintenanceLogsRaw, vehicles, drivers] = await Promise.all([
      this.prisma.fuelLog.findMany({ where: { tenantId } }),
      this.prisma.maintenanceLog.findMany({ where: { tenantId } }),
      this.prisma.vehicle.findMany({ where: { tenantId } }),
      this.prisma.driver.findMany({ where: { tenantId } })
    ]);

    const fuelLogs = fuelLogsRaw
      .filter((item) => item.vehicleId === vehicleId && inRange(new Date(item.fueledAt), range))
      .sort((left, right) => new Date(right.fueledAt).getTime() - new Date(left.fueledAt).getTime())
      .map((item) => {
        const vehicleInfo = vehicles.find((candidate) => candidate.id === item.vehicleId);
        const driverInfo = drivers.find((candidate) => candidate.id === item.driverId);

        return {
          ...item,
          vehicleLabel: vehicleInfo ? `${vehicleInfo.plate} • ${vehicleInfo.model}` : item.vehicleId,
          driverName: driverInfo?.fullName
        };
      });

    const maintenanceLogs = maintenanceLogsRaw
      .filter(
        (item) => item.vehicleId === vehicleId && inRange(new Date(item.performedAt), range)
      )
      .sort((left, right) => right.performedAt.getTime() - left.performedAt.getTime())
      .map((item) => {
        const vehicleInfo = vehicles.find((candidate) => candidate.id === item.vehicleId);

        return {
          ...item,
          vehicleLabel: vehicleInfo ? `${vehicleInfo.plate} • ${vehicleInfo.model}` : item.vehicleId
        };
      });

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
