import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";

import type { AuthenticatedUser } from "../../common/auth-user.js";
import { assertTenantAccess } from "../../common/assert-tenant-access.js";
import { CurrentUser } from "../../common/current-user.js";
import { GqlJwtAuthGuard } from "../../common/gql-jwt-auth.guard.js";
import { CreateMaintenanceInput } from "./dto/create-maintenance.input.js";
import { MaintenanceModel } from "./maintenance.types.js";
import { MaintenanceService } from "./maintenance.service.js";

@UseGuards(GqlJwtAuthGuard)
@Resolver(() => MaintenanceModel)
export class MaintenanceResolver {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Query(() => [MaintenanceModel])
  maintenanceLogs(@Args("tenantId") tenantId: string, @CurrentUser() user: AuthenticatedUser) {
    assertTenantAccess(user, tenantId);
    return this.maintenanceService.listByTenant(tenantId);
  }

  @Mutation(() => MaintenanceModel)
  createMaintenance(@Args("input") input: CreateMaintenanceInput, @CurrentUser() user: AuthenticatedUser) {
    assertTenantAccess(user, input.tenantId);
    return this.maintenanceService.create(input);
  }
}
