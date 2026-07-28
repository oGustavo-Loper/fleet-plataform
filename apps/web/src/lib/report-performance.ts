export type ReportPerformanceInsight = {
  id: "best-average" | "longest-distance" | "highest-cost" | "lowest-cost-per-km";
  label: string;
  value: string;
  detail: string;
};

export type ReportPerformanceFuelLog = {
  fueledAt: string;
  stationName?: string;
  liters: number;
  totalCost: number;
  distanceKm: number;
  averageConsumption: number;
};

export type ReportPerformanceTrendPoint = {
  date: string;
  distanceKm: number;
  liters: number;
  totalCost: number;
  averageConsumption: number;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatKm(value: number) {
  return `${value.toLocaleString("pt-BR")} km`;
}

function formatMoney(value: number) {
  return `R$ ${value.toFixed(2)}`;
}

function formatConsumption(value: number) {
  return `${value.toFixed(2)} km/l`;
}

function resolveStationLabel(item: ReportPerformanceFuelLog) {
  return item.stationName?.trim() || "Posto não informado";
}

export function buildReportPerformanceInsights(
  fuelLogs: ReportPerformanceFuelLog[]
): ReportPerformanceInsight[] {
  if (!fuelLogs.length) {
    return [];
  }

  const bestAverage = [...fuelLogs]
    .filter((item) => Number(item.averageConsumption) > 0)
    .sort((left, right) => Number(right.averageConsumption) - Number(left.averageConsumption))[0];
  const longestDistance = [...fuelLogs].sort(
    (left, right) => Number(right.distanceKm) - Number(left.distanceKm)
  )[0];
  const highestCost = [...fuelLogs].sort(
    (left, right) => Number(right.totalCost) - Number(left.totalCost)
  )[0];
  const lowestCostPerKm = [...fuelLogs]
    .filter((item) => Number(item.distanceKm) > 0)
    .map((item) => ({
      item,
      costPerKm: Number(item.totalCost) / Number(item.distanceKm)
    }))
    .sort((left, right) => left.costPerKm - right.costPerKm)[0];

  const insights: ReportPerformanceInsight[] = [];

  if (bestAverage) {
    insights.push({
      id: "best-average",
      label: "Melhor média",
      value: formatConsumption(Number(bestAverage.averageConsumption)),
      detail: `${formatDate(bestAverage.fueledAt)} • ${resolveStationLabel(bestAverage)}`
    });
  }

  if (longestDistance) {
    insights.push({
      id: "longest-distance",
      label: "Maior distância",
      value: formatKm(Number(longestDistance.distanceKm)),
      detail: `${formatDate(longestDistance.fueledAt)} • ${resolveStationLabel(longestDistance)}`
    });
  }

  if (highestCost) {
    insights.push({
      id: "highest-cost",
      label: "Maior gasto",
      value: formatMoney(Number(highestCost.totalCost)),
      detail: `${formatDate(highestCost.fueledAt)} • ${resolveStationLabel(highestCost)}`
    });
  }

  if (lowestCostPerKm) {
    insights.push({
      id: "lowest-cost-per-km",
      label: "Menor custo por km",
      value: `R$ ${lowestCostPerKm.costPerKm.toFixed(2)}/km`,
      detail: `${formatDate(lowestCostPerKm.item.fueledAt)} • ${resolveStationLabel(lowestCostPerKm.item)}`
    });
  }

  return insights;
}

export function buildReportPerformanceTrend(
  fuelLogs: ReportPerformanceFuelLog[]
): ReportPerformanceTrendPoint[] {
  if (!fuelLogs.length) {
    return [];
  }

  const grouped = new Map<string, Omit<ReportPerformanceTrendPoint, "averageConsumption">>();

  fuelLogs.forEach((item) => {
    const date = item.fueledAt;
    const current = grouped.get(date) ?? {
      date,
      distanceKm: 0,
      liters: 0,
      totalCost: 0
    };

    current.distanceKm += Number(item.distanceKm ?? 0);
    current.liters += Number(item.liters ?? 0);
    current.totalCost += Number(item.totalCost ?? 0);
    grouped.set(date, current);
  });

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      averageConsumption:
        item.distanceKm > 0 && item.liters > 0
          ? Number((item.distanceKm / item.liters).toFixed(2))
          : 0
    }))
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
}
