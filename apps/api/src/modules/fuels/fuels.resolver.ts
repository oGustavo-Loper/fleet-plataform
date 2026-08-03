import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";

import type { AuthenticatedUser } from "../../common/auth-user.js";
import { assertTenantAccess } from "../../common/assert-tenant-access.js";
import { CurrentUser } from "../../common/current-user.js";
import { GqlJwtAuthGuard } from "../../common/gql-jwt-auth.guard.js";
import { CreateFuelLogInput } from "./dto/create-fuel-log.input.js";
import { FuelLogModel } from "./fuel.types.js";
import { FuelsService } from "./fuels.service.js";

@UseGuards(GqlJwtAuthGuard)
@Resolver(() => FuelLogModel)
export class FuelsResolver {
  constructor(private readonly fuelsService: FuelsService) {}

  @Query(() => [FuelLogModel])
  fuelLogs(@Args("tenantId") tenantId: string, @CurrentUser() user: AuthenticatedUser) {
    assertTenantAccess(user, tenantId);
    return this.fuelsService.listByTenant(tenantId, user);
  }

  @Mutation(() => FuelLogModel)
  createFuelLog(@Args("input") input: CreateFuelLogInput, @CurrentUser() user: AuthenticatedUser) {
    assertTenantAccess(user, input.tenantId);
    return this.fuelsService.create(input);
  }
}
