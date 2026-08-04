import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class RegisterIndividualInput {
  @Field()
  fullName!: string;

  @Field()
  cpf!: string;

  @Field()
  email!: string;

  @Field()
  password!: string;

  @Field({ nullable: true })
  createDriverProfile?: boolean;

  @Field()
  acceptedTermsVersion!: string;
}
