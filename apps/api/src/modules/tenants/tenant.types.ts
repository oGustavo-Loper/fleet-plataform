import { Field, ObjectType, registerEnumType } from "@nestjs/graphql";

export enum AccountType {
  COMPANY = "COMPANY",
  INDIVIDUAL = "INDIVIDUAL"
}

registerEnumType(AccountType, { name: "AccountType" });

export enum PlanStatus {
  TRIAL = "TRIAL",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE"
}

registerEnumType(PlanStatus, { name: "PlanStatus" });

@ObjectType()
export class TenantModel {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field(() => AccountType)
  accountType!: AccountType;

  @Field({ nullable: true })
  documentNumber?: string;

  @Field()
  planCode!: string;

  @Field(() => PlanStatus)
  planStatus!: PlanStatus;

  @Field({ nullable: true })
  vehicleLimit?: number;

  @Field({ nullable: true })
  photoDataUrl?: string;

  @Field({ nullable: true })
  billingProvider?: string;

  @Field({ nullable: true })
  billingActivatedAt?: string;
}
