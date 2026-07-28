import { Field, Float, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class DashboardAlert {
  @Field()
  id!: string;

  @Field()
  title!: string;

  @Field()
  severity!: string;
}

@ObjectType()
export class NotificationItemModel {
  @Field()
  id!: string;

  @Field()
  title!: string;

  @Field()
  severity!: string;

  @Field()
  createdAt!: string;
}

@ObjectType()
export class DashboardActivity {
  @Field()
  id!: string;

  @Field()
  entity!: string;

  @Field()
  action!: string;

  @Field()
  title!: string;

  @Field()
  createdAt!: string;
}

@ObjectType()
export class UpcomingMaintenance {
  @Field()
  id!: string;

  @Field()
  vehicleLabel!: string;

  @Field({ nullable: true })
  dueDate?: string;

  @Field(() => Int, { nullable: true })
  dueKm?: number;
}

@ObjectType()
export class DashboardSummaryModel {
  @Field(() => Int)
  totalVehicles!: number;

  @Field(() => Int)
  activeVehicles!: number;

  @Field(() => Int)
  maintenanceVehicles!: number;

  @Field(() => Float)
  monthlyCost!: number;

  @Field(() => Float)
  averageConsumption!: number;

  @Field(() => Int)
  pendingSyncItems!: number;

  @Field(() => [UpcomingMaintenance])
  upcomingMaintenance!: UpcomingMaintenance[];

  @Field(() => [DashboardAlert])
  alerts!: DashboardAlert[];

  @Field(() => [DashboardActivity])
  recentActivity!: DashboardActivity[];
}
