import { UseGuards } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";

import type { AuthenticatedUser } from "../../common/auth-user.js";
import { CurrentUser } from "../../common/current-user.js";
import { GqlJwtAuthGuard } from "../../common/gql-jwt-auth.guard.js";
import { TenantModel } from "./tenant.types.js";
import { TenantsService } from "./tenants.service.js";

@UseGuards(GqlJwtAuthGuard)
@Resolver(() => TenantModel)
export class TenantsResolver {
  constructor(private readonly tenantsService: TenantsService) {}

  @Query(() => [TenantModel])
  tenants(@CurrentUser() user: AuthenticatedUser) {
    return this.tenantsService.findAll(user.tenantId);
  }

  @Query(() => TenantModel, { nullable: true })
  tenant(@Args("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    if (user.tenantId !== id) {
      return null;
    }
    return this.tenantsService.findById(id);
  }
}
