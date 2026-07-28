import { Module } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service.js";
import { SyncResolver } from "./sync.resolver.js";
import { SyncService } from "./sync.service.js";

@Module({
  providers: [PrismaService, SyncResolver, SyncService]
})
export class SyncModule {}
