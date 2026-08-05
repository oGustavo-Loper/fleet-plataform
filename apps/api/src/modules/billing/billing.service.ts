import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InvalidWebhookSignatureError, WebhookSignatureValidator } from "mercadopago";

import { MercadoPagoClient } from "../../common/mercado-pago.client.js";
import { PtBrMessage } from "../../common/messages.js";
import { PAID_PLAN_CODES, vehicleLimitForPlanCode } from "../../common/plans.js";
import { PrismaService } from "../../common/prisma.service.js";

type HeaderValue = string | string[] | undefined | null;

type MercadoPagoNotification = {
  id?: number | string;
  type?: string;
  data?: { id?: string };
};

const SUBSCRIPTION_ACTIVE_STATUSES = new Set(["authorized"]);
const SUBSCRIPTION_INACTIVE_STATUSES = new Set(["paused", "cancelled"]);

/**
 * Handles verified Mercado Pago subscription (PreApproval) webhook
 * notifications. This is the ONLY place a tenant's paid plan gets
 * activated from a "payment happened" signal — never a client mutation
 * (see AuthService.upgradePlan, which only allows moving to free plans).
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mercadoPagoClient: MercadoPagoClient
  ) {}

  async processWebhook(input: {
    xSignature: HeaderValue;
    xRequestId: HeaderValue;
    dataId: HeaderValue;
    body: MercadoPagoNotification;
  }) {
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
    if (!secret) {
      throw new BadRequestException(PtBrMessage.BILLING_NOT_CONFIGURED);
    }

    try {
      WebhookSignatureValidator.validate({
        xSignature: input.xSignature,
        xRequestId: input.xRequestId,
        dataId: input.dataId,
        secret,
        // Belt-and-suspenders on top of the notification-id idempotency
        // check below: a captured valid signature stops working after 5
        // minutes even if somehow replayed with its original body.
        toleranceSeconds: 300
      });
    } catch (error) {
      if (error instanceof InvalidWebhookSignatureError) {
        this.logger.warn(`Webhook rejeitado (${error.reason}), x-request-id=${error.requestId}`);
        throw new BadRequestException(PtBrMessage.WEBHOOK_SIGNATURE_INVALID);
      }
      throw error;
    }

    const notificationId = input.body.id === undefined ? undefined : String(input.body.id);
    const resourceId = input.body.data?.id;
    const eventType = input.body.type;

    if (!notificationId || !resourceId || !eventType) {
      throw new BadRequestException(PtBrMessage.WEBHOOK_INCOMPLETE_PAYLOAD);
    }

    if (await this.prisma.billingWebhookEvent.wasProcessed(notificationId)) {
      return { ok: true };
    }

    if (eventType === "subscription_preapproval") {
      await this.applySubscriptionStatus(resourceId);
    }

    await this.prisma.billingWebhookEvent.markProcessed({ notificationId, eventType, resourceId });
    return { ok: true };
  }

  /**
   * Never trusts the webhook body's own status — re-fetches the
   * subscription from Mercado Pago's API, the only authoritative source.
   */
  private async applySubscriptionStatus(subscriptionId: string) {
    const subscription = await this.mercadoPagoClient.getSubscription(subscriptionId);
    const [tenantId, planCode] = (subscription.external_reference ?? "").split(":");

    if (!tenantId || !planCode || !PAID_PLAN_CODES.has(planCode)) {
      this.logger.warn(`Assinatura ${subscriptionId} com external_reference inválido: "${subscription.external_reference}"`);
      return;
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      this.logger.warn(`Assinatura ${subscriptionId} referencia um tenant inexistente (${tenantId})`);
      return;
    }

    const status = subscription.status ?? "unknown";

    if (SUBSCRIPTION_ACTIVE_STATUSES.has(status)) {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          planCode,
          planStatus: "ACTIVE",
          vehicleLimit: vehicleLimitForPlanCode(planCode),
          billingProvider: "mercado_pago",
          billingSubscriptionId: subscriptionId,
          billingSubscriptionStatus: status,
          billingActivatedAt: new Date()
        }
      });
      return;
    }

    if (SUBSCRIPTION_INACTIVE_STATUSES.has(status)) {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          planStatus: "INACTIVE",
          billingSubscriptionStatus: status
        }
      });
      return;
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { billingSubscriptionStatus: status }
    });
  }
}
