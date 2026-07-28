import assert from "node:assert/strict";
import test from "node:test";

import {
  type ReportPerformanceFuelLog,
  buildReportPerformanceInsights,
  buildReportPerformanceTrend
} from "./report-performance.js";

const logs: ReportPerformanceFuelLog[] = [
  {
    fueledAt: "2026-05-01",
    liters: 40,
    totalCost: 240,
    stationName: "Posto A",
    distanceKm: 520,
    averageConsumption: 13
  },
  {
    fueledAt: "2026-05-01",
    liters: 35,
    totalCost: 238,
    stationName: "Posto B",
    distanceKm: 390,
    averageConsumption: 11.14
  },
  {
    fueledAt: "2026-05-02",
    liters: 30,
    totalCost: 195,
    stationName: "Posto C",
    distanceKm: 450,
    averageConsumption: 15
  }
];

test("buildReportPerformanceInsights returns key performance highlights", () => {
  const insights = buildReportPerformanceInsights(logs);

  assert.equal(insights.length, 4);
  assert.equal(insights[0]?.id, "best-average");
  assert.equal(insights[0]?.value, "15.00 km/l");
  assert.equal(insights[1]?.id, "longest-distance");
  assert.equal(insights[1]?.value, "520 km");
  assert.equal(insights[2]?.id, "highest-cost");
  assert.equal(insights[2]?.value, "R$ 240.00");
  assert.equal(insights[3]?.id, "lowest-cost-per-km");
  assert.equal(insights[3]?.value, "R$ 0.43/km");
});

test("buildReportPerformanceTrend groups daily totals and recalculates average", () => {
  const trend = buildReportPerformanceTrend(logs);

  assert.equal(trend.length, 2);
  assert.equal(trend[0]?.date, "2026-05-01");
  assert.equal(trend[0]?.distanceKm, 910);
  assert.equal(trend[0]?.liters, 75);
  assert.equal(trend[0]?.averageConsumption, 12.13);
  assert.equal(trend[1]?.date, "2026-05-02");
  assert.equal(trend[1]?.distanceKm, 450);
});
