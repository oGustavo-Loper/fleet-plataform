import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";

import { PtBrMessage } from "./common/messages.js";
import { PrismaService } from "./common/prisma.service.js";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth() {
    const startedAt = Date.now();

    try {
      await this.prisma.tenant.findMany({
        take: 1
      });

      return {
        status: "ok",
        database: "ok",
        checkedAt: new Date().toISOString(),
        responseTimeMs: Date.now() - startedAt
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        status: "error",
        database: "unavailable",
        checkedAt: new Date().toISOString(),
        responseTimeMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : PtBrMessage.DATABASE_UNAVAILABLE
      });
    }
  }
}
