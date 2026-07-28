import { Field, Float, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class FuelLogModel {
  @Field()
  id!: string;

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

  @Field()
  fuelType!: string;

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

  @Field(() => Int, { nullable: true })
  previousKm?: number;

  @Field(() => Int)
  distanceKm!: number;

  @Field(() => Float)
  averageConsumption!: number;

  @Field()
  vehicleLabel!: string;

  @Field({ nullable: true })
  driverName?: string;

  @Field({ nullable: true })
  receiptPhotoDataUrl?: string;

  @Field({ nullable: true })
  fuelingAddress?: string;

  @Field(() => Float, { nullable: true })
  fuelingLatitude?: number;

  @Field(() => Float, { nullable: true })
  fuelingLongitude?: number;
}
