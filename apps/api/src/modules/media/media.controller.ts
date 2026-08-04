import { Body, Controller, Get, Param, Post, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import type { AuthenticatedUser } from "../../common/auth-user.js";
import { CurrentUser } from "../../common/current-user.js";
import { HttpJwtAuthGuard } from "../../common/http-jwt-auth.guard.js";
import { MediaAccessGuard } from "./media-access.guard.js";
import { MediaService } from "./media.service.js";

type SendFileResponse = {
  sendFile: (path: string) => void;
};

@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post("upload")
  @UseGuards(HttpJwtAuthGuard)
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        fileSize: 10 * 1024 * 1024
      }
    })
  )
  async upload(
    @UploadedFile()
    file:
      | {
          mimetype: string;
          originalname: string;
          buffer: Buffer;
          size: number;
        }
      | undefined,
    @Body("scope") scope: string | undefined,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const uploaded = await this.mediaService.storeImage(file, scope ?? "general", user.tenantId);
    return uploaded;
  }

  @Get(":scope/:fileName")
  @UseGuards(MediaAccessGuard)
  async serve(
    @Param("scope") scope: string,
    @Param("fileName") fileName: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: SendFileResponse
  ) {
    const absolutePath = await this.mediaService.resolveAuthorizedFilePath(scope, fileName, user.tenantId);
    res.sendFile(absolutePath);
  }
}
