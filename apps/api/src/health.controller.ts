import { Controller, Get, Logger, ServiceUnavailableException } from "@nestjs/common";

import { PtBrMessage } from "./common/messages.js";
import { PrismaService } from "./common/prisma.service.js";

@Controller("health")
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

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
      // /health is unauthenticated; never forward the raw Prisma error
      // (can contain the DB host/port) to the caller — log it instead.
      this.logger.error("Health check database probe failed", error instanceof Error ? error.stack : error);
      throw new ServiceUnavailableException({
        status: "error",
        database: "unavailable",
        checkedAt: new Date().toISOString(),
        responseTimeMs: Date.now() - startedAt,
        message: PtBrMessage.DATABASE_UNAVAILABLE
      });
    }
  }
}
