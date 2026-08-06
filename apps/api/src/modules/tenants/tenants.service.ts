import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service.js";

function mapTenant<T extends { billingActivatedAt?: Date | string | null }>(tenant: T) {
  return {
    ...tenant,
    billingActivatedAt: tenant.billingActivatedAt
      ? new Date(tenant.billingActivatedAt).toISOString()
      : undefined
  };
}

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId?: string) {
    const tenants = await this.prisma.tenant.findMany({
      where: tenantId ? { id: tenantId } : undefined,
      orderBy: { name: "asc" }
    });

    return tenants.map(mapTenant);
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id }
    });

    return tenant ? mapTenant(tenant) : null;
  }

  async updatePhoto(tenantId: string, photoDataUrl?: string) {
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { photoDataUrl }
    });

    return mapTenant(tenant);
  }
}
