import { useMemo, useState, type CSSProperties } from "react";
import { useQuery } from "@apollo/client/react";
import { AppShell } from "@fleet/ui";
import type { PlatformTenantSummary } from "@fleet/shared-types";

import { EmptyState, ErrorState, LoadingState } from "../components/ScreenState";
import { ALL_TENANTS_QUERY } from "../lib/queries";
import { planLabel } from "../lib/plans";

const planStatusLabel: Record<string, string> = {
  ACTIVE: "Ativo",
  TRIAL: "Em avaliação",
  INACTIVE: "Inativo"
};

type StatusFilter = "ALL" | "ACTIVE_PAID";

export function SuperAdminPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const { data, loading, error } = useQuery<{ allTenants: PlatformTenantSummary[] }>(ALL_TENANTS_QUERY, {
    fetchPolicy: "network-only"
  });

  const tenants = data?.allTenants ?? [];

  const filteredTenants = useMemo(() => {
    if (statusFilter === "ALL") {
      return tenants;
    }

    return tenants.filter((tenant) => tenant.planStatus === "ACTIVE" && Boolean(tenant.billingActivatedAt));
  }, [statusFilter, tenants]);

  const activePaidCount = tenants.filter(
    (tenant) => tenant.planStatus === "ACTIVE" && Boolean(tenant.billingActivatedAt)
  ).length;

  return (
    <AppShell title="Todas as contas" subtitle="Visão de plataforma: contas de todos os clientes, com plano e status de pagamento.">
      <div style={summaryRowStyle}>
        <div style={summaryCardStyle}>
          <span style={summaryLabelStyle}>Total de contas</span>
          <strong style={summaryValueStyle}>{tenants.length}</strong>
        </div>
        <div style={summaryCardStyle}>
          <span style={summaryLabelStyle}>Com plano ativo e pago</span>
          <strong style={summaryValueStyle}>{activePaidCount}</strong>
        </div>
      </div>
      <div style={filterRowStyle}>
        <button
          type="button"
          style={{ ...filterButtonStyle, ...(statusFilter === "ALL" ? filterButtonActiveStyle : null) }}
          onClick={() => setStatusFilter("ALL")}
        >
          Todas
        </button>
        <button
          type="button"
          style={{ ...filterButtonStyle, ...(statusFilter === "ACTIVE_PAID" ? filterButtonActiveStyle : null) }}
          onClick={() => setStatusFilter("ACTIVE_PAID")}
        >
          Ativas e pagas
        </button>
      </div>
      {loading ? (
        <LoadingState message="Carregando contas..." />
      ) : error ? (
        <ErrorState message="Falha ao carregar as contas da plataforma." />
      ) : filteredTenants.length > 0 ? (
        <section style={listStyle}>
          {filteredTenants.map((tenant) => (
            <article key={tenant.id} style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div>
                  <strong>{tenant.name}</strong>
                  <p style={mutedStyle}>
                    {tenant.accountType === "COMPANY" ? "Empresa" : "Pessoa física"}
                    {tenant.documentNumber ? ` • ${tenant.documentNumber}` : ""}
                  </p>
                </div>
                <span
                  style={{
                    ...statusBadgeStyle,
                    color: tenant.planStatus === "ACTIVE" ? "#4ade80" : "#fbbf24"
                  }}
                >
                  {planStatusLabel[tenant.planStatus] ?? tenant.planStatus}
                </span>
              </div>
              <div style={cardGridStyle}>
                <DetailItem label="Plano" value={planLabel(tenant.planCode)} />
                <DetailItem
                  label="Limite de veículos"
                  value={tenant.vehicleLimit ? String(tenant.vehicleLimit) : "Ilimitado"}
                />
                <DetailItem label="Provedor de cobrança" value={tenant.billingProvider ?? "Não informado"} />
                <DetailItem
                  label="Ativado em"
                  value={
                    tenant.billingActivatedAt
                      ? new Date(tenant.billingActivatedAt).toLocaleDateString("pt-BR")
                      : "Não ativado"
                  }
                />
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState message="Nenhuma conta encontrada para este filtro." />
      )}
    </AppShell>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={detailCardStyle}>
      <span style={mutedStyle}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const summaryRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "1rem",
  marginBottom: "1.25rem"
};

const summaryCardStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.7)",
  border: "1px solid rgba(148, 163, 184, 0.18)"
};

const summaryLabelStyle: CSSProperties = {
  margin: 0,
  color: "#94a3b8"
};

const summaryValueStyle: CSSProperties = {
  display: "block",
  marginTop: "0.6rem",
  fontSize: "1.4rem"
};

const filterRowStyle: CSSProperties = {
  display: "flex",
  gap: "0.6rem",
  marginBottom: "1.25rem"
};

const filterButtonStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: "0.9rem",
  padding: "0.6rem 1rem",
  background: "rgba(15, 23, 42, 0.68)",
  color: "#f8fafc"
};

const filterButtonActiveStyle: CSSProperties = {
  background: "#fbbf24",
  color: "#0f172a",
  fontWeight: 700,
  borderColor: "#fbbf24"
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: "1rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))"
};

const cardStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  display: "grid",
  gap: "0.9rem"
};

const cardHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "0.75rem"
};

const mutedStyle: CSSProperties = {
  margin: "0.35rem 0 0",
  color: "#94a3b8"
};

const statusBadgeStyle: CSSProperties = {
  fontSize: "0.8rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em"
};

const cardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "0.75rem"
};

const detailCardStyle: CSSProperties = {
  padding: "0.85rem",
  borderRadius: "0.9rem",
  border: "1px solid rgba(148, 163, 184, 0.14)",
  background: "rgba(15, 23, 42, 0.5)",
  display: "grid",
  gap: "0.3rem"
};
