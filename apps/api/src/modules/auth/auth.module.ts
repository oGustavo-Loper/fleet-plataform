import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { JwtStrategy } from "../../common/jwt.strategy.js";
import { MercadoPagoClient } from "../../common/mercado-pago.client.js";
import { PrismaService } from "../../common/prisma.service.js";
import { AuthResolver } from "./auth.resolver.js";
import { AuthService } from "./auth.service.js";
import { MailService } from "./mail.service.js";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({})
  ],
  providers: [PrismaService, AuthResolver, AuthService, MailService, JwtStrategy, MercadoPagoClient],
  exports: [AuthService, PassportModule, JwtModule, JwtStrategy]
})
export class AuthModule {}
