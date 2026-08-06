import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class UpdateTenantPhotoInput {
  @Field()
  tenantId!: string;

  @Field({ nullable: true })
  photoDataUrl?: string;
}
