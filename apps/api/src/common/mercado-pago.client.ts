import { BadRequestException, Injectable } from "@nestjs/common";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import type { PreApprovalRequest, PreApprovalResponse } from "mercadopago/dist/clients/preApproval/commonTypes.js";

import { PtBrMessage } from "./messages.js";

/**
 * Thin wrapper around the Mercado Pago SDK's PreApproval (subscription)
 * client. Lazily constructed so the app can boot without
 * MERCADO_PAGO_ACCESS_TOKEN configured — it only throws once billing is
 * actually exercised, matching how jwt-secrets.ts defers its own
 * required-env checks to first use instead of failing at import time.
 */
@Injectable()
export class MercadoPagoClient {
  private preApproval?: PreApproval;

  private resolveClient(): PreApproval {
    if (this.preApproval) {
      return this.preApproval;
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
    if (!accessToken) {
      throw new BadRequestException(PtBrMessage.BILLING_NOT_CONFIGURED);
    }

    this.preApproval = new PreApproval(new MercadoPagoConfig({ accessToken }));
    return this.preApproval;
  }

  createSubscription(body: PreApprovalRequest): Promise<PreApprovalResponse> {
    return this.resolveClient().create({ body });
  }

  getSubscription(id: string): Promise<PreApprovalResponse> {
    return this.resolveClient().get({ id });
  }
}
