import { Injectable } from "@nestjs/common";

import { PtBrMessage } from "../../common/messages.js";
import { PrismaService } from "../../common/prisma.service.js";
import { DriversService } from "../drivers/drivers.service.js";
import { CreateDriverInput } from "../drivers/dto/create-driver.input.js";
import { FuelsService } from "../fuels/fuels.service.js";
import { CreateFuelLogInput } from "../fuels/dto/create-fuel-log.input.js";
import { MaintenanceService } from "../maintenance/maintenance.service.js";
import { CreateMaintenanceInput } from "../maintenance/dto/create-maintenance.input.js";
import { VehiclesService } from "../vehicles/vehicles.service.js";
import { CreateVehicleInput } from "../vehicles/dto/create-vehicle.input.js";
import { PushSyncInput } from "./dto/push-sync.input.js";

@Injectable()
export class SyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehiclesService: VehiclesService,
    private readonly driversService: DriversService,
    private readonly fuelsService: FuelsService,
    private readonly maintenanceService: MaintenanceService
  ) {}

  private async applyOperation(input: PushSyncInput, payload: Record<string, unknown>) {
    const key = `${input.entity}:${input.operation}`;

    switch (key) {
      case "vehicle:create":
        return this.vehiclesService.create(payload as unknown as CreateVehicleInput);
      case "driver:create":
        return this.driversService.create(payload as unknown as CreateDriverInput);
      case "fuelLog:create":
        return this.fuelsService.create(payload as unknown as CreateFuelLogInput);
      case "maintenance:create":
        return this.maintenanceService.create(payload as unknown as CreateMaintenanceInput);
      default:
        throw new Error(PtBrMessage.SYNC_ENTITY_NOT_SUPPORTED);
    }
  }

  async pushEvent(input: PushSyncInput) {
    const existing = await this.prisma.syncEvent.findByOperationId(input.operationId);
    if (existing?.status === "SYNCED") {
      return {
        operationId: existing.operationId,
        status: existing.status,
        errorMessage: existing.errorMessage ?? undefined
      };
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(input.payloadJson) as Record<string, unknown>;
    } catch {
      const event = await this.prisma.syncEvent.upsert({
        where: { operationId: input.operationId },
        create: {
          tenantId: input.tenantId,
          deviceId: input.deviceId,
          entity: input.entity,
          operation: input.operation,
          operationId: input.operationId,
          payload: {},
          status: "ERROR",
          errorMessage: "Payload inválido."
        },
        update: {
          status: "ERROR",
          errorMessage: "Payload inválido."
        }
      });
      return {
        operationId: event.operationId,
        status: event.status,
        errorMessage: event.errorMessage ?? undefined
      };
    }

    try {
      await this.applyOperation(input, payload);

      const event = await this.prisma.syncEvent.upsert({
        where: { operationId: input.operationId },
        create: {
          tenantId: input.tenantId,
          deviceId: input.deviceId,
          entity: input.entity,
          operation: input.operation,
          operationId: input.operationId,
          payload,
          status: "SYNCED"
        },
        update: {
          status: "SYNCED",
          errorMessage: null
        }
      });

      return {
        operationId: event.operationId,
        status: event.status,
        errorMessage: event.errorMessage ?? undefined
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Falha ao sincronizar.";
      const event = await this.prisma.syncEvent.upsert({
        where: { operationId: input.operationId },
        create: {
          tenantId: input.tenantId,
          deviceId: input.deviceId,
          entity: input.entity,
          operation: input.operation,
          operationId: input.operationId,
          payload,
          status: "ERROR",
          errorMessage
        },
        update: {
          status: "ERROR",
          errorMessage
        }
      });

      return {
        operationId: event.operationId,
        status: event.status,
        errorMessage: event.errorMessage ?? undefined
      };
    }
  }
}
