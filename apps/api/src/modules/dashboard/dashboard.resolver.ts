import { UseGuards } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";

import type { AuthenticatedUser } from "../../common/auth-user.js";
import { assertTenantAccess } from "../../common/assert-tenant-access.js";
import { CurrentUser } from "../../common/current-user.js";
import { GqlJwtAuthGuard } from "../../common/gql-jwt-auth.guard.js";
import { DashboardSummaryModel, NotificationItemModel } from "./dashboard.types.js";
import { DashboardService } from "./dashboard.service.js";

@UseGuards(GqlJwtAuthGuard)
@Resolver(() => DashboardSummaryModel)
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => DashboardSummaryModel)
  dashboardSummary(@Args("tenantId") tenantId: string, @CurrentUser() user: AuthenticatedUser) {
    assertTenantAccess(user, tenantId);
    return this.dashboardService.getSummary(tenantId);
  }

  @Query(() => [NotificationItemModel])
  notifications(@Args("tenantId") tenantId: string, @CurrentUser() user: AuthenticatedUser) {
    assertTenantAccess(user, tenantId);
    return this.dashboardService.listNotifications(tenantId);
  }
}
