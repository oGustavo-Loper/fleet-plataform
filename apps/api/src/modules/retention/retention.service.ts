import { Injectable, Logger, OnModuleInit } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service.js";
import { DriversService } from "../drivers/drivers.service.js";
import { MediaService } from "../media/media.service.js";

const DEFAULT_INACTIVE_DAYS = 730;
const DAY_MS = 24 * 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = DAY_MS;
const STARTUP_DELAY_MS = 60 * 1000;

const RETENTION_ANONYMIZED_NAME = "Conta desativada por inatividade";

function resolveInactiveDays() {
  const raw = Number(process.env.RETENTION_INACTIVE_DAYS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_INACTIVE_DAYS;
}

/**
 * LGPD data-minimization sweep: tenants nobody has logged into for
 * RETENTION_INACTIVE_DAYS (default 730 = ~24 months) get their personal
 * data anonymized automatically, mirroring what already happens on
 * explicit driver termination / account deletion — this just closes the
 * gap for accounts nobody ever explicitly closed.
 */
@Injectable()
export class RetentionService implements OnModuleInit {
  private readonly logger = new Logger(RetentionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly driversService: DriversService,
    private readonly mediaService: MediaService
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === "test") {
      return;
    }

    setTimeout(() => void this.purgeInactiveTenants(), STARTUP_DELAY_MS).unref?.();
    setInterval(() => void this.purgeInactiveTenants(), SWEEP_INTERVAL_MS).unref?.();
  }

  async purgeInactiveTenants(): Promise<string[]> {
    const cutoff = new Date(Date.now() - resolveInactiveDays() * DAY_MS);
    const tenantIds = await this.prisma.retention.findInactiveTenantIds(cutoff);

    for (const tenantId of tenantIds) {
      try {
        await this.purgeTenant(tenantId);
      } catch (error) {
        const stack = error instanceof Error ? error.stack : String(error);
        this.logger.error(`Falha ao expurgar dados por retenção do tenant ${tenantId}`, stack);
      }
    }

    return tenantIds;
  }

  private async purgeTenant(tenantId: string) {
    const [tenant, drivers, users] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: tenantId } }),
      this.prisma.driver.findMany({ where: { tenantId } }),
      this.prisma.user.findMany({ where: { tenantId } })
    ]);

    for (const driver of drivers) {
      if (driver.employmentStatus !== "TERMINATED") {
        await this.driversService.delete({ id: driver.id });
      }
    }

    for (const user of users.filter((record) => !record.driverId)) {
      await this.mediaService.deleteFileByPublicPath(user.photoDataUrl);
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: RETENTION_ANONYMIZED_NAME,
          email: `conta-inativa-${user.id}@anonimizado.fleet.local`,
          passwordHash: null,
          demoPassword: null,
          photoDataUrl: null,
          isActive: false
        }
      });
    }

    if (tenant) {
      await this.mediaService.deleteFileByPublicPath(tenant.photoDataUrl);
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          name: RETENTION_ANONYMIZED_NAME,
          documentNumber: null,
          photoDataUrl: null
        }
      });
    }

    await this.prisma.retention.markTenantPurged(tenantId);
  }
}
