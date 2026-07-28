import { Module } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service.js";
import { MaintenanceResolver } from "./maintenance.resolver.js";
import { MaintenanceService } from "./maintenance.service.js";

@Module({
  providers: [PrismaService, MaintenanceResolver, MaintenanceService]
})
export class MaintenanceModule {}
