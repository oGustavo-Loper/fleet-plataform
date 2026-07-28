import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service.js";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  listByTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { fullName: "asc" }
    });
  }
}
