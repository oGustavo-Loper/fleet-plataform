import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service.js";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listByTenant(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { fullName: "asc" }
    });

    return users.map((user) => ({
      ...user,
      hasCompletedFirstLogin: !user.mustChangePassword
    }));
  }
}
