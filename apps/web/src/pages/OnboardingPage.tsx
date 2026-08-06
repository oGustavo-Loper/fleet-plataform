import type { CSSProperties } from "react";
import { useQuery } from "@apollo/client/react";
import { Link } from "react-router-dom";
import { AppShell } from "@fleet/ui";
import type { DriverListItem, VehicleListItem } from "@fleet/shared-types";

import { useAuth } from "../contexts/AuthContext";
import { usePageMeta } from "../hooks/usePageMeta";
import { useTenant } from "../hooks/useTenant";
import { DRIVERS_QUERY, VEHICLES_QUERY } from "../lib/queries";
import { planLabel } from "../lib/plans";

export function OnboardingPage() {
  usePageMeta("Primeiros passos", "Configure os primeiros dados da conta para começar a operar no Fleet Platform.");
  const { auth } = useAuth();
  const { activeTenant } = useTenant();
  const tenantId = activeTenant?.id ?? "";
  const vehiclesQuery = useQuery<{ vehicles: VehicleListItem[] }>(VEHICLES_QUERY, {
    skip: !tenantId,
    variables: { tenantId }
  });
  const driversQuery = useQuery<{ drivers: DriverListItem[] }>(DRIVERS_QUERY, {
    skip: !tenantId,
    variables: { tenantId }
  });

  const vehicles = vehiclesQuery.data?.vehicles ?? [];
  const drivers = driversQuery.data?.drivers ?? [];
  const isCompany = activeTenant?.accountType === "COMPANY";
  const ownDriver = drivers.find((driver) => driver.id === auth?.driverId);
  const hasPendingCnh = Boolean(ownDriver && !ownDriver.cnh);

  return (
    <AppShell
      title="Primeiros Passos"
      subtitle="Configure os primeiros dados da conta para começar a operar no Fleet Platform."
    >
      <section style={gridStyle}>
        <article style={cardStyle}>
          <strong>1. Conta criada</strong>
          <p style={mutedStyle}>
            Plano atual: {planLabel(activeTenant?.planCode)} •{" "}
            {activeTenant?.vehicleLimit ?? "Veículos ilimitados"}
          </p>
        </article>
        <article style={cardStyle}>
          <strong>2. Veículos</strong>
          <p style={mutedStyle}>
            Você possui {vehicles.length} veículo(s) cadastrado(s).
          </p>
          <Link style={linkStyle} to="/vehicles">
            {vehicles.length === 0 ? "Cadastrar primeiro veículo" : "Gerenciar veículos"}
          </Link>
        </article>
        <article style={cardStyle}>
          <strong>3. Motoristas</strong>
          <p style={mutedStyle}>
            Você possui {drivers.length} motorista(s) cadastrado(s).
          </p>
          <Link style={linkStyle} to="/drivers">
            {drivers.length === 0
              ? isCompany
                ? "Cadastrar primeiro motorista"
                : "Revisar perfil de motorista"
              : "Gerenciar motoristas"}
          </Link>
          {hasPendingCnh ? (
            <p style={pendingStyle}>
              Sua CNH está pendente.{" "}
              <Link style={linkStyle} to="/profile">
                Completar em Meu perfil
              </Link>
            </p>
          ) : null}
        </article>
        <article style={cardStyle}>
          <strong>4. Operação</strong>
          <p style={mutedStyle}>
            Depois disso, você já pode registrar abastecimentos e manutenções.
          </p>
          <div style={actionsStyle}>
            <Link style={linkStyle} to="/fuels">
              Novo abastecimento
            </Link>
            <Link style={linkStyle} to="/maintenance">
              Nova manutenção
            </Link>
          </div>
        </article>
      </section>
    </AppShell>
  );
}

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "1rem"
};

const cardStyle: CSSProperties = {
  padding: "1.2rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.18)"
};

const mutedStyle: CSSProperties = {
  color: "#cbd5e1"
};

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: "1rem",
  flexWrap: "wrap"
};

const linkStyle: CSSProperties = {
  color: "#fbbf24"
};

const pendingStyle: CSSProperties = {
  margin: "0.5rem 0 0",
  color: "#fda4af",
  fontSize: "0.88rem"
};
