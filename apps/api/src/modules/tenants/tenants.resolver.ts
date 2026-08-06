import { ForbiddenException, UseGuards } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";

import type { AuthenticatedUser } from "../../common/auth-user.js";
import { assertTenantAccess } from "../../common/assert-tenant-access.js";
import { CurrentUser } from "../../common/current-user.js";
import { GqlJwtAuthGuard } from "../../common/gql-jwt-auth.guard.js";
import { PtBrMessage } from "../../common/messages.js";
import { UpdateTenantPhotoInput } from "./dto/update-tenant-photo.input.js";
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

  @Query(() => [TenantModel])
  allTenants(@CurrentUser() user: AuthenticatedUser) {
    if (user.role !== "SUPER_ADMIN") {
      throw new ForbiddenException(PtBrMessage.SUPER_ADMIN_ACCESS_DENIED);
    }

    return this.tenantsService.findAll();
  }

  @Query(() => TenantModel, { nullable: true })
  tenant(@Args("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    if (user.tenantId !== id) {
      return null;
    }
    return this.tenantsService.findById(id);
  }

  @Mutation(() => TenantModel)
  updateTenantPhoto(
    @Args("input") input: UpdateTenantPhotoInput,
    @CurrentUser() user: AuthenticatedUser
  ) {
    assertTenantAccess(user, input.tenantId);
    return this.tenantsService.updatePhoto(input.tenantId, input.photoDataUrl);
  }
}
