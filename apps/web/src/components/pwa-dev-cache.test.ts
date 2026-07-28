import assert from "node:assert/strict";
import test from "node:test";

import { getDevelopmentCacheKeysForCleanup } from "./pwa-dev-cache.js";

test("getDevelopmentCacheKeysForCleanup keeps only workbox-related caches", () => {
  assert.deepEqual(
    getDevelopmentCacheKeysForCleanup([
      "workbox-precache-v1",
      "vite-dev-runtime",
      "custom-app-cache",
      "precache-assets-v2"
    ]),
    ["workbox-precache-v1", "vite-dev-runtime", "precache-assets-v2"]
  );
});
