import { Module } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service.js";
import { DashboardResolver } from "./dashboard.resolver.js";
import { DashboardService } from "./dashboard.service.js";

@Module({
  providers: [PrismaService, DashboardResolver, DashboardService]
})
export class DashboardModule {}
