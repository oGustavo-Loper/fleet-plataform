import { Module } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service.js";
import { MailService } from "../auth/mail.service.js";
import { MediaModule } from "../media/media.module.js";
import { DriversResolver } from "./drivers.resolver.js";
import { DriversService } from "./drivers.service.js";

@Module({
  imports: [MediaModule],
  providers: [PrismaService, MailService, DriversResolver, DriversService],
  exports: [DriversService]
})
export class DriversModule {}
