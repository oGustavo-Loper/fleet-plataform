import { Module } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service.js";
import { VehiclesResolver } from "./vehicles.resolver.js";
import { VehiclesService } from "./vehicles.service.js";

@Module({
  providers: [PrismaService, VehiclesResolver, VehiclesService],
  exports: [VehiclesService]
})
export class VehiclesModule {}
