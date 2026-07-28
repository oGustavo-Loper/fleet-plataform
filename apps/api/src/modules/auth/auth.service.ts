import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomInt } from "node:crypto";
import * as argon2 from "argon2";

import { PtBrMessage } from "../../common/messages.js";
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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService
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
      email: authUser.email
    };

    return {
      accessToken: await this.jwtService.signAsync(basePayload, {
        secret: process.env.JWT_ACCESS_SECRET ?? "access-dev-secret",
        expiresIn: "15m"
      }),
      refreshToken: await this.jwtService.signAsync(basePayload, {
        secret: process.env.JWT_REFRESH_SECRET ?? "refresh-dev-secret",
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
    const user = await this.findUserByLoginIdentifier(input.identifier);
    if (!user) {
      throw new UnauthorizedException(PtBrMessage.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(PtBrMessage.ACCOUNT_INACTIVE);
    }

    const passwordHash = user?.passwordHash as string | undefined;
    const demoPassword = user?.demoPassword as string | undefined;

    const isDemoMatch = demoPassword && demoPassword === input.password;
    const isHashMatch =
      passwordHash && (await argon2.verify(passwordHash, input.password));

    if (!isDemoMatch && !isHashMatch) {
      throw new UnauthorizedException(PtBrMessage.INVALID_CREDENTIALS);
    }

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

  async refreshSession(input: RefreshSessionInput) {
    let decoded: { sub: string; email: string };

    try {
      decoded = await this.jwtService.verifyAsync(input.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? "refresh-dev-secret"
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

    return this.issueAuthPayload(updated);
  }

  async requestPasswordReset(input: RequestPasswordResetInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!user) {
      return {
        deliveryHint: PtBrMessage.PASSWORD_RESET_DELIVERY_HINT,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      };
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
      debugCode: process.env.NODE_ENV === "production" ? undefined : code
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
        isActive: true
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
        vehicleLimit: 3,
        photoDataUrl: input.photoDataUrl
      }
    });

    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: input.email,
        fullName: input.fullName,
        role: "INDIVIDUAL",
        passwordHash: await argon2.hash(input.password),
        mustChangePassword: false,
        isActive: true
      }
    });

    if (input.createDriverProfile) {
      if (!input.cnh || !input.cnhCategory || !input.cnhExpiresAt) {
        throw new BadRequestException(
          "Para criar o perfil de motorista automaticamente, informe CNH, categoria e validade."
        );
      }

      await this.prisma.driver.create({
        data: {
          tenantId: tenant.id,
          fullName: input.fullName,
          cpf: input.cpf,
          cnh: input.cnh,
          cnhCategory: input.cnhCategory,
          cnhExpiresAt: input.cnhExpiresAt,
          assignedVehicleIds: [],
          allowAnyVehicle: true,
          photoDataUrl: input.photoDataUrl
        }
      });
    }

    return this.issueAuthPayload({
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
      fullName: user.fullName
    });
  }

  async upgradePlan(input: UpgradePlanInput) {
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
        vehicleLimit:
          input.planCode === "INDIVIDUAL_PRO"
            ? 20
            : input.planCode === "COMPANY_PRO"
              ? null
              : 3,
        billingProvider: "mercado_pago",
        billingActivatedAt: new Date()
      }
    });
  }

  async createCheckoutSession(input: CreateCheckoutSessionInput) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: input.tenantId }
    });

    if (!tenant) {
      throw new BadRequestException(PtBrMessage.ACCOUNT_NOT_FOUND);
    }

    if (input.planCode !== "INDIVIDUAL_PRO" && input.planCode !== "COMPANY_PRO") {
      throw new BadRequestException(PtBrMessage.CHECKOUT_PLAN_NOT_SUPPORTED);
    }

    const externalUrl = process.env.MERCADO_PAGO_CHECKOUT_URL;
    const fallbackBase = process.env.WEB_BASE_URL ?? "http://127.0.0.1:4173";
    const url = externalUrl
      ? new URL(externalUrl)
      : new URL("/billing/checkout", fallbackBase);
    url.searchParams.set("tenantId", tenant.id);
    url.searchParams.set("planCode", input.planCode);
    url.searchParams.set("customerName", tenant.name);
    url.searchParams.set("recurring", "true");
    url.searchParams.set("provider", "mercado_pago");

    return {
      checkoutUrl: url.toString(),
      provider: process.env.BILLING_PROVIDER ?? "mercado_pago",
      planCode: input.planCode
    };
  }

  async confirmBillingPayment(input: {
    tenantId: string;
    planCode: string;
    paymentId?: string;
    status?: string;
  }) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: input.tenantId }
    });

    if (!tenant) {
      throw new BadRequestException(PtBrMessage.ACCOUNT_NOT_FOUND);
    }

    if (input.status && input.status !== "approved" && input.status !== "paid") {
      throw new BadRequestException(PtBrMessage.PAYMENT_NOT_CONFIRMED);
    }

    const planCode = input.planCode === "COMPANY_PRO" ? "COMPANY_PRO" : "INDIVIDUAL_PRO";

    return this.prisma.tenant.update({
      where: { id: input.tenantId },
      data: {
        planCode,
        planStatus: "ACTIVE",
        vehicleLimit: planCode === "INDIVIDUAL_PRO" ? 20 : null,
        billingProvider: "mercado_pago",
        billingSubscriptionId: input.paymentId ?? undefined,
        billingActivatedAt: new Date()
      }
    });
  }
}
