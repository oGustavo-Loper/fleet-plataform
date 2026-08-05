import { Controller, Headers, Post, Query, Req } from "@nestjs/common";

import { BillingService } from "./billing.service.js";

type MercadoPagoWebhookRequest = {
  body: {
    id?: number | string;
    type?: string;
    data?: { id?: string };
  };
};

@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post("webhooks/mercado-pago")
  async mercadoPagoWebhook(
    @Req() request: MercadoPagoWebhookRequest,
    @Headers("x-signature") xSignature: string | undefined,
    @Headers("x-request-id") xRequestId: string | undefined,
    @Query("data.id") dataId: string | undefined
  ) {
    return this.billingService.processWebhook({
      xSignature,
      xRequestId,
      dataId,
      body: request.body
    });
  }
}
