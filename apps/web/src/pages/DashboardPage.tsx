import { useQuery } from "@apollo/client/react";
import { Link } from "react-router-dom";
import { AppShell } from "@fleet/ui";
import type { DashboardSummary } from "@fleet/shared-types";

import { StatusPill } from "../components/StatusPill";
import { DashboardView } from "../features/dashboard/DashboardView";
import { useApiHeartbeat } from "../hooks/useApiHeartbeat";
import { SyncCenter } from "../features/sync/SyncCenter";
import { useSyncStatus } from "../hooks/useSyncStatus";
import { useTenant } from "../hooks/useTenant";
import { DASHBOARD_SUMMARY_QUERY } from "../lib/queries";

export function DashboardPage() {
  const { status } = useSyncStatus();
  const apiHeartbeat = useApiHeartbeat();
  const { activeTenant, loading: tenantLoading } = useTenant();
  const { data, loading, error } = useQuery<{ dashboardSummary: DashboardSummary }>(
    DASHBOARD_SUMMARY_QUERY,
    {
      skip: !activeTenant?.id,
      variables: {
        tenantId: activeTenant?.id ?? ""
      }
    }
  );

  const summary = data?.dashboardSummary;

  const apiStatusLabel = apiHeartbeat.online
    ? `ONLINE${apiHeartbeat.responseTimeMs ? ` • ${apiHeartbeat.responseTimeMs} ms` : ""}`
    : "OFFLINE";

  return (
    <AppShell
      title="Painel de operação"
      subtitle="Visão consolidada de frota, custos, manutenção e sincronização offline."
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: "0.3rem" }}>
            <small style={{ color: "#94a3b8" }}>Sincronizacao local</small>
            <StatusPill status={status} />
          </div>
          <div style={{ display: "grid", gap: "0.3rem" }}>
            <small style={{ color: "#94a3b8" }}>API</small>
            <StatusPill status={apiHeartbeat.online ? "ONLINE" : "OFFLINE"} />
          </div>
        </div>
      </div>
      <div style={quickLinksStyle}>
        <Link style={quickLinkStyle} to="/fuels">
          Abastecer
        </Link>
        <Link style={quickLinkStyle} to="/maintenance">
          Manutenção
        </Link>
        <Link style={quickLinkStyle} to="/vehicles">
          Veículos
        </Link>
        <Link style={quickLinkStyle} to="/reports">
          Relatórios
        </Link>
      </div>
      {activeTenant?.accountType === "INDIVIDUAL" ? (
        <article
          style={{
            padding: "1rem",
            borderRadius: "1rem",
            background: "rgba(15, 23, 42, 0.72)",
            border: "1px solid rgba(251, 191, 36, 0.18)",
            marginBottom: "1rem"
          }}
        >
          <strong>Conta pessoa fisíca</strong>
          <p style={{ marginBottom: 0, color: "#cbd5e1" }}>
            Plano atual: {activeTenant.planCode}. Limite atual:{" "}
            {activeTenant.vehicleLimit ?? "Ilimitado"} veículos.
          </p>
          <Link style={{ color: "#fbbf24", display: "inline-block", marginTop: "0.75rem" }} to="/plans">
            Gerenciar plano
          </Link>
        </article>
      ) : null}
      {loading || tenantLoading ? (
        <p style={{ color: "#94a3b8" }}>Carregando dashboard...</p>
      ) : error ? (
        <p style={{ color: "#fda4af" }}>Falha ao carregar dashboard da API.</p>
      ) : summary ? (
        <DashboardView summary={summary} syncStatus={status} apiStatusLabel={apiStatusLabel} />
      ) : (
        <p style={{ color: "#94a3b8" }}>Nenhum dado de dashboard disponível.</p>
      )}
      <div style={{ marginTop: "1rem" }}>
        <SyncCenter />
      </div>
    </AppShell>
  );
}

const quickLinksStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "0.75rem",
  marginBottom: "1rem"
};

const quickLinkStyle = {
  borderRadius: "0.9rem",
  padding: "0.9rem 1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  color: "#f8fafc",
  textDecoration: "none",
  textAlign: "center" as const
};
