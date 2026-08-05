import { Module } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service.js";
import { MediaModule } from "../media/media.module.js";
import { UsersResolver } from "./users.resolver.js";
import { UsersService } from "./users.service.js";

@Module({
  imports: [MediaModule],
  providers: [PrismaService, UsersResolver, UsersService],
  exports: [UsersService]
})
export class UsersModule {}
