import { Field, Float, Int, ObjectType } from "@nestjs/graphql";

import { FuelLogModel } from "../fuels/fuel.types.js";
import { MaintenanceModel } from "../maintenance/maintenance.types.js";
import { VehicleModel } from "../vehicles/vehicle.types.js";

@ObjectType()
export class VehicleReportSummaryModel {
  @Field(() => Int)
  fuelCount!: number;

  @Field(() => Int)
  maintenanceCount!: number;

  @Field(() => Float)
  totalLiters!: number;

  @Field(() => Int)
  totalDistanceKm!: number;

  @Field(() => Float)
  totalFuelCost!: number;

  @Field(() => Float)
  totalMaintenanceCost!: number;

  @Field(() => Float)
  totalCost!: number;

  @Field(() => Float)
  averageConsumption!: number;
}

@ObjectType()
export class VehicleReportPeriodModel {
  @Field({ nullable: true })
  from?: string;

  @Field({ nullable: true })
  to?: string;
}

@ObjectType()
export class VehicleReportModel {
  @Field(() => VehicleModel)
  vehicle!: VehicleModel;

  @Field(() => VehicleReportPeriodModel)
  period!: VehicleReportPeriodModel;

  @Field(() => VehicleReportSummaryModel)
  summary!: VehicleReportSummaryModel;

  @Field(() => [FuelLogModel])
  fuelLogs!: FuelLogModel[];

  @Field(() => [MaintenanceModel])
  maintenanceLogs!: MaintenanceModel[];
}
