import type { CSSProperties } from "react";
import { useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import type { DriverListItem, FuelLogItem, VehicleListItem } from "@fleet/shared-types";

import { EmptyState, ErrorState, LoadingState } from "../components/ScreenState";
import { useAuth } from "../contexts/AuthContext";
import { usePageMeta } from "../hooks/usePageMeta";
import { formatPlate } from "../lib/masks";
import { DRIVERS_QUERY, FUEL_LOGS_QUERY, VEHICLES_QUERY } from "../lib/queries";

const legacyAliasPattern = /^[A-Z]{3} D\d{3}$/;

export function AdminReportPage() {
  usePageMeta(
    "Relatório administrativo",
    "Rota técnica para verificar duplicidades, estados operacionais e vestígios de dados legados."
  );
  const { auth } = useAuth();
  const tenantId = auth?.tenantId ?? "";

  const vehiclesQuery = useQuery<{ vehicles: VehicleListItem[] }>(VEHICLES_QUERY, {
    skip: !tenantId,
    variables: { tenantId }
  });
  const driversQuery = useQuery<{ drivers: DriverListItem[] }>(DRIVERS_QUERY, {
    skip: !tenantId,
    variables: { tenantId }
  });
  const fuelLogsQuery = useQuery<{ fuelLogs: FuelLogItem[] }>(FUEL_LOGS_QUERY, {
    skip: !tenantId,
    variables: { tenantId }
  });

  const vehicles = vehiclesQuery.data?.vehicles ?? [];
  const drivers = driversQuery.data?.drivers ?? [];
  const fuelLogs = fuelLogsQuery.data?.fuelLogs ?? [];

  const duplicatePlateGroups = useMemo(() => {
    const grouped = new Map<string, VehicleListItem[]>();
    vehicles.forEach((vehicle) => {
      const current = grouped.get(vehicle.plate) ?? [];
      current.push(vehicle);
      grouped.set(vehicle.plate, current);
    });

    return Array.from(grouped.entries())
      .filter(([, items]) => items.length > 1)
      .map(([plate, items]) => ({
        plate,
        vehicles: items.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      }))
      .sort((left, right) => right.vehicles.length - left.vehicles.length || left.plate.localeCompare(right.plate));
  }, [vehicles]);

  const legacyAliasVehicles = useMemo(
    () => vehicles.filter((vehicle) => legacyAliasPattern.test(vehicle.plate)),
    [vehicles]
  );

  const driverSummary = useMemo(
    () => ({
      active: drivers.filter((driver) => driver.employmentStatus === "ACTIVE").length,
      vacation: drivers.filter((driver) => driver.employmentStatus === "VACATION").length,
      terminated: drivers.filter((driver) => driver.employmentStatus === "TERMINATED").length
    }),
    [drivers]
  );

  const recentFuelLogs = useMemo(() => {
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 30;
    return fuelLogs.filter((item) => new Date(item.fueledAt).getTime() >= cutoff).length;
  }, [fuelLogs]);

  const loading = vehiclesQuery.loading || driversQuery.loading || fuelLogsQuery.loading;
  const error = vehiclesQuery.error ?? driversQuery.error ?? fuelLogsQuery.error;

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <p style={eyebrowStyle}>Painel técnico</p>
          <h1 style={titleStyle}>Relatório administrativo</h1>
          <p style={descriptionStyle}>
            Rota simples para verificar duplicidades, estados operacionais e vestígios de dados legados.
          </p>
        </div>
      </section>

      {loading ? <LoadingState message="Montando relatório técnico..." /> : null}
      {error ? <ErrorState message="Falha ao carregar o relatório administrativo." detail={error.message} /> : null}

      {!loading && !error ? (
        <>
          <section style={statsGridStyle}>
            <article style={cardStyle}>
              <span style={labelStyle}>Veículos na conta</span>
              <strong style={valueStyle}>{vehicles.length}</strong>
            </article>
            <article style={cardStyle}>
              <span style={labelStyle}>Grupos com placa duplicada</span>
              <strong style={valueStyle}>{duplicatePlateGroups.length}</strong>
            </article>
            <article style={cardStyle}>
              <span style={labelStyle}>Abastecimentos 30 dias</span>
              <strong style={valueStyle}>{recentFuelLogs}</strong>
            </article>
            <article style={cardStyle}>
              <span style={labelStyle}>Placas legadas renomeadas</span>
              <strong style={valueStyle}>{legacyAliasVehicles.length}</strong>
            </article>
          </section>

          <section style={splitGridStyle}>
            <article style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <h2 style={panelTitleStyle}>Motoristas por status</h2>
                  <p style={panelTextStyle}>Leitura rápida do quadro atual.</p>
                </div>
              </div>
              <div style={statusGridStyle}>
                <div style={statusCardStyle}>
                  <span style={labelStyle}>Ativos</span>
                  <strong style={valueStyle}>{driverSummary.active}</strong>
                </div>
                <div style={statusCardStyle}>
                  <span style={labelStyle}>Férias</span>
                  <strong style={valueStyle}>{driverSummary.vacation}</strong>
                </div>
                <div style={statusCardStyle}>
                  <span style={labelStyle}>Desligados</span>
                  <strong style={valueStyle}>{driverSummary.terminated}</strong>
                </div>
              </div>
            </article>

            <article style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <h2 style={panelTitleStyle}>Placas legadas renomeadas</h2>
                  <p style={panelTextStyle}>Idealmente este bloco deve ficar vazio.</p>
                </div>
              </div>
              {legacyAliasVehicles.length ? (
                <div style={listStyle}>
                  {legacyAliasVehicles.map((vehicle) => (
                    <div key={vehicle.id} style={rowStyle}>
                      <strong>{formatPlate(vehicle.plate)}</strong>
                      <span style={mutedTextStyle}>
                        {vehicle.brand} {vehicle.model}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="Nenhum alias legado detectado nesta conta." />
              )}
            </article>
          </section>

          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <h2 style={panelTitleStyle}>Placas duplicadas na conta</h2>
                <p style={panelTextStyle}>
                  Visão simples para validar o comportamento enquanto a regra global continua desligada.
                </p>
              </div>
            </div>
            {duplicatePlateGroups.length ? (
              <div style={listStyle}>
                {duplicatePlateGroups.map((group) => (
                  <article key={group.plate} style={duplicateGroupStyle}>
                    <div style={duplicateHeaderStyle}>
                      <strong>{formatPlate(group.plate)}</strong>
                      <span style={badgeStyle}>{group.vehicles.length} registros</span>
                    </div>
                    <div style={duplicateItemsStyle}>
                      {group.vehicles.map((vehicle) => (
                        <div key={vehicle.id} style={rowStyle}>
                          <strong>
                            {vehicle.brand} {vehicle.model}
                          </strong>
                          <span style={mutedTextStyle}>
                            {vehicle.status} • KM {vehicle.currentKm.toLocaleString("pt-BR")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState message="Nenhuma placa duplicada encontrada nesta conta." />
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}

const pageStyle: CSSProperties = {
  display: "grid",
  gap: "1.25rem",
  padding: "1.5rem",
  color: "#e2e8f0"
};

const heroStyle: CSSProperties = {
  padding: "1.35rem 1.4rem",
  borderRadius: "1.25rem",
  background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.78))",
  border: "1px solid rgba(148, 163, 184, 0.16)"
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  color: "#38bdf8",
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  fontSize: "0.72rem"
};

const titleStyle: CSSProperties = {
  margin: "0.4rem 0 0",
  fontSize: "2rem"
};

const descriptionStyle: CSSProperties = {
  margin: "0.5rem 0 0",
  color: "#94a3b8",
  maxWidth: "54rem"
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gap: "1rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))"
};

const splitGridStyle: CSSProperties = {
  display: "grid",
  gap: "1rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))"
};

const statusGridStyle: CSSProperties = {
  display: "grid",
  gap: "0.85rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))"
};

const cardStyle: CSSProperties = {
  padding: "1rem 1.1rem",
  borderRadius: "1rem",
  border: "1px solid rgba(148, 163, 184, 0.14)",
  background: "rgba(15, 23, 42, 0.54)"
};

const statusCardStyle: CSSProperties = {
  ...cardStyle,
  background: "rgba(30, 41, 59, 0.52)"
};

const panelStyle: CSSProperties = {
  padding: "1.1rem",
  borderRadius: "1rem",
  border: "1px solid rgba(148, 163, 184, 0.14)",
  background: "rgba(15, 23, 42, 0.5)",
  display: "grid",
  gap: "1rem"
};

const panelHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  alignItems: "flex-start"
};

const panelTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "1.05rem"
};

const panelTextStyle: CSSProperties = {
  margin: "0.35rem 0 0",
  color: "#94a3b8"
};

const labelStyle: CSSProperties = {
  display: "block",
  color: "#94a3b8",
  fontSize: "0.9rem"
};

const valueStyle: CSSProperties = {
  display: "block",
  marginTop: "0.55rem",
  fontSize: "1.7rem"
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: "0.8rem"
};

const rowStyle: CSSProperties = {
  display: "grid",
  gap: "0.2rem",
  padding: "0.85rem 0.95rem",
  borderRadius: "0.9rem",
  background: "rgba(30, 41, 59, 0.5)",
  border: "1px solid rgba(148, 163, 184, 0.12)"
};

const mutedTextStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: "0.92rem"
};

const duplicateGroupStyle: CSSProperties = {
  display: "grid",
  gap: "0.85rem",
  padding: "1rem",
  borderRadius: "1rem",
  border: "1px solid rgba(251, 191, 36, 0.18)",
  background: "rgba(51, 65, 85, 0.42)"
};

const duplicateHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "0.8rem",
  alignItems: "center"
};

const duplicateItemsStyle: CSSProperties = {
  display: "grid",
  gap: "0.7rem"
};

const badgeStyle: CSSProperties = {
  padding: "0.3rem 0.6rem",
  borderRadius: "999px",
  background: "rgba(251, 191, 36, 0.14)",
  color: "#fde68a",
  fontSize: "0.82rem"
};
