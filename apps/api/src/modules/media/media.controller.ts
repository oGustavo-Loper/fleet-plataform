import { Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import { HttpJwtAuthGuard } from "../../common/http-jwt-auth.guard.js";
import { MediaService } from "./media.service.js";

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
  ) {
    const uploaded = await this.mediaService.storeImage(file, scope ?? "general");
    return uploaded;
  }
}
