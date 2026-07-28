import { Module } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service.js";
import { TenantsResolver } from "./tenants.resolver.js";
import { TenantsService } from "./tenants.service.js";

@Module({
  providers: [PrismaService, TenantsResolver, TenantsService],
  exports: [TenantsService]
})
export class TenantsModule {}
