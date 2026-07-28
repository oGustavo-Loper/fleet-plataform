import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";

import type { AuthenticatedUser } from "../../common/auth-user.js";
import { assertTenantAccess } from "../../common/assert-tenant-access.js";
import { CurrentUser } from "../../common/current-user.js";
import { GqlJwtAuthGuard } from "../../common/gql-jwt-auth.guard.js";
import { PushSyncInput } from "./dto/push-sync.input.js";
import { SyncResult } from "./sync.types.js";
import { SyncService } from "./sync.service.js";

@UseGuards(GqlJwtAuthGuard)
@Resolver(() => SyncResult)
export class SyncResolver {
  constructor(private readonly syncService: SyncService) {}

  @Mutation(() => SyncResult)
  pushSyncEvent(@Args("input") input: PushSyncInput, @CurrentUser() user: AuthenticatedUser) {
    assertTenantAccess(user, input.tenantId);
    return this.syncService.pushEvent(input);
  }
}
