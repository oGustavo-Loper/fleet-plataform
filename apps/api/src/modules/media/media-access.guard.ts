import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { getJwtAccessSecret } from "../../common/jwt-secrets.js";
import { PtBrMessage } from "../../common/messages.js";

type MediaRequest = {
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  user?: unknown;
};

/**
 * <img> tags and canvas/PDF fetches can't attach an Authorization header,
 * so this guard accepts the access token via the standard header OR a
 * "token" query param — unlike every other guarded route, which only
 * accepts the header.
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

    try {
      request.user = await this.jwtService.verifyAsync(token, { secret: getJwtAccessSecret() });
      return true;
    } catch {
      throw new UnauthorizedException(PtBrMessage.SESSION_EXPIRED);
    }
  }
}
