import { Module } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service.js";
import { ReportsResolver } from "./reports.resolver.js";
import { ReportsService } from "./reports.service.js";

@Module({
  providers: [PrismaService, ReportsResolver, ReportsService]
})
export class ReportsModule {}
