import { Field, InputType, Int, Float } from "@nestjs/graphql";

import { FuelType } from "../../vehicles/vehicle.types.js";

@InputType()
export class CreateFuelLogInput {
  @Field()
  tenantId!: string;

  @Field()
  vehicleId!: string;

  @Field({ nullable: true })
  driverId?: string;

  @Field()
  fueledAt!: string;

  @Field(() => Int)
  odometerKm!: number;

  @Field(() => FuelType)
  fuelType!: FuelType;

  @Field(() => Float)
  liters!: number;

  @Field(() => Float)
  totalCost!: number;

  @Field(() => Float)
  pricePerLiter!: number;

  @Field({ nullable: true })
  stationName?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  receiptPhotoDataUrl?: string;

  @Field({ nullable: true })
  fuelingAddress?: string;

  @Field(() => Float, { nullable: true })
  fuelingLatitude?: number;

  @Field(() => Float, { nullable: true })
  fuelingLongitude?: number;
}
