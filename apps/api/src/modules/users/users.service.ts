import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import * as argon2 from "argon2";

import { PtBrMessage } from "../../common/messages.js";
import { PrismaService } from "../../common/prisma.service.js";
import { MediaService } from "../media/media.service.js";
import { DeleteMyAccountInput } from "./dto/delete-my-account.input.js";
import { UpdateMyProfileInput } from "./dto/update-my-profile.input.js";

const ACCOUNT_OWNER_ROLES = new Set(["ADMIN", "INDIVIDUAL"]);

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService
  ) {}

  async listByTenant(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { fullName: "asc" }
    });

    return users.map((user) => ({
      ...user,
      hasCompletedFirstLogin: !user.mustChangePassword
    }));
  }

  async updateOwnProfile(userId: string, input: UpdateMyProfileInput) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException(PtBrMessage.USER_NOT_FOUND);
    }

    let passwordHash: string | undefined;
    if (input.newPassword) {
      if (!input.currentPassword) {
        throw new BadRequestException(PtBrMessage.CURRENT_PASSWORD_REQUIRED);
      }

      const isCurrentPasswordValid =
        user.passwordHash && (await argon2.verify(user.passwordHash, input.currentPassword));

      if (!isCurrentPasswordValid) {
        throw new BadRequestException(PtBrMessage.CURRENT_PASSWORD_INVALID);
      }

      passwordHash = await argon2.hash(input.newPassword);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: input.fullName,
        photoDataUrl: input.photoDataUrl,
        passwordHash
      }
    });

    return { ...updated, hasCompletedFirstLogin: !updated.mustChangePassword };
  }

  async deleteOwnAccount(userId: string, input: DeleteMyAccountInput) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException(PtBrMessage.USER_NOT_FOUND);
    }

    if (!ACCOUNT_OWNER_ROLES.has(user.role)) {
      throw new ForbiddenException(PtBrMessage.ACCOUNT_DELETION_NOT_ALLOWED);
    }

    const isPasswordValid = user.passwordHash && (await argon2.verify(user.passwordHash, input.password));
    if (!isPasswordValid) {
      throw new BadRequestException(PtBrMessage.ACCOUNT_DELETION_PASSWORD_INVALID);
    }

    await this.deleteTenantPhotoFiles(user.tenantId);
    await this.prisma.tenant.delete({ where: { id: user.tenantId } });
    return true;
  }

  private async deleteTenantPhotoFiles(tenantId: string) {
    const [tenant, users, drivers, fuelLogs] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: tenantId } }),
      this.prisma.user.findMany({ where: { tenantId } }),
      this.prisma.driver.findMany({ where: { tenantId } }),
      this.prisma.fuelLog.findMany({ where: { tenantId } })
    ]);

    const photoPaths = [
      tenant?.photoDataUrl,
      ...users.map((record) => record.photoDataUrl),
      ...drivers.map((record) => record.photoDataUrl),
      ...fuelLogs.map((record) => record.receiptPhotoDataUrl)
    ];

    await Promise.all(photoPaths.map((path) => this.mediaService.deleteFileByPublicPath(path)));
  }
}
