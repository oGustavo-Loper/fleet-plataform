import { Field, InputType, Int } from "@nestjs/graphql";

import { FuelType, VehicleStatus, VehicleType } from "../vehicle.types.js";

@InputType()
export class CreateVehicleInput {
  @Field()
  tenantId!: string;

  @Field()
  plate!: string;

  @Field(() => VehicleType)
  vehicleType!: VehicleType;

  @Field()
  model!: string;

  @Field()
  brand!: string;

  @Field(() => Int)
  year!: number;

  @Field(() => FuelType)
  fuelType!: FuelType;

  @Field(() => Int)
  currentKm!: number;

  @Field({ nullable: true })
  ownerName?: string;

  @Field({ nullable: true })
  companyName?: string;

  @Field(() => VehicleStatus)
  status!: VehicleStatus;
}
