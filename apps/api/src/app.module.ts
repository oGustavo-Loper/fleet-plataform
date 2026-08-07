import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";

import { PrismaService } from "./common/prisma.service.js";
import { HealthController } from "./health.controller.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { BillingModule } from "./modules/billing/billing.module.js";
import { DashboardModule } from "./modules/dashboard/dashboard.module.js";
import { DriversModule } from "./modules/drivers/drivers.module.js";
import { FuelsModule } from "./modules/fuels/fuels.module.js";
import { MaintenanceModule } from "./modules/maintenance/maintenance.module.js";
import { MediaModule } from "./modules/media/media.module.js";
import { ReportsModule } from "./modules/reports/reports.module.js";
import { RetentionModule } from "./modules/retention/retention.module.js";
import { SyncModule } from "./modules/sync/sync.module.js";
import { TenantsModule } from "./modules/tenants/tenants.module.js";
import { UsersModule } from "./modules/users/users.module.js";
import { VehiclesModule } from "./modules/vehicles/vehicles.module.js";

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      // Playground/introspection expose the full schema (including
      // PII-shaped field names) to anyone who can reach /graphql, so they
      // only run when explicitly opted into for local development. Unset
      // NODE_ENV is treated as production (fail closed).
      playground: process.env.NODE_ENV === "development",
      introspection: process.env.NODE_ENV === "development",
      // Never echo stack traces to the client; unexpected errors are still
      // logged server-side by Nest's default exception handling.
      includeStacktraceInErrorResponses: false,
      sortSchema: true,
      context: ({ req }: { req?: unknown }) => ({ req })
    }),
    AuthModule,
    BillingModule,
    TenantsModule,
    UsersModule,
    DriversModule,
    FuelsModule,
    MaintenanceModule,
    MediaModule,
    ReportsModule,
    VehiclesModule,
    DashboardModule,
    SyncModule,
    RetentionModule
  ],
  providers: [PrismaService]
})
export class AppModule {}
