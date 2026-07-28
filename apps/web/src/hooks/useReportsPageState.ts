import { useQuery } from "@apollo/client/react";
import { useEffect, useMemo, useState } from "react";
import type { VehicleReportItem } from "@fleet/shared-types";

import { VEHICLE_REPORT_QUERY } from "../lib/queries";
import {
  buildReportPerformanceInsights,
  buildReportPerformanceTrend
} from "../lib/report-performance";
import { useAccessibleVehicles } from "./useAccessibleVehicles";
import { usePaginatedItems } from "./usePaginatedItems";
import { useTenant } from "./useTenant";

function getCurrentMonthRange() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const format = (date: Date) => date.toISOString().slice(0, 10);
  return { from: format(firstDay), to: format(lastDay) };
}

export function useReportsPageState() {
  const { activeTenant } = useTenant();
  const tenantId = activeTenant?.id ?? "";
  const { accessibleVehicles, allowAnyVehicle, loading: vehiclesLoading } = useAccessibleVehicles(tenantId);
  const [vehicleId, setVehicleId] = useState("");
  const initialRange = useMemo(() => getCurrentMonthRange(), []);
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);

  useEffect(() => {
    if (!accessibleVehicles.length || vehicleId) {
      return;
    }
    setVehicleId(accessibleVehicles[0].id);
  }, [accessibleVehicles, vehicleId]);

  const selectedVehicleId = vehicleId || accessibleVehicles[0]?.id || "";
  const reportQuery = useQuery<{ vehicleReport: VehicleReportItem }>(VEHICLE_REPORT_QUERY, {
    skip: !tenantId || !selectedVehicleId,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
    variables: {
      tenantId,
      vehicleId: selectedVehicleId,
      from: from || null,
      to: to || null
    }
  });

  const report = reportQuery.data?.vehicleReport;
  const selectedVehicle = accessibleVehicles.find((vehicle) => vehicle.id === selectedVehicleId);
  const reportFuelLogs = report?.fuelLogs ?? [];
  const reportMaintenanceLogs = report?.maintenanceLogs ?? [];
  const performanceInsights = useMemo(
    () => buildReportPerformanceInsights(reportFuelLogs),
    [reportFuelLogs]
  );
  const performanceTrend = useMemo(
    () => buildReportPerformanceTrend(reportFuelLogs).slice(-12),
    [reportFuelLogs]
  );
  const pageSize = 6;
  const fuelPagination = usePaginatedItems({
    items: reportFuelLogs,
    pageSize,
    resetDependencies: [selectedVehicleId, from, to, report?.vehicle.id]
  });
  const maintenancePagination = usePaginatedItems({
    items: reportMaintenanceLogs,
    pageSize,
    resetDependencies: [selectedVehicleId, from, to, report?.vehicle.id]
  });

  const summaryCards = useMemo(
    () =>
      report
        ? [
            { label: "Abastecimentos", value: report.summary.fuelCount },
            { label: "Manutenções", value: report.summary.maintenanceCount },
            { label: "KM rodados", value: report.summary.totalDistanceKm.toLocaleString("pt-BR") },
            { label: "Média", value: `${report.summary.averageConsumption.toFixed(2)} km/l` },
            { label: "Custo total", value: `R$ ${report.summary.totalCost.toFixed(2)}` }
          ]
        : [],
    [report]
  );

  return {
    activeTenant,
    tenantId,
    accessibleVehicles,
    allowAnyVehicle,
    vehiclesLoading,
    selectedVehicleId,
    setVehicleId,
    from,
    setFrom,
    to,
    setTo,
    reportQuery,
    report,
    selectedVehicle,
    summaryCards,
    performanceInsights,
    performanceTrend,
    fuelPagination,
    maintenancePagination
  };
}
