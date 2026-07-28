import { Field, Int, ObjectType, registerEnumType } from "@nestjs/graphql";

export enum FuelType {
  GASOLINE = "GASOLINE",
  ETHANOL = "ETHANOL",
  DIESEL = "DIESEL",
  FLEX = "FLEX",
  ELECTRIC = "ELECTRIC",
  HYBRID = "HYBRID"
}

export enum VehicleType {
  CAR = "CAR",
  MOTORCYCLE = "MOTORCYCLE",
  TRUCK = "TRUCK",
  BUS = "BUS"
}

export enum VehicleStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  MAINTENANCE = "MAINTENANCE",
  SOLD = "SOLD"
}

registerEnumType(FuelType, { name: "FuelType" });
registerEnumType(VehicleType, { name: "VehicleType" });
registerEnumType(VehicleStatus, { name: "VehicleStatus" });

@ObjectType()
export class VehicleModel {
  @Field()
  id!: string;

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

  @Field()
  ownerName!: string;

  @Field({ nullable: true })
  companyName?: string;

  @Field(() => VehicleStatus)
  status!: VehicleStatus;

  @Field()
  createdAt!: string;
}
