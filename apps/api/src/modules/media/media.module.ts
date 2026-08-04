import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { PrismaService } from "../../common/prisma.service.js";
import { MediaAccessGuard } from "./media-access.guard.js";
import { MediaController } from "./media.controller.js";
import { MediaService } from "./media.service.js";

@Module({
  imports: [JwtModule.register({})],
  controllers: [MediaController],
  providers: [PrismaService, MediaService, MediaAccessGuard],
  exports: [MediaService]
})
export class MediaModule {}
