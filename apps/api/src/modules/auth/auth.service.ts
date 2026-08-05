import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomInt } from "node:crypto";
import * as argon2 from "argon2";

import { PtBrMessage } from "../../common/messages.js";
import { getJwtAccessSecret, getJwtRefreshSecret } from "../../common/jwt-secrets.js";
import { MercadoPagoClient } from "../../common/mercado-pago.client.js";
import { FREE_PLAN_CODES, PAID_PLAN_CODES, PLAN_PRICES_BRL, vehicleLimitForPlanCode } from "../../common/plans.js";
import { PrismaService } from "../../common/prisma.service.js";
import { LoginInput } from "./dto/login.input.js";
import { CreateCheckoutSessionInput } from "./dto/create-checkout-session.input.js";
import { CompleteFirstLoginInput } from "./dto/complete-first-login.input.js";
import { ConfirmPasswordResetInput } from "./dto/confirm-password-reset.input.js";
import { RegisterCompanyInput } from "./dto/register-company.input.js";
import { RegisterIndividualInput } from "./dto/register-individual.input.js";
import { RequestPasswordResetInput } from "./dto/request-password-reset.input.js";
import { UpgradePlanInput } from "./dto/upgrade-plan.input.js";
import { MailService } from "./mail.service.js";
import { RefreshSessionInput } from "./dto/refresh-session.input.js";

const MAX_PASSWORD_RESET_ATTEMPTS = 5;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
const PASSWORD_RESET_REQUEST_COOLDOWN_MS = 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly mercadoPagoClient: MercadoPagoClient
  ) {}

  private async issueAuthPayload(authUser: {
    id: string;
    tenantId: string;
    role: string;
    email: string;
    fullName?: string;
    driverId?: string;
    assignedVehicleIds?: string[];
    allowAnyVehicle?: boolean;
    mustChangePassword?: boolean;
  }) {
    const basePayload = {
      sub: authUser.id,
      tenantId: authUser.tenantId,
      role: authUser.role,
      email: authUser.email,
      driverId: authUser.driverId,
      assignedVehicleIds: authUser.assignedVehicleIds ?? [],
      allowAnyVehicle: authUser.allowAnyVehicle ?? false
    };

    return {
      accessToken: await this.jwtService.signAsync(basePayload, {
        secret: getJwtAccessSecret(),
        expiresIn: "15m"
      }),
      refreshToken: await this.jwtService.signAsync(basePayload, {
        secret: getJwtRefreshSecret(),
        expiresIn: "7d"
      }),
      userId: authUser.id,
      tenantId: authUser.tenantId,
      role: authUser.role,
      fullName: authUser.fullName ?? authUser.email,
      driverId: authUser.driverId,
      assignedVehicleIds: authUser.assignedVehicleIds ?? [],
      allowAnyVehicle: authUser.allowAnyVehicle ?? false,
      mustChangePassword: authUser.mustChangePassword ?? false
    };
  }

  private generateResetCode() {
    return randomInt(0, 1000000).toString().padStart(6, "0");
  }

  private hashResetCode(code: string, salt: string) {
    return createHash("sha256").update(`${salt}:${code}`).digest("hex");
  }

  async login(input: LoginInput) {
    const identifier = String(input.identifier).trim().toLowerCase();

    const existingAttempt = await this.prisma.loginAttempt.findByIdentifier(identifier);
    if (existingAttempt?.lockedUntil && existingAttempt.lockedUntil.getTime() > Date.now()) {
      throw new UnauthorizedException(PtBrMessage.LOGIN_TOO_MANY_ATTEMPTS);
    }

    const user = await this.findUserByLoginIdentifier(identifier);
    if (!user) {
      await this.registerLoginFailure(identifier);
      throw new UnauthorizedException(PtBrMessage.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      await this.registerLoginFailure(identifier);
      throw new UnauthorizedException(PtBrMessage.ACCOUNT_INACTIVE);
    }

    const passwordHash = user?.passwordHash as string | undefined;
    const demoPassword = user?.demoPassword as string | undefined;

    const isDemoMatch = demoPassword && demoPassword === input.password;
    const isHashMatch =
      passwordHash && (await argon2.verify(passwordHash, input.password));

    if (!isDemoMatch && !isHashMatch) {
      await this.registerLoginFailure(identifier);
      throw new UnauthorizedException(PtBrMessage.INVALID_CREDENTIALS);
    }

    await this.prisma.loginAttempt.clear(identifier);
    await this.prisma.user.recordLogin(user.id);

    const authUser = user as {
      id: string;
      tenantId: string;
      role: string;
      email: string;
      fullName?: string;
      driverId?: string;
      assignedVehicleIds?: string[];
      allowAnyVehicle?: boolean;
      mustChangePassword?: boolean;
    };

    return this.issueAuthPayload(authUser);
  }

  private async registerLoginFailure(identifier: string) {
    const attempt = await this.prisma.loginAttempt.registerFailure(identifier);
    if (attempt.failedCount >= MAX_LOGIN_ATTEMPTS) {
      await this.prisma.loginAttempt.lock(identifier, new Date(Date.now() + LOGIN_LOCKOUT_MS));
    }
  }

  async refreshSession(input: RefreshSessionInput) {
    let decoded: { sub: string; email: string };

    try {
      decoded = await this.jwtService.verifyAsync(input.refreshToken, {
        secret: getJwtRefreshSecret()
      });
    } catch {
      throw new UnauthorizedException(PtBrMessage.SESSION_EXPIRED);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub }
    });

    if (!user || user.email !== decoded.email) {
      throw new UnauthorizedException(PtBrMessage.SESSION_INVALID);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(PtBrMessage.ACCOUNT_INACTIVE);
    }

    await this.prisma.user.recordLogin(user.id);

    return this.issueAuthPayload({
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
      driverId: user.driverId ?? undefined,
      assignedVehicleIds: user.assignedVehicleIds ?? [],
      allowAnyVehicle: user.allowAnyVehicle ?? false,
      mustChangePassword: user.mustChangePassword ?? false
    });
  }

  private async findUserByLoginIdentifier(identifier: string) {
    const normalizedIdentifier = String(identifier).trim();

    return this.prisma.user.findUnique({
      where: { email: normalizedIdentifier.toLowerCase() }
    });
  }

  async completeFirstLogin(input: CompleteFirstLoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!user) {
      throw new UnauthorizedException(PtBrMessage.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(PtBrMessage.ACCOUNT_INACTIVE);
    }

    const passwordHash = user?.passwordHash as string | undefined;
    const demoPassword = user?.demoPassword as string | undefined;
    const isDemoMatch = demoPassword && demoPassword === input.currentPassword;
    const isHashMatch = passwordHash && (await argon2.verify(passwordHash, input.currentPassword));

    if (!isDemoMatch && !isHashMatch) {
      throw new UnauthorizedException(PtBrMessage.INVALID_CREDENTIALS);
    }

    if (!user.mustChangePassword) {
      throw new BadRequestException(PtBrMessage.ACCOUNT_DOES_NOT_REQUIRE_PASSWORD_CHANGE);
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await argon2.hash(input.newPassword),
        demoPassword: null,
        mustChangePassword: false
      }
    });

    await this.prisma.user.recordLogin(updated.id);

    return this.issueAuthPayload(updated);
  }

  async requestPasswordReset(input: RequestPasswordResetInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!user) {
      return {
        deliveryHint: PtBrMessage.PASSWORD_RESET_DELIVERY_HINT,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        retryAfterSeconds: Math.ceil(PASSWORD_RESET_REQUEST_COOLDOWN_MS / 1000)
      };
    }

    const latestCode = await this.prisma.passwordResetCode.findLatestByEmail(user.email);
    if (latestCode) {
      const elapsedMs = Date.now() - latestCode.createdAt.getTime();
      if (elapsedMs < PASSWORD_RESET_REQUEST_COOLDOWN_MS) {
        return {
          deliveryHint: PtBrMessage.PASSWORD_RESET_DELIVERY_HINT,
          expiresAt: latestCode.expiresAt.toISOString(),
          retryAfterSeconds: Math.ceil((PASSWORD_RESET_REQUEST_COOLDOWN_MS - elapsedMs) / 1000)
        };
      }
    }

    const code = this.generateResetCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.passwordResetCode.create({
      userId: user.id,
      email: user.email,
      code,
      expiresAt
    });

    await this.mailService.sendPasswordResetCode(user.email, code, user.fullName);

    return {
      deliveryHint: PtBrMessage.PASSWORD_RESET_DELIVERY_HINT,
      expiresAt: expiresAt.toISOString(),
      retryAfterSeconds: Math.ceil(PASSWORD_RESET_REQUEST_COOLDOWN_MS / 1000)
    };
  }

  async confirmPasswordReset(input: ConfirmPasswordResetInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!user) {
      throw new BadRequestException(PtBrMessage.ACCOUNT_NOT_FOUND);
    }

    const resetCode = await this.prisma.passwordResetCode.findLatestByEmail(input.email);
    if (!resetCode) {
      throw new BadRequestException(PtBrMessage.PASSWORD_RESET_CODE_NOT_FOUND);
    }

    if (resetCode.usedAt) {
      throw new BadRequestException(PtBrMessage.PASSWORD_RESET_CODE_ALREADY_USED);
    }

    if (resetCode.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(PtBrMessage.PASSWORD_RESET_CODE_EXPIRED);
    }

    if (resetCode.attempts >= MAX_PASSWORD_RESET_ATTEMPTS) {
      throw new BadRequestException(PtBrMessage.PASSWORD_RESET_CODE_LOCKED);
    }

    const candidateHash = this.hashResetCode(input.code, resetCode.codeSalt);
    if (candidateHash !== resetCode.codeHash) {
      await this.prisma.passwordResetCode.incrementAttempts(resetCode.id);
      throw new BadRequestException(PtBrMessage.PASSWORD_RESET_CODE_INVALID);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await argon2.hash(input.newPassword),
      }
    });

    await this.prisma.passwordResetCode.markUsed(resetCode.id);
    await this.prisma.user.recordLogin(user.id);
    return this.issueAuthPayload({
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
      mustChangePassword: false
    });
  }

  async registerCompany(input: RegisterCompanyInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existing) {
      throw new BadRequestException(PtBrMessage.EMAIL_ALREADY_EXISTS);
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: input.companyName,
        accountType: "COMPANY",
        documentNumber: input.cnpj,
        planCode: "COMPANY_START",
        planStatus: "TRIAL",
        vehicleLimit: 3,
        photoDataUrl: input.photoDataUrl,
        billingProvider: "mercado_pago"
      }
    });

    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: input.email,
        fullName: input.adminFullName,
        role: "ADMIN",
        passwordHash: await argon2.hash(input.password),
        mustChangePassword: false,
        isActive: true,
        termsAcceptedAt: new Date(),
        termsVersion: input.acceptedTermsVersion
      }
    });

    return this.issueAuthPayload({
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
      fullName: user.fullName
    });
  }

  async registerIndividual(input: RegisterIndividualInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existing) {
      throw new BadRequestException(PtBrMessage.EMAIL_ALREADY_EXISTS);
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: input.fullName,
        accountType: "INDIVIDUAL",
        documentNumber: input.cpf,
        planCode: "ESSENTIAL_FREE",
        planStatus: "TRIAL",
        vehicleLimit: 3
      }
    });

    let driverId: string | undefined;
    if (input.createDriverProfile) {
      const driver = await this.prisma.driver.create({
        data: {
          tenantId: tenant.id,
          fullName: input.fullName,
          cpf: input.cpf,
          assignedVehicleIds: [],
          allowAnyVehicle: true
        }
      });
      driverId = driver.id;
    }

    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: input.email,
        fullName: input.fullName,
        role: "INDIVIDUAL",
        passwordHash: await argon2.hash(input.password),
        mustChangePassword: false,
        isActive: true,
        driverId,
        termsAcceptedAt: new Date(),
        termsVersion: input.acceptedTermsVersion
      }
    });

    return this.issueAuthPayload({
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
      driverId
    });
  }

  /**
   * Only ever moves a tenant to a free plan. Paid plans can only be
   * activated by BillingService reacting to a verified Mercado Pago
   * webhook — never directly by a client request, or anyone could grant
   * themselves a paid plan for free.
   */
  async upgradePlan(input: UpgradePlanInput) {
    if (PAID_PLAN_CODES.has(input.planCode)) {
      throw new BadRequestException(PtBrMessage.PLAN_UPGRADE_REQUIRES_PAYMENT);
    }

    if (!FREE_PLAN_CODES.has(input.planCode)) {
      throw new BadRequestException(PtBrMessage.CHECKOUT_PLAN_NOT_SUPPORTED);
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: input.tenantId }
    });

    if (!tenant) {
      throw new BadRequestException(PtBrMessage.ACCOUNT_NOT_FOUND);
    }

    return this.prisma.tenant.update({
      where: { id: input.tenantId },
      data: {
        planCode: input.planCode,
        planStatus: "ACTIVE",
        vehicleLimit: vehicleLimitForPlanCode(input.planCode)
      }
    });
  }

  async createCheckoutSession(input: CreateCheckoutSessionInput, payerEmail: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: input.tenantId }
    });

    if (!tenant) {
      throw new BadRequestException(PtBrMessage.ACCOUNT_NOT_FOUND);
    }

    if (!PAID_PLAN_CODES.has(input.planCode)) {
      throw new BadRequestException(PtBrMessage.CHECKOUT_PLAN_NOT_SUPPORTED);
    }

    const webBaseUrl = process.env.WEB_BASE_URL ?? "http://127.0.0.1:5173";
    const subscription = await this.mercadoPagoClient.createSubscription({
      reason: `Fleet Platform - ${input.planCode === "COMPANY_PRO" ? "Empresa Pro" : "Plano Pro"}`,
      // tenantId:planCode — Mercado Pago has no separate metadata field on
      // PreApproval, so the plan is encoded alongside the tenant here and
      // parsed back out of the webhook notification.
      external_reference: `${tenant.id}:${input.planCode}`,
      payer_email: payerEmail,
      back_url: new URL("/plans", webBaseUrl).toString(),
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: PLAN_PRICES_BRL[input.planCode],
        currency_id: "BRL"
      }
    });

    if (!subscription.init_point || !subscription.id) {
      throw new BadRequestException(PtBrMessage.BILLING_SUBSCRIPTION_NOT_FOUND);
    }

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        billingProvider: "mercado_pago",
        billingSubscriptionId: subscription.id,
        billingSubscriptionStatus: subscription.status ?? "pending"
      }
    });

    return {
      checkoutUrl: subscription.init_point,
      provider: "mercado_pago",
      planCode: input.planCode
    };
  }
}
