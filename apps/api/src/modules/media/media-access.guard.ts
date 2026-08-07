import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import type { AuthenticatedUser } from "../../common/auth-user.js";
import { getJwtAccessSecret } from "../../common/jwt-secrets.js";
import { PtBrMessage } from "../../common/messages.js";

type MediaRequest = {
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  user?: unknown;
};

/**
 * <img> tags and canvas/PDF fetches can't attach an Authorization header,
 * so this guard accepts a token via the standard header OR a "token" query
 * param — unlike every other guarded route, which only accepts the header.
 *
 * The query-param path only accepts the short-lived, media-scoped token
 * minted by GET /media/token (never the full-privilege access token) —
 * that token ending up in browser history or proxy/CDN access logs is a
 * much smaller exposure than the real bearer credential would be.
 */
@Injectable()
export class MediaAccessGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<MediaRequest>();
    const authHeader = request.headers.authorization;
    const headerToken =
      typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : undefined;
    const queryToken = typeof request.query.token === "string" ? request.query.token : undefined;
    const token = headerToken ?? queryToken;

    if (!token) {
      throw new UnauthorizedException(PtBrMessage.SESSION_INVALID);
    }

    let payload: AuthenticatedUser;
    try {
      payload = await this.jwtService.verifyAsync(token, { secret: getJwtAccessSecret() });
    } catch {
      throw new UnauthorizedException(PtBrMessage.SESSION_EXPIRED);
    }

    if (!headerToken && payload.scope !== "media") {
      throw new UnauthorizedException(PtBrMessage.SESSION_INVALID);
    }

    request.user = payload;
    return true;
  }
}
