import assert from "node:assert/strict";
import test from "node:test";

import {
  MAINTENANCE_HISTORY_HIGHLIGHT_MS,
  revealMaintenanceHistory
} from "./maintenance-history.js";

test("revealMaintenanceHistory returns false when target is missing", () => {
  const highlightValues: boolean[] = [];

  const revealed = revealMaintenanceHistory(null, (value) => {
    highlightValues.push(value);
  });

  assert.equal(revealed, false);
  assert.deepEqual(highlightValues, []);
});

test("revealMaintenanceHistory scrolls to section and resets highlight", () => {
  const highlightValues: boolean[] = [];
  const scrollCalls: ScrollIntoViewOptions[] = [];
  const scheduledHandlers: Array<() => void> = [];
  let scheduledTimeoutMs = 0;
  const target = {
    scrollIntoView(options?: ScrollIntoViewOptions) {
      scrollCalls.push(options ?? {});
    }
  };

  const revealed = revealMaintenanceHistory(
    target,
    (value) => {
      highlightValues.push(value);
    },
    (handler, timeoutMs) => {
      scheduledHandlers.push(handler);
      scheduledTimeoutMs = timeoutMs;
      return 1;
    }
  );

  assert.equal(revealed, true);
  assert.deepEqual(scrollCalls, [{ behavior: "smooth", block: "start", inline: "nearest" }]);
  assert.deepEqual(highlightValues, [true]);
  assert.equal(scheduledTimeoutMs, MAINTENANCE_HISTORY_HIGHLIGHT_MS);
  assert.equal(scheduledHandlers.length, 1);

  scheduledHandlers[0]?.();
  assert.deepEqual(highlightValues, [true, false]);
});
