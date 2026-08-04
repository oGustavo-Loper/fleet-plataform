import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";

import type { AuthenticatedUser } from "../../common/auth-user.js";
import { assertTenantAccess } from "../../common/assert-tenant-access.js";
import { CurrentUser } from "../../common/current-user.js";
import { GqlJwtAuthGuard } from "../../common/gql-jwt-auth.guard.js";
import { UpdateMyProfileInput } from "./dto/update-my-profile.input.js";
import { UserModel } from "./user.types.js";
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

  @Mutation(() => UserModel)
  updateMyProfile(@Args("input") input: UpdateMyProfileInput, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.updateOwnProfile(user.sub, input);
  }
}
