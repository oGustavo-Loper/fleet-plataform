import { ForbiddenException, UseGuards } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";

import type { AuthenticatedUser } from "../../common/auth-user.js";
import { assertTenantAccess } from "../../common/assert-tenant-access.js";
import { CurrentUser } from "../../common/current-user.js";
import { GqlJwtAuthGuard } from "../../common/gql-jwt-auth.guard.js";
import { PtBrMessage } from "../../common/messages.js";
import { InviteUserInput } from "./dto/invite-user.input.js";
import { InviteUserResult, UserModel } from "./user.types.js";
import { UsersService } from "./users.service.js";

@UseGuards(GqlJwtAuthGuard)
@Resolver(() => UserModel)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [UserModel])
  users(@Args("tenantId") tenantId: string, @CurrentUser() user: AuthenticatedUser) {
    assertTenantAccess(user, tenantId);
    return this.usersService.listByTenant(tenantId);
  }

  @Mutation(() => InviteUserResult)
  inviteUser(@Args("input") input: InviteUserInput, @CurrentUser() user: AuthenticatedUser) {
    assertTenantAccess(user, input.tenantId);

    if (user.role !== "ADMIN") {
      throw new ForbiddenException(PtBrMessage.MANAGER_INVITE_ACCESS_DENIED);
    }

    return this.usersService.invite(input);
  }
}
