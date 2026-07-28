import { useEffect, useMemo, useState, type CSSProperties } from "react";

import type { DashboardSummary } from "@fleet/shared-types";
import { PaginationControls } from "../../components/PaginationControls";

const severityLabelMap: Record<string, string> = {
  critical: "Crítico",
  warning: "Atenção",
  info: "Informativo"
};

const entityLabelMap: Record<string, string> = {
  vehicle: "Veículo",
  fuel: "Abastecimento",
  maintenance: "Manutenção",
  driver: "Motorista"
};

const actionLabelMap: Record<string, string> = {
  create: "Criação",
  update: "Atualização"
};

function MetricCard({
  label,
  value
}: {
  label: string;
  value: string | number;
}) {
  return (
    <article style={cardStyle}>
      <p style={metricLabelStyle}>{label}</p>
      <strong style={metricValueStyle}>{value}</strong>
    </article>
  );
}

export function DashboardView({
  summary,
  syncStatus,
  apiStatusLabel
}: {
  summary: DashboardSummary;
  syncStatus: string;
  apiStatusLabel: string;
}) {
  const [maintenancePage, setMaintenancePage] = useState(1);
  const [alertsPage, setAlertsPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const pageSize = 4;

  const maintenancePages = Math.max(1, Math.ceil(summary.upcomingMaintenance.length / pageSize));
  const alertPages = Math.max(1, Math.ceil(summary.alerts.length / pageSize));
  const activityPages = Math.max(1, Math.ceil(summary.recentActivity.length / pageSize));

  const pagedMaintenance = useMemo(
    () => summary.upcomingMaintenance.slice((maintenancePage - 1) * pageSize, maintenancePage * pageSize),
    [maintenancePage, summary.upcomingMaintenance]
  );
  const pagedAlerts = useMemo(
    () => summary.alerts.slice((alertsPage - 1) * pageSize, alertsPage * pageSize),
    [alertsPage, summary.alerts]
  );
  const pagedActivity = useMemo(
    () => summary.recentActivity.slice((activityPage - 1) * pageSize, activityPage * pageSize),
    [activityPage, summary.recentActivity]
  );

  useEffect(() => {
    if (maintenancePage > maintenancePages) {
      setMaintenancePage(maintenancePages);
    }
  }, [maintenancePage, maintenancePages]);

  useEffect(() => {
    if (alertsPage > alertPages) {
      setAlertsPage(alertPages);
    }
  }, [alertPages, alertsPage]);

  useEffect(() => {
    if (activityPage > activityPages) {
      setActivityPage(activityPages);
    }
  }, [activityPage, activityPages]);

  return (
    <section style={gridStyle}>
      <div style={heroStyle}>
        <MetricCard label="Veículos totais" value={summary.totalVehicles} />
        <MetricCard label="Ativos" value={summary.activeVehicles} />
        <MetricCard label="Em manutenção" value={summary.maintenanceVehicles} />
        <MetricCard label="Custos do mês" value={`R$ ${summary.monthlyCost.toFixed(2)}`} />
        <MetricCard label="Consumo médio" value={`${summary.averageConsumption} km/l`} />
      </div>

      <article style={panelStyle}>
        <h2 style={panelTitleStyle}>Próximas manutenções</h2>
        {summary.upcomingMaintenance.length > 0 ? (
          <>
            {pagedMaintenance.map((item) => (
              <div key={item.id} style={listRowStyle}>
                <div>
                  <strong>{item.vehicleLabel}</strong>
                  <p style={secondaryTextStyle}>
                    {item.dueDate
                      ? `Data ${new Date(item.dueDate).toLocaleDateString()}`
                      : `KM ${item.dueKm}`}
                  </p>
                </div>
              </div>
            ))}
            <PaginationControls
              page={maintenancePage}
              totalPages={maintenancePages}
              totalItems={summary.upcomingMaintenance.length}
              pageSize={pageSize}
              currentCount={pagedMaintenance.length}
              onPageChange={setMaintenancePage}
            />
          </>
        ) : (
          <p style={secondaryTextStyle}>Nenhuma manutenção próxima registrada.</p>
        )}
      </article>

      <article style={panelStyle}>
        <h2 style={panelTitleStyle}>Alertas</h2>
        {summary.alerts.length > 0 ? (
          <>
            {pagedAlerts.map((alert) => (
              <div key={alert.id} style={listRowStyle}>
                <strong>{alert.title}</strong>
                <span
                  style={{
                    ...severityStyle,
                    color:
                      alert.severity === "critical"
                        ? "#fda4af"
                        : alert.severity === "warning"
                          ? "#fbbf24"
                          : "#93c5fd"
                  }}
                >
                  {severityLabelMap[alert.severity] ?? alert.severity}
                </span>
              </div>
            ))}
            <PaginationControls
              page={alertsPage}
              totalPages={alertPages}
              totalItems={summary.alerts.length}
              pageSize={pageSize}
              currentCount={pagedAlerts.length}
              onPageChange={setAlertsPage}
            />
          </>
        ) : (
          <p style={secondaryTextStyle}>Nenhum alerta importante no momento.</p>
        )}
      </article>

      <article style={panelStyle}>
        <h2 style={panelTitleStyle}>Atividades recentes</h2>
        {summary.recentActivity.length > 0 ? (
          <>
            {pagedActivity.map((item) => (
              <div key={item.id} style={listRowStyle}>
                <div>
                  <strong>{item.title}</strong>
                  <p style={secondaryTextStyle}>
                    {entityLabelMap[item.entity] ?? item.entity} •{" "}
                    {actionLabelMap[item.action] ?? item.action} •{" "}
                    {new Date(item.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
            <PaginationControls
              page={activityPage}
              totalPages={activityPages}
              totalItems={summary.recentActivity.length}
              pageSize={pageSize}
              currentCount={pagedActivity.length}
              onPageChange={setActivityPage}
            />
          </>
        ) : (
          <p style={secondaryTextStyle}>Nenhuma atividade recente registrada.</p>
        )}
      </article>
    </section>
  );
}

const gridStyle: CSSProperties = {
  display: "grid",
  gap: "1rem"
};

const heroStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "1rem"
};

const cardStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.7)",
  border: "1px solid rgba(148, 163, 184, 0.18)"
};

const metricLabelStyle: CSSProperties = {
  margin: 0,
  color: "#94a3b8"
};

const metricValueStyle: CSSProperties = {
  display: "block",
  marginTop: "0.6rem",
  fontSize: "1.4rem"
};

const panelStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.18)"
};

const panelTitleStyle: CSSProperties = {
  marginTop: 0
};

const listRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  padding: "0.75rem 0",
  borderTop: "1px solid rgba(148, 163, 184, 0.14)"
};

const secondaryTextStyle: CSSProperties = {
  margin: "0.35rem 0 0",
  color: "#94a3b8"
};

const severityStyle: CSSProperties = {
  textTransform: "uppercase",
  color: "#fbbf24",
  fontSize: "0.78rem"
};
