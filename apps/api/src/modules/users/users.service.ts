import { BadRequestException, Injectable } from "@nestjs/common";
import { randomInt } from "node:crypto";
import * as argon2 from "argon2";

import { PtBrMessage } from "../../common/messages.js";
import { PrismaService } from "../../common/prisma.service.js";
import { MailService } from "../auth/mail.service.js";
import { InviteUserInput } from "./dto/invite-user.input.js";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService
  ) {}

  listByTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { fullName: "asc" }
    });
  }

  async invite(input: InviteUserInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existing) {
      throw new BadRequestException(PtBrMessage.EMAIL_ALREADY_EXISTS);
    }

    const tempPassword = randomInt(0, 1000000).toString().padStart(6, "0");

    const user = await this.prisma.user.create({
      data: {
        tenantId: input.tenantId,
        email: input.email,
        fullName: input.fullName,
        role: "MANAGER",
        passwordHash: await argon2.hash(tempPassword),
        mustChangePassword: true,
        isActive: true
      }
    });

    const delivery = await this.mailService.sendUserInvite(user.email, tempPassword, user.fullName);

    return {
      user,
      debugPassword: delivery.deliveryMode === "console" ? tempPassword : undefined
    };
  }
}
