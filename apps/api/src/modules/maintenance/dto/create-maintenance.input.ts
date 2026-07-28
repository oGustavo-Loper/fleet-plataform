import { Field, Float, InputType, Int } from "@nestjs/graphql";

@InputType()
export class CreateMaintenanceInput {
  @Field()
  tenantId!: string;

  @Field()
  vehicleId!: string;

  @Field()
  title!: string;

  @Field()
  maintenanceType!: string;

  @Field()
  performedAt!: string;

  @Field(() => Int)
  odometerKm!: number;

  @Field(() => Float)
  totalCost!: number;

  @Field({ nullable: true })
  supplierName?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  nextMaintenanceAt?: string;

  @Field(() => Int, { nullable: true })
  nextMaintenanceKm?: number;

  @Field({ nullable: true })
  oilType?: string;

  @Field({ nullable: true })
  oilBrand?: string;

  @Field(() => Float, { nullable: true })
  oilCost?: number;

  @Field({ nullable: true })
  previousOilChangeAt?: string;

  @Field(() => Int, { nullable: true })
  previousOilChangeKm?: number;

  @Field({ nullable: true })
  previousOilChangeNotes?: string;

  @Field({ nullable: true })
  changedOilFilter?: boolean;

  @Field({ nullable: true })
  changedAirFilter?: boolean;

  @Field({ nullable: true })
  changedFuelFilter?: boolean;

  @Field({ nullable: true })
  tireBrand?: string;

  @Field(() => Int, { nullable: true })
  tireQuantity?: number;

  @Field(() => Float, { nullable: true })
  tireUnitCost?: number;

  @Field({ nullable: true })
  batteryBrand?: string;

  @Field(() => Float, { nullable: true })
  batteryCost?: number;

  @Field({ nullable: true })
  batteryVoltage?: string;

  @Field({ nullable: true })
  brakeService?: string;

  @Field({ nullable: true })
  beltChanged?: boolean;

  @Field({ nullable: true })
  partName?: string;

  @Field({ nullable: true })
  partBrand?: string;

  @Field(() => Float, { nullable: true })
  partCost?: number;
}
