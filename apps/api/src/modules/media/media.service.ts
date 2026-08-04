import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";

import { PtBrMessage } from "../../common/messages.js";
import { PrismaService } from "../../common/prisma.service.js";

type UploadedMedia = {
  url: string;
  path: string;
  originalName: string;
  mimeType: string;
  size: number;
};

const mimeExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif"
};

const DIACRITICS_PATTERN = new RegExp("[\\u0300-\\u036f]", "g");

@Injectable()
export class MediaService {
  private readonly storageRoot = process.env.MEDIA_STORAGE_DIR ?? join(process.cwd(), "uploads");

  constructor(private readonly prisma: PrismaService) {}

  async storeImage(
    file:
      | {
          mimetype: string;
          originalname: string;
          buffer: Buffer;
          size: number;
        }
      | undefined,
    scope: string,
    tenantId: string
  ): Promise<UploadedMedia> {
    if (!file) {
      throw new BadRequestException(PtBrMessage.IMAGE_FILE_NOT_PROVIDED);
    }

    if (!file.mimetype.startsWith("image/")) {
      throw new BadRequestException(PtBrMessage.IMAGE_FILE_REQUIRED);
    }

    const safeScope = this.sanitizeSegment(scope);
    const extension = this.resolveExtension(file.mimetype, file.originalname);
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const directory = join(this.storageRoot, safeScope);
    await mkdir(directory, { recursive: true });

    const filePath = join(directory, fileName);
    await writeFile(filePath, file.buffer);

    const relativePath = `${safeScope}/${fileName}`;
    await this.prisma.mediaFile.create({
      data: { tenantId, path: relativePath, scope: safeScope }
    });

    const publicPath = `/media/${relativePath}`;

    return {
      url: publicPath,
      path: publicPath,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size
    };
  }

  /**
   * Files uploaded before this record existed have no media_files row —
   * allowed through for any authenticated user rather than broken links,
   * since their names are already unguessable (timestamp + UUID).
   */
  async resolveAuthorizedFilePath(scope: string, fileName: string, requesterTenantId: string) {
    const safeScope = this.sanitizeSegment(scope);
    const safeFileName = basename(fileName);
    const relativePath = `${safeScope}/${safeFileName}`;

    const record = await this.prisma.mediaFile.findUnique({ where: { path: relativePath } });
    if (record && record.tenantId !== requesterTenantId) {
      throw new ForbiddenException(PtBrMessage.MEDIA_ACCESS_DENIED);
    }

    const absolutePath = join(this.storageRoot, relativePath);
    if (!existsSync(absolutePath)) {
      throw new NotFoundException(PtBrMessage.MEDIA_FILE_NOT_FOUND);
    }

    return absolutePath;
  }

  /**
   * Best-effort cleanup for data-erasure flows (e.g. anonymizing a
   * terminated driver). Swallows failures — a missing/locked file must
   * never block the DB-side anonymization that already happened.
   */
  async deleteFileByPublicPath(publicPath?: string | null): Promise<void> {
    if (!publicPath) {
      return;
    }

    const match = publicPath.match(/^\/media\/([^/]+)\/([^/]+)$/);
    if (!match) {
      return;
    }

    const [, scope, fileName] = match;
    const safeScope = this.sanitizeSegment(scope);
    const safeFileName = basename(fileName);
    const absolutePath = join(this.storageRoot, safeScope, safeFileName);

    await rm(absolutePath, { force: true }).catch(() => undefined);
  }

  private resolveExtension(mimeType: string, originalName: string) {
    const mapped = mimeExtensions[mimeType];
    if (mapped) {
      return `.${mapped}`;
    }

    const fallback = extname(originalName).toLowerCase();
    return fallback || ".jpg";
  }

  private sanitizeSegment(value: string) {
    const normalized = value
      .normalize("NFD")
      .replace(DIACRITICS_PATTERN, "")
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return normalized || "general";
  }
}
