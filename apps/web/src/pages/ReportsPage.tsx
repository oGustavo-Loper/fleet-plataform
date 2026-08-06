import type { CSSProperties } from "react";
import { useState } from "react";
import { AppShell } from "@fleet/ui";

import { FormField, formGridStyle, formInputStyle, formPanelStyle } from "../components/FormField";
import { EmptyState, ErrorState, LoadingState } from "../components/ScreenState";
import { ReportFuelSection } from "../features/reports/ReportFuelSection";
import { ReportMaintenanceSection } from "../features/reports/ReportMaintenanceSection";
import { ReportPerformancePanel } from "../features/reports/ReportPerformancePanel";
import { ReportSummaryGrid } from "../features/reports/ReportSummaryGrid";
import { useAuth } from "../contexts/AuthContext";
import { usePageMeta } from "../hooks/usePageMeta";
import { useReportsPageState } from "../hooks/useReportsPageState";
import { createVehicleReportPdfBlob, downloadBlob } from "../lib/pdf";
import { formatPlate } from "../lib/masks";
import { formatMaintenanceType } from "../lib/maintenance";

export function ReportsPage() {
  usePageMeta("Relatórios", "Resumo por veículo com abastecimentos, manutenções, custos e consumo médio.");
  const { auth } = useAuth();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const {
    activeTenant,
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
  } = useReportsPageState();
  const reportFuelLogs = report?.fuelLogs ?? [];
  const reportMaintenanceLogs = report?.maintenanceLogs ?? [];

  async function handleDownloadPdf() {
    if (!report) {
      return;
    }

    setPdfError("");
    setDownloadingPdf(true);

    try {
      const blob = await createVehicleReportPdfBlob({
        tenant: activeTenant,
        report,
        from,
        to,
        operator: {
          fullName: auth?.fullName,
          email: auth?.email,
          role: auth?.role
        }
      });
      downloadBlob(blob, `relatorio-${formatPlate(report.vehicle.plate).replace(/\s/g, "")}.pdf`);
    } catch (downloadError) {
      setPdfError(
        downloadError instanceof Error ? downloadError.message : "Falha ao gerar o PDF do relatorio."
      );
    } finally {
      setDownloadingPdf(false);
    }
  }

  function handleDownloadCsv() {
    if (!report) {
      return;
    }

    const rows: string[][] = [
      ["Tipo", "Valor"],
      ["Veículo", `${formatPlate(report.vehicle.plate)} - ${report.vehicle.model}`],
      ["Período", `${from.split("-").reverse().join("/")} até ${to.split("-").reverse().join("/")}`],
      ["Abastecimentos", String(report.summary.fuelCount)],
      ["Manutenções", String(report.summary.maintenanceCount)],
      ["KM rodados", String(report.summary.totalDistanceKm)],
      ["Média", `${report.summary.averageConsumption.toFixed(2)} km/l`],
      ["Custo total", `R$ ${report.summary.totalCost.toFixed(2)}`],
      [],
      ["Insights de desempenho"],
      ["Indicador", "Valor", "Detalhe"],
      ...performanceInsights.map((item) => [item.label, item.value, item.detail]),
      [],
      ["Evolução diária"],
      ["Data", "Distância (km)", "Litros", "Média (km/l)", "Custo total"],
      ...performanceTrend.map((item) => [
        item.date,
        item.distanceKm.toFixed(2),
        item.liters.toFixed(2),
        item.averageConsumption.toFixed(2),
        item.totalCost.toFixed(2)
      ]),
      [],
      ["Abastecimentos"],
      ["Data", "KM", "Litros", "Valor/L", "Total", "Média", "Posto", "Motorista", "Endereço"]
    ];

    report.fuelLogs.forEach((item) => {
      rows.push([
        item.fueledAt,
        String(item.odometerKm),
        item.liters.toFixed(2),
        item.pricePerLiter.toFixed(2),
        item.totalCost.toFixed(2),
        item.averageConsumption.toFixed(2),
        item.stationName ?? "",
        item.driverName ?? "",
        item.fuelingAddress ?? ""
      ]);
    });

    rows.push([], ["Manutenções"], ["Data", "KM", "Título", "Tipo", "Total", "Fornecedor"]);
    report.maintenanceLogs.forEach((item) => {
      rows.push([
        item.performedAt,
        String(item.odometerKm),
        item.title,
        formatMaintenanceType(item.maintenanceType),
        item.totalCost.toFixed(2),
        item.supplierName ?? ""
      ]);
    });

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `relatorio-${formatPlate(report.vehicle.plate).replace(/\s/g, "")}.csv`);
  }

  return (
    <AppShell
      title="Relatórios"
      subtitle="Resumo por veículo com abastecimentos, manutenções, custos e consumo médio."
    >
      <form style={formPanelStyle}>
        <p style={{ color: "#cbd5e1", marginTop: 0 }}>
          Período atual: {from.split("-").reverse().join("/")} até {to.split("-").reverse().join("/")}
        </p>
        <div style={formGridStyle}>
          <FormField label="Veículo">
            <select
              style={formInputStyle}
              value={selectedVehicleId}
              onChange={(event) => setVehicleId(event.target.value)}
            >
              {accessibleVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {formatPlate(vehicle.plate)} - {vehicle.model}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Data inicial">
            <input
              style={formInputStyle}
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </FormField>
          <FormField label="Data final">
            <input
              style={formInputStyle}
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </FormField>
        </div>
      </form>
      {report ? (
        <div style={actionsStyle}>
          <button
            type="button"
            style={{ ...downloadButtonStyle, ...(downloadingPdf ? downloadButtonDisabledStyle : null) }}
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? "Gerando PDF..." : "Baixar PDF"}
          </button>
          <button type="button" style={csvButtonStyle} onClick={handleDownloadCsv}>
            Baixar CSV
          </button>
          {selectedVehicle ? (
            <span style={helperStyle}>
              Relatório de {formatPlate(selectedVehicle.plate)} • {selectedVehicle.model}
            </span>
          ) : null}
        </div>
      ) : null}
      {pdfError ? <p style={pdfErrorStyle}>{pdfError}</p> : null}
      {reportQuery.loading || vehiclesLoading ? (
        <LoadingState message="Carregando relatório..." />
      ) : reportQuery.error ? (
        <ErrorState message="Falha ao carregar o relatório." detail={reportQuery.error.message} />
      ) : !allowAnyVehicle && accessibleVehicles.length === 0 ? (
        <EmptyState message="Nenhum veículo vinculado ao motorista foi encontrado para gerar o relatório." />
      ) : report ? (
        <>
          <ReportSummaryGrid cards={summaryCards} />
          <ReportPerformancePanel insights={performanceInsights} trend={performanceTrend} />
          <ReportFuelSection
            items={fuelPagination.pagedItems}
            totalItems={reportFuelLogs.length}
            page={fuelPagination.page}
            totalPages={fuelPagination.totalPages}
            currentCount={fuelPagination.pagedItems.length}
            onPageChange={fuelPagination.setPage}
          />
          <ReportMaintenanceSection
            items={maintenancePagination.pagedItems}
            totalItems={reportMaintenanceLogs.length}
            page={maintenancePagination.page}
            totalPages={maintenancePagination.totalPages}
            currentCount={maintenancePagination.pagedItems.length}
            onPageChange={maintenancePagination.setPage}
          />
        </>
      ) : (
        <EmptyState message="Selecione um veículo para gerar o relatório." />
      )}
    </AppShell>
  );
}

const actionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  flexWrap: "wrap",
  marginBottom: "1rem"
};

const downloadButtonStyle: CSSProperties = {
  border: 0,
  borderRadius: "0.9rem",
  padding: "0.9rem 1rem",
  background: "#22c55e",
  color: "#052e16",
  fontWeight: 700,
  cursor: "pointer"
};

const downloadButtonDisabledStyle: CSSProperties = {
  opacity: 0.7,
  cursor: "not-allowed"
};

const csvButtonStyle: CSSProperties = {
  borderRadius: "0.9rem",
  padding: "0.9rem 1rem",
  background: "transparent",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.22)"
};

const helperStyle: CSSProperties = {
  color: "#94a3b8"
};

const pdfErrorStyle: CSSProperties = {
  color: "#fda4af",
  marginTop: "-0.25rem",
  marginBottom: "1rem"
};
