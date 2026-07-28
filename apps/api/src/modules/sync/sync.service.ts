import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service.js";
import { PushSyncInput } from "./dto/push-sync.input.js";

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async pushEvent(input: PushSyncInput) {
    const event = await this.prisma.syncEvent.upsert({
      where: { operationId: input.operationId },
      update: {
        status: "SYNCED",
        errorMessage: null
      },
      create: {
        tenantId: input.tenantId,
        deviceId: input.deviceId,
        entity: input.entity,
        operation: input.operation,
        operationId: input.operationId,
        payload: JSON.parse(input.payloadJson),
        status: "SYNCED"
      }
    });

    return {
      operationId: event.operationId,
      status: event.status,
      errorMessage: event.errorMessage ?? undefined
    };
  }
}
