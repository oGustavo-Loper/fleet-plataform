import { ForbiddenException, UseGuards } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";

import type { AuthenticatedUser } from "../../common/auth-user.js";
import { assertTenantAccess } from "../../common/assert-tenant-access.js";
import { CurrentUser } from "../../common/current-user.js";
import { GqlJwtAuthGuard } from "../../common/gql-jwt-auth.guard.js";
import { PtBrMessage } from "../../common/messages.js";
import { CreateDriverInput } from "./dto/create-driver.input.js";
import { DeleteDriverInput } from "./dto/delete-driver.input.js";
import { UpdateDriverInput } from "./dto/update-driver.input.js";
import { DriverModel } from "./driver.types.js";
import { DriversService } from "./drivers.service.js";

@UseGuards(GqlJwtAuthGuard)
@Resolver(() => DriverModel)
export class DriversResolver {
  constructor(private readonly driversService: DriversService) {}

  @Query(() => [DriverModel])
  drivers(@Args("tenantId") tenantId: string, @CurrentUser() user: AuthenticatedUser) {
    assertTenantAccess(user, tenantId);
    return this.driversService.listByTenant(tenantId);
  }

  @Mutation(() => DriverModel)
  createDriver(@Args("input") input: CreateDriverInput, @CurrentUser() user: AuthenticatedUser) {
    assertTenantAccess(user, input.tenantId);
    return this.driversService.create(input);
  }

  @Mutation(() => DriverModel)
  updateDriver(@Args("input") input: UpdateDriverInput, @CurrentUser() user: AuthenticatedUser) {
    return this.driversService.update(input, user.tenantId);
  }

  @Mutation(() => DriverModel)
  deleteDriver(@Args("input") input: DeleteDriverInput, @CurrentUser() user: AuthenticatedUser) {
    return this.driversService.delete(input, user.tenantId);
  }

  @Mutation(() => DriverModel)
  promoteDriverToManager(@Args("driverId") driverId: string, @CurrentUser() user: AuthenticatedUser) {
    if (user.role !== "ADMIN") {
      throw new ForbiddenException(PtBrMessage.DRIVER_ROLE_CHANGE_ACCESS_DENIED);
    }

    return this.driversService.promoteToManager(driverId, user.tenantId);
  }

  @Mutation(() => DriverModel)
  demoteManagerToDriver(@Args("driverId") driverId: string, @CurrentUser() user: AuthenticatedUser) {
    if (user.role !== "ADMIN") {
      throw new ForbiddenException(PtBrMessage.DRIVER_ROLE_CHANGE_ACCESS_DENIED);
    }

    return this.driversService.demoteToDriver(driverId, user.tenantId);
  }
}
