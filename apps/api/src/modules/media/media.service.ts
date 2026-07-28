import { BadRequestException, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

import { PtBrMessage } from "../../common/messages.js";

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

@Injectable()
export class MediaService {
  private readonly storageRoot = process.env.MEDIA_STORAGE_DIR ?? join(process.cwd(), "uploads");

  async storeImage(
    file:
      | {
          mimetype: string;
          originalname: string;
          buffer: Buffer;
          size: number;
        }
      | undefined,
    scope: string
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

    const publicPath = `/media/${safeScope}/${fileName}`;

    return {
      url: publicPath,
      path: publicPath,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size
    };
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
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return normalized || "general";
  }
}
