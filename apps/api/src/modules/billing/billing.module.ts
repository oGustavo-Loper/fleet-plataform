import { Module } from "@nestjs/common";

import { MercadoPagoClient } from "../../common/mercado-pago.client.js";
import { PrismaService } from "../../common/prisma.service.js";
import { BillingController } from "./billing.controller.js";
import { BillingService } from "./billing.service.js";

@Module({
  controllers: [BillingController],
  providers: [PrismaService, MercadoPagoClient, BillingService]
})
export class BillingModule {}
