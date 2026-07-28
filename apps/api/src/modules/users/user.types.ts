import { Field, ObjectType, registerEnumType } from "@nestjs/graphql";

export enum UserRole {
  ADMIN = "ADMIN",
  COMPANY = "COMPANY",
  DRIVER = "DRIVER",
  INDIVIDUAL = "INDIVIDUAL"
}

registerEnumType(UserRole, { name: "UserRole" });

@ObjectType()
export class UserModel {
  @Field()
  id!: string;

  @Field()
  tenantId!: string;

  @Field()
  email!: string;

  @Field()
  fullName!: string;

  @Field(() => UserRole)
  role!: UserRole;

  @Field()
  isActive!: boolean;
}
