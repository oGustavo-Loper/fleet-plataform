import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";

import type { AuthenticatedUser } from "../../common/auth-user.js";
import { assertTenantAccess } from "../../common/assert-tenant-access.js";
import { CurrentUser } from "../../common/current-user.js";
import { GqlJwtAuthGuard } from "../../common/gql-jwt-auth.guard.js";
import { CreateVehicleInput } from "./dto/create-vehicle.input.js";
import { UpdateVehicleInput } from "./dto/update-vehicle.input.js";
import { VehicleModel } from "./vehicle.types.js";
import { VehiclesService } from "./vehicles.service.js";

@UseGuards(GqlJwtAuthGuard)
@Resolver(() => VehicleModel)
export class VehiclesResolver {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Query(() => [VehicleModel])
  vehicles(@Args("tenantId") tenantId: string, @CurrentUser() user: AuthenticatedUser) {
    assertTenantAccess(user, tenantId);
    return this.vehiclesService.listByTenant(tenantId);
  }

  @Mutation(() => VehicleModel)
  createVehicle(@Args("input") input: CreateVehicleInput, @CurrentUser() user: AuthenticatedUser) {
    assertTenantAccess(user, input.tenantId);
    return this.vehiclesService.create(input);
  }

  @Mutation(() => VehicleModel)
  updateVehicle(@Args("input") input: UpdateVehicleInput, @CurrentUser() user: AuthenticatedUser) {
    return this.vehiclesService.update(input, user.tenantId);
  }
}
