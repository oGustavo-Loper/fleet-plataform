import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken!: string;

  @Field()
  refreshToken!: string;

  @Field()
  userId!: string;

  @Field()
  tenantId!: string;

  @Field()
  role!: string;

  @Field()
  fullName!: string;

  @Field({ nullable: true })
  driverId?: string;

  @Field(() => [String])
  assignedVehicleIds!: string[];

  @Field()
  allowAnyVehicle!: boolean;

  @Field()
  mustChangePassword!: boolean;
}

@ObjectType()
export class CheckoutSessionModel {
  @Field()
  checkoutUrl!: string;

  @Field()
  provider!: string;

  @Field()
  planCode!: string;
}

@ObjectType()
export class PasswordResetRequestModel {
  @Field()
  deliveryHint!: string;

  @Field()
  expiresAt!: string;
}
