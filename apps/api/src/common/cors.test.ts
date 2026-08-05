import assert from "node:assert/strict";
import test from "node:test";

import { resolveCorsOrigins } from "./cors.js";

function withEnv(overrides: Record<string, string | undefined>, fn: () => void) {
  const original: Record<string, string | undefined> = {};
  for (const key of Object.keys(overrides)) {
    original[key] = process.env[key];
    if (overrides[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = overrides[key];
    }
  }

  try {
    fn();
  } finally {
    for (const key of Object.keys(overrides)) {
      if (original[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original[key];
      }
    }
  }
}

test("resolveCorsOrigins prefers CORS_ALLOWED_ORIGINS and splits on commas", () => {
  withEnv(
    { CORS_ALLOWED_ORIGINS: "https://a.example.com, https://b.example.com", WEB_BASE_URL: "https://ignored.example.com" },
    () => {
      assert.deepEqual(resolveCorsOrigins(), ["https://a.example.com", "https://b.example.com"]);
    }
  );
});

test("resolveCorsOrigins falls back to WEB_BASE_URL when unset", () => {
  withEnv({ CORS_ALLOWED_ORIGINS: undefined, WEB_BASE_URL: "https://fleet.example.com" }, () => {
    assert.deepEqual(resolveCorsOrigins(), ["https://fleet.example.com"]);
  });
});

test("resolveCorsOrigins falls back to local dev origins when nothing is configured", () => {
  withEnv({ CORS_ALLOWED_ORIGINS: undefined, WEB_BASE_URL: undefined }, () => {
    assert.deepEqual(resolveCorsOrigins(), ["http://127.0.0.1:5173", "http://localhost:5173"]);
  });
});
