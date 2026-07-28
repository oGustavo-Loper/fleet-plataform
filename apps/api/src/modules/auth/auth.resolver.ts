import { Args, Mutation, Resolver } from "@nestjs/graphql";

import { TenantModel } from "../tenants/tenant.types.js";
import {
  AuthPayload,
  CheckoutSessionModel,
  PasswordResetRequestModel
} from "./auth.types.js";
import { CreateCheckoutSessionInput } from "./dto/create-checkout-session.input.js";
import { CompleteFirstLoginInput } from "./dto/complete-first-login.input.js";
import { ConfirmBillingPaymentInput } from "./dto/confirm-billing-payment.input.js";
import { ConfirmPasswordResetInput } from "./dto/confirm-password-reset.input.js";
import { LoginInput } from "./dto/login.input.js";
import { RefreshSessionInput } from "./dto/refresh-session.input.js";
import { RequestPasswordResetInput } from "./dto/request-password-reset.input.js";
import { RegisterCompanyInput } from "./dto/register-company.input.js";
import { RegisterIndividualInput } from "./dto/register-individual.input.js";
import { UpgradePlanInput } from "./dto/upgrade-plan.input.js";
import { AuthService } from "./auth.service.js";

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  login(@Args("input") input: LoginInput) {
    return this.authService.login(input);
  }

  @Mutation(() => AuthPayload)
  refreshSession(@Args("input") input: RefreshSessionInput) {
    return this.authService.refreshSession(input);
  }

  @Mutation(() => AuthPayload)
  completeFirstLogin(@Args("input") input: CompleteFirstLoginInput) {
    return this.authService.completeFirstLogin(input);
  }

  @Mutation(() => PasswordResetRequestModel)
  requestPasswordReset(@Args("input") input: RequestPasswordResetInput) {
    return this.authService.requestPasswordReset(input);
  }

  @Mutation(() => AuthPayload)
  confirmPasswordReset(@Args("input") input: ConfirmPasswordResetInput) {
    return this.authService.confirmPasswordReset(input);
  }

  @Mutation(() => AuthPayload)
  registerCompany(@Args("input") input: RegisterCompanyInput) {
    return this.authService.registerCompany(input);
  }

  @Mutation(() => AuthPayload)
  registerIndividual(@Args("input") input: RegisterIndividualInput) {
    return this.authService.registerIndividual(input);
  }

  @Mutation(() => TenantModel)
  upgradePlan(@Args("input") input: UpgradePlanInput) {
    return this.authService.upgradePlan(input);
  }

  @Mutation(() => CheckoutSessionModel)
  createCheckoutSession(@Args("input") input: CreateCheckoutSessionInput) {
    return this.authService.createCheckoutSession(input);
  }

  @Mutation(() => TenantModel)
  confirmBillingPayment(@Args("input") input: ConfirmBillingPaymentInput) {
    return this.authService.confirmBillingPayment(input);
  }
}
