import { Module } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service.js";
import { MailService } from "../auth/mail.service.js";
import { DriversService } from "../drivers/drivers.service.js";
import { FuelsService } from "../fuels/fuels.service.js";
import { MaintenanceService } from "../maintenance/maintenance.service.js";
import { MediaModule } from "../media/media.module.js";
import { VehiclesService } from "../vehicles/vehicles.service.js";
import { SyncResolver } from "./sync.resolver.js";
import { SyncService } from "./sync.service.js";

@Module({
  imports: [MediaModule],
  providers: [
    PrismaService,
    MailService,
    VehiclesService,
    DriversService,
    FuelsService,
    MaintenanceService,
    SyncResolver,
    SyncService
  ]
})
export class SyncModule {}
