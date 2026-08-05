import { Module } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service.js";
import { DriversModule } from "../drivers/drivers.module.js";
import { MediaModule } from "../media/media.module.js";
import { RetentionService } from "./retention.service.js";

@Module({
  imports: [DriversModule, MediaModule],
  providers: [PrismaService, RetentionService],
  exports: [RetentionService]
})
export class RetentionModule {}
