import { BadRequestException, Controller, Headers, Post, Req } from "@nestjs/common";

import { PtBrMessage } from "../../common/messages.js";
import { AuthService } from "../auth/auth.service.js";

@Controller("billing")
export class BillingController {
  constructor(private readonly authService: AuthService) {}

  @Post("webhooks/mercado-pago")
  async mercadoPagoWebhook(
    @Req() request: any,
    @Headers("x-billing-token") billingToken?: string
  ) {
    const expectedToken = process.env.BILLING_WEBHOOK_TOKEN;
    if (expectedToken && billingToken !== expectedToken) {
      throw new BadRequestException(PtBrMessage.WEBHOOK_INVALID);
    }

    const body = request.body as {
      tenantId?: string;
      planCode?: string;
      paymentId?: string;
      status?: string;
    };

    if (!body.tenantId || !body.planCode) {
      throw new BadRequestException(PtBrMessage.WEBHOOK_INCOMPLETE_PAYLOAD);
    }

    const tenant = await this.authService.confirmBillingPayment({
      tenantId: body.tenantId,
      planCode: body.planCode,
      paymentId: body.paymentId,
      status: body.status ?? "approved"
    });

    return {
      ok: true,
      tenantId: tenant.id,
      planCode: tenant.planCode,
      planStatus: tenant.planStatus
    };
  }
}
