import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service.js";

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId?: string) {
    return this.prisma.tenant.findMany({
      where: tenantId ? { id: tenantId } : undefined,
      orderBy: { name: "asc" }
    });
  }

  findById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id }
    });
  }
}
