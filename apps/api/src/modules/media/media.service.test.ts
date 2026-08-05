import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { MediaService } from "./media.service.js";

function createMediaService(mediaFileRecord: { tenantId: string } | null) {
  const storageRoot = mkdtempSync(join(tmpdir(), "media-service-test-"));
  process.env.MEDIA_STORAGE_DIR = storageRoot;

  const prisma = {
    mediaFile: {
      async findUnique() {
        return mediaFileRecord;
      }
    }
  };

  const service = new MediaService(prisma as never);
  return { service, storageRoot };
}

test("resolveAuthorizedFilePath denies a file with no media_files row (legacy fail-open closed)", async () => {
  const { service } = createMediaService(null);

  await assert.rejects(() => service.resolveAuthorizedFilePath("driver-photo", "missing.jpg", "tenant-1"));
});

test("resolveAuthorizedFilePath denies a file owned by a different tenant", async () => {
  const { service } = createMediaService({ tenantId: "tenant-2" });

  await assert.rejects(() => service.resolveAuthorizedFilePath("driver-photo", "photo.jpg", "tenant-1"));
});

test("resolveAuthorizedFilePath allows a file owned by the requesting tenant", async () => {
  const { service, storageRoot } = createMediaService({ tenantId: "tenant-1" });
  mkdirSync(join(storageRoot, "driver-photo"), { recursive: true });
  writeFileSync(join(storageRoot, "driver-photo", "photo.jpg"), "fake-image-bytes");

  const resolvedPath = await service.resolveAuthorizedFilePath("driver-photo", "photo.jpg", "tenant-1");

  assert.equal(resolvedPath, join(storageRoot, "driver-photo", "photo.jpg"));
});
