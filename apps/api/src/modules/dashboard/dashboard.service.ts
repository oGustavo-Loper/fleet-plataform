import { Injectable } from "@nestjs/common";

import type { AuthenticatedUser } from "../../common/auth-user.js";
import { PrismaService } from "../../common/prisma.service.js";
import { getVisibleVehicleIds } from "../../common/vehicle-visibility.js";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async listNotifications(tenantId: string, user: AuthenticatedUser) {
    // The alerts table has no vehicle/driver column, so there is no safe way
    // to scope it to a single driver — hide it rather than risk leaking
    // another driver's activity.
    if (user.role === "DRIVER") {
      return [];
    }

    const alerts = await this.prisma.alert.findMany({
      where: { tenantId },
      take: 15,
      orderBy: { createdAt: "desc" }
    });

    return alerts.map((item) => ({
      id: item.id,
      title: item.title,
      severity: item.severity,
      createdAt: item.createdAt.toISOString()
    }));
  }

  async getSummary(tenantId: string, user: AuthenticatedUser) {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const isDriver = user.role === "DRIVER";
    const [allVehicles, syncPending, alerts, allMaintenances, allFuelLogs, drivers, activities] =
      await Promise.all([
      this.prisma.vehicle.findMany({
        where: { tenantId },
        select: { id: true, plate: true, model: true, status: true, currentKm: true }
      }),
      this.prisma.syncEvent.count({
        where: { tenantId, status: { in: ["PENDING", "PROCESSING"] } }
      }),
      this.prisma.alert.findMany({
        where: { tenantId },
        take: 5,
        orderBy: [{ severity: "desc" }, { createdAt: "desc" }]
      }),
      this.prisma.maintenanceLog.findMany({
        where: { tenantId },
        orderBy: { performedAt: "desc" },
        include: { vehicle: true }
      }),
      this.prisma.fuelLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.driver.findMany({
        where: { tenantId }
      }),
      this.prisma.activityLog.findMany({
        where: { tenantId },
        take: 6
      })
    ]);

    const visibleVehicleIds = new Set(
      getVisibleVehicleIds(user, allVehicles.map((vehicle) => vehicle.id))
    );
    const vehicles = allVehicles.filter((vehicle) => visibleVehicleIds.has(vehicle.id));
    const maintenances = allMaintenances.filter((item) => visibleVehicleIds.has(item.vehicleId));
    const fuelLogs = allFuelLogs.filter((item) => visibleVehicleIds.has(item.vehicleId));

    const generatedAlerts = maintenances.flatMap((item) => {
      const vehicle = item.vehicle as { plate: string; model: string };
      const rows: Array<{ id: string; title: string; severity: string }> = [];
      const dueDate = item.nextMaintenanceAt as Date | undefined;
      const dueKm = item.nextMaintenanceKm ?? undefined;
      const currentVehicle = vehicles.find((candidate) => candidate.id === item.vehicleId);
      const currentKm = Number(currentVehicle?.currentKm ?? 0);

      if (dueDate) {
        const daysUntilDue = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilDue < 0) {
          rows.push({
            id: `${item.id}-date-overdue`,
            title: `Manutenção vencida por data em ${vehicle.plate} • ${vehicle.model}`,
            severity: "critical"
          });
        } else if (daysUntilDue <= 15) {
          rows.push({
            id: `${item.id}-date-soon`,
            title: `Manutenção próxima por data em ${vehicle.plate} • ${vehicle.model}`,
            severity: "warning"
          });
        }
      }

      if (dueKm !== undefined) {
        const remainingKm = dueKm - currentKm;

        if (remainingKm < 0) {
          rows.push({
            id: `${item.id}-km-overdue`,
            title: `Manutenção vencida por KM em ${vehicle.plate} • ${vehicle.model}`,
            severity: "critical"
          });
        } else if (remainingKm <= 1000) {
          rows.push({
            id: `${item.id}-km-soon`,
            title: `Manutenção próxima por KM em ${vehicle.plate} • ${vehicle.model}`,
            severity: "warning"
          });
        }
      }

      return rows;
    });

    const visibleDrivers = isDriver
      ? drivers.filter((driver) => driver.id === user.driverId)
      : drivers;

    const driverAlerts = visibleDrivers.flatMap((driver) => {
      const rows: Array<{ id: string; title: string; severity: string }> = [];
      const expiresAt = new Date(driver.cnhExpiresAt);
      const daysUntilDue = Math.ceil(
        (expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilDue < 0) {
        rows.push({
          id: `${driver.id}-cnh-overdue`,
          title: `CNH vencida de ${driver.fullName}`,
          severity: "critical"
        });
      } else if (daysUntilDue <= 30) {
        rows.push({
          id: `${driver.id}-cnh-soon`,
          title: `CNH perto do vencimento de ${driver.fullName}`,
          severity: "warning"
        });
      }

      return rows;
    });

    const kmAlerts = vehicles.flatMap((vehicle) => {
      const lastFuel = fuelLogs
        .filter((item) => item.vehicleId === vehicle.id)
        .sort((left, right) => new Date(right.fueledAt).getTime() - new Date(left.fueledAt).getTime())[0];
      const lastMaintenance = maintenances
        .filter((item) => item.vehicleId === vehicle.id)
        .sort((left, right) => right.performedAt.getTime() - left.performedAt.getTime())[0];
      const maxRecordedKm = Math.max(
        Number(lastFuel?.odometerKm ?? 0),
        Number(lastMaintenance?.odometerKm ?? 0)
      );

      if (maxRecordedKm > 0 && Number(vehicle.currentKm ?? 0) < maxRecordedKm) {
        return [
          {
            id: `${vehicle.id}-km-inconsistent`,
            title: `KM inconsistente em ${vehicle.plate} • ${vehicle.model}`,
            severity: "critical"
          }
        ];
      }

      return [];
    });

    const fuelLogsCurrentMonth = fuelLogs.filter(
      (item) => new Date(item.fueledAt).getTime() >= monthStart.getTime()
    );
    const maintenancesCurrentMonth = maintenances.filter(
      (item) => item.performedAt.getTime() >= monthStart.getTime()
    );
    const monthlyFuelCost = fuelLogsCurrentMonth.reduce(
      (total, item) => total + Number(item.totalCost),
      0
    );
    const monthlyMaintenanceCost = maintenancesCurrentMonth.reduce(
      (total, item) => total + Number(item.totalCost),
      0
    );
    const totalDistanceKm = fuelLogsCurrentMonth.reduce(
      (total, item) => total + Number(item.distanceKm ?? 0),
      0
    );
    const totalLiters = fuelLogsCurrentMonth.reduce(
      (total, item) => total + Number(item.liters ?? 0),
      0
    );
    const averageConsumption =
      totalDistanceKm > 0 && totalLiters > 0 ? Number((totalDistanceKm / totalLiters).toFixed(2)) : 0;

    const costByDate = new Map<string, number>();
    for (const item of fuelLogsCurrentMonth) {
      const day = new Date(item.fueledAt).toISOString().slice(0, 10);
      costByDate.set(day, (costByDate.get(day) ?? 0) + Number(item.totalCost));
    }
    for (const item of maintenancesCurrentMonth) {
      const day = item.performedAt.toISOString().slice(0, 10);
      costByDate.set(day, (costByDate.get(day) ?? 0) + Number(item.totalCost));
    }
    const costTrend = Array.from(costByDate.entries())
      .map(([date, cost]) => ({ date, cost: Number(cost.toFixed(2)) }))
      .sort((left, right) => left.date.localeCompare(right.date));

    // The alerts table and the activity log aren't attributable to a single
    // vehicle or driver, so a driver only sees the alerts we can actually
    // compute as theirs (maintenance/CNH/km, already scoped above).
    const mergedAlerts = [
      ...generatedAlerts,
      ...driverAlerts,
      ...kmAlerts,
      ...(isDriver
        ? []
        : alerts.map((alert) => ({
            id: alert.id,
            title: alert.title,
            severity: alert.severity
          })))
    ].slice(0, 6);

    return {
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter((vehicle) => vehicle.status === "ACTIVE").length,
      maintenanceVehicles: vehicles.filter((vehicle) => vehicle.status === "MAINTENANCE").length,
      monthlyCost: Number((monthlyFuelCost + monthlyMaintenanceCost).toFixed(2)),
      averageConsumption,
      pendingSyncItems: syncPending,
      costTrend,
      upcomingMaintenance: maintenances
        .filter((item) => item.nextMaintenanceAt || item.nextMaintenanceKm)
        .map((item) => ({
          id: item.id,
          vehicleLabel: `${(item.vehicle as { plate: string }).plate} • ${(item.vehicle as { model: string }).model}`,
          dueDate: item.nextMaintenanceAt
            ? (item.nextMaintenanceAt as Date).toISOString()
          : undefined,
          dueKm: item.nextMaintenanceKm ?? undefined
        })),
      alerts: mergedAlerts,
      recentActivity: isDriver
        ? []
        : activities.map((item: {
            id: string;
            entity: string;
            action: string;
            title: string;
            createdAt: Date;
          }) => ({
            id: item.id,
            entity: item.entity,
            action: item.action,
            title: item.title,
            createdAt: item.createdAt.toISOString()
          }))
    };
  }
}
