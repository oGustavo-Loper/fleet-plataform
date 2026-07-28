import { Module } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service.js";
import { FuelsResolver } from "./fuels.resolver.js";
import { FuelsService } from "./fuels.service.js";

@Module({
  providers: [PrismaService, FuelsResolver, FuelsService]
})
export class FuelsModule {}
