import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service.js";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async listNotifications(tenantId: string) {
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

  async getSummary(tenantId: string) {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const [vehicles, syncPending, alerts, maintenances, fuelLogs, drivers, activities] =
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

    const driverAlerts = drivers.flatMap((driver) => {
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

    const mergedAlerts = [...generatedAlerts, ...driverAlerts, ...kmAlerts, ...alerts.map((alert) => ({
      id: alert.id,
      title: alert.title,
      severity: alert.severity
    }))].slice(0, 6);

    return {
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter((vehicle) => vehicle.status === "ACTIVE").length,
      maintenanceVehicles: vehicles.filter((vehicle) => vehicle.status === "MAINTENANCE").length,
      monthlyCost: Number((monthlyFuelCost + monthlyMaintenanceCost).toFixed(2)),
      averageConsumption,
      pendingSyncItems: syncPending,
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
      recentActivity: activities.map((item: {
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
