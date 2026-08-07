import { Body, Controller, Get, Param, Post, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtService } from "@nestjs/jwt";

import type { AuthenticatedUser } from "../../common/auth-user.js";
import { CurrentUser } from "../../common/current-user.js";
import { HttpJwtAuthGuard } from "../../common/http-jwt-auth.guard.js";
import { getJwtAccessSecret } from "../../common/jwt-secrets.js";
import { MediaAccessGuard } from "./media-access.guard.js";
import { MediaService } from "./media.service.js";

type SendFileResponse = {
  sendFile: (path: string) => void;
};

const MEDIA_TOKEN_TTL_SECONDS = 120;

@Controller("media")
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Mints a short-lived, media-scoped token for use as the ?token= query
   * param on /media/* <img> URLs, so the real (longer-lived, full-privilege)
   * access token never has to appear in a URL — see MediaAccessGuard.
   */
  @Get("token")
  @UseGuards(HttpJwtAuthGuard)
  async issueMediaToken(@CurrentUser() user: AuthenticatedUser) {
    const token = await this.jwtService.signAsync(
      {
        sub: user.sub,
        tenantId: user.tenantId,
        role: user.role,
        email: user.email,
        scope: "media"
      } satisfies AuthenticatedUser,
      {
        secret: getJwtAccessSecret(),
        expiresIn: `${MEDIA_TOKEN_TTL_SECONDS}s`
      }
    );

    return { token, expiresInSeconds: MEDIA_TOKEN_TTL_SECONDS };
  }

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
