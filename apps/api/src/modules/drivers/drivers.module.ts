import { Module } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service.js";
import { MailService } from "../auth/mail.service.js";
import { DriversResolver } from "./drivers.resolver.js";
import { DriversService } from "./drivers.service.js";

@Module({
  providers: [PrismaService, MailService, DriversResolver, DriversService],
  exports: [DriversService]
})
export class DriversModule {}
