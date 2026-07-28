import { UseGuards } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";

import type { AuthenticatedUser } from "../../common/auth-user.js";
import { assertTenantAccess } from "../../common/assert-tenant-access.js";
import { CurrentUser } from "../../common/current-user.js";
import { GqlJwtAuthGuard } from "../../common/gql-jwt-auth.guard.js";
import { VehicleReportModel } from "./report.types.js";
import { ReportsService } from "./reports.service.js";

@UseGuards(GqlJwtAuthGuard)
@Resolver(() => VehicleReportModel)
export class ReportsResolver {
  constructor(private readonly reportsService: ReportsService) {}

  @Query(() => VehicleReportModel)
  vehicleReport(
    @Args("tenantId") tenantId: string,
    @Args("vehicleId") vehicleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Args("from", { nullable: true }) from?: string,
    @Args("to", { nullable: true }) to?: string
  ) {
    assertTenantAccess(user, tenantId);
    return this.reportsService.vehicleReport(tenantId, vehicleId, { from, to });
  }
}
