import { ForbiddenException } from "@nestjs/common";

import type { AuthenticatedUser } from "./auth-user.js";
import { PtBrMessage } from "./messages.js";

export function assertTenantAccess(user: AuthenticatedUser | undefined, tenantId: string) {
  if (!user) {
    throw new ForbiddenException(PtBrMessage.AUTHENTICATED_USER_NOT_FOUND);
  }

  if (user.tenantId !== tenantId) {
    throw new ForbiddenException(PtBrMessage.TENANT_ACCESS_DENIED);
  }
}
