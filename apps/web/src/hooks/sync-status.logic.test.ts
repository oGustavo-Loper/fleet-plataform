import assert from "node:assert/strict";
import test from "node:test";

import { deriveSyncStatus } from "./sync-status.logic.js";

test("deriveSyncStatus returns OFFLINE when browser is offline", () => {
  assert.equal(deriveSyncStatus(false, 0), "OFFLINE");
  assert.equal(deriveSyncStatus(false, 4), "OFFLINE");
});

test("deriveSyncStatus returns SYNCING when online with pending items", () => {
  assert.equal(deriveSyncStatus(true, 1), "SYNCING");
});

test("deriveSyncStatus returns ONLINE when online without pending items", () => {
  assert.equal(deriveSyncStatus(true, 0), "ONLINE");
});
