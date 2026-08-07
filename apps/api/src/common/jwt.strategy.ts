import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import type { AuthenticatedUser } from "./auth-user.js";
import { getJwtAccessSecret } from "./jwt-secrets.js";
import { PtBrMessage } from "./messages.js";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtAccessSecret()
    });
  }

  validate(payload: AuthenticatedUser) {
    // Media-scoped tokens (GET /media/token) are only valid against
    // MediaAccessGuard's own manual verification, never a regular
    // JWT-guarded GraphQL/REST route.
    if (payload.scope === "media") {
      throw new UnauthorizedException(PtBrMessage.SESSION_INVALID);
    }

    return payload;
  }
}
