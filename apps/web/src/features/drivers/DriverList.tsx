import type { CSSProperties } from "react";

import type { AccountType, DriverListItem, VehicleListItem } from "@fleet/shared-types";

import { ActionMenu } from "../../components/ActionMenu";
import { resolveMediaUrl } from "../../lib/media";
import { DriverStatusPill } from "./DriverStatusPill";

function DriverAvatar({ driver, muted }: { driver: DriverListItem; muted?: boolean }) {
  const initial = driver.fullName.slice(0, 1).toUpperCase();
  const style = { ...avatarStyle, ...(muted ? avatarMutedStyle : null) };

  if (driver.photoDataUrl) {
    return <img src={resolveMediaUrl(driver.photoDataUrl)} alt={driver.fullName} style={style} />;
  }

  return (
    <div style={{ ...style, ...avatarFallbackStyle, ...(muted ? avatarFallbackMutedStyle : null) }}>
      {initial}
    </div>
  );
}

export function DriverList({
  accountType,
  drivers,
  vehicles,
  muted,
  onView,
  onEdit,
  onSetVacation,
  onActivate,
  onTerminate,
  onPromoteToManager,
  onDemoteToDriver
}: {
  accountType?: AccountType;
  drivers: DriverListItem[];
  vehicles: VehicleListItem[];
  /** Visually de-emphasizes cards — used for the terminated-drivers roster. */
  muted?: boolean;
  onView?: (driver: DriverListItem) => void;
  onEdit?: (driver: DriverListItem) => void;
  onSetVacation?: (driver: DriverListItem) => void;
  onActivate?: (driver: DriverListItem) => void;
  onTerminate?: (driver: DriverListItem) => void;
  onPromoteToManager?: (driver: DriverListItem) => void;
  onDemoteToDriver?: (driver: DriverListItem) => void;
}) {
  const isCompany = accountType === "COMPANY";
  function getVehicleLabel(driver: DriverListItem) {
    const assignedVehicle = vehicles.find((vehicle) => vehicle.id === driver.assignedVehicleIds[0]);
    return assignedVehicle ? `${assignedVehicle.plate} • ${assignedVehicle.model}` : "Sem veículo fixo";
  }

  return (
    <section style={listStyle}>
      {drivers.map((driver) => (
        <article
          key={driver.id}
          className="driver-card"
          style={{ ...cardStyle, ...(muted ? cardMutedStyle : null) }}
        >
          <div style={headerStyle}>
            <DriverAvatar driver={driver} muted={muted} />
            <div style={identityStyle}>
              <strong style={nameStyle}>{driver.fullName}</strong>
              <p style={mutedStyle}>
                {isCompany
                  ? `Matrícula ${driver.registrationId ?? "não informada"}`
                  : `CPF ${driver.cpf ?? "não informado"}`}
              </p>
            </div>
            <ActionMenu
              actions={[
                ...(onView ? [{ label: "Visualizar motorista", onSelect: () => onView(driver) }] : []),
                ...(onEdit && driver.employmentStatus !== "TERMINATED"
                  ? [{ label: "Editar motorista", onSelect: () => onEdit(driver) }]
                  : []),
                ...(isCompany && driver.employmentStatus === "ACTIVE" && onSetVacation
                  ? [
                      {
                        label: "Colocar em férias",
                        onSelect: () => onSetVacation(driver)
                      }
                    ]
                  : []),
                // Termination is permanent (the driver's personal data is
                // anonymized when they're desligado) — only a VACATION
                // driver can be reactivated, not a TERMINATED one.
                ...(isCompany && driver.employmentStatus === "VACATION" && onActivate
                  ? [{ label: "Reativar motorista", onSelect: () => onActivate(driver) }]
                  : []),
                ...(isCompany && driver.employmentStatus !== "TERMINATED" && onTerminate
                  ? [{ label: "Desligar motorista", danger: true, onSelect: () => onTerminate(driver) }]
                  : []),
                ...(driver.accountRole === "MANAGER" && onDemoteToDriver
                  ? [{ label: "Rebaixar a Motorista", onSelect: () => onDemoteToDriver(driver) }]
                  : []),
                ...(driver.accountRole !== "MANAGER" &&
                driver.loginEmail &&
                driver.hasCompletedFirstLogin &&
                onPromoteToManager
                  ? [{ label: "Promover a Gestor", onSelect: () => onPromoteToManager(driver) }]
                  : [])
              ]}
            />
          </div>
          <div style={badgeRowStyle}>
            <DriverStatusPill status={driver.employmentStatus} />
            {driver.accountRole === "MANAGER" ? <span style={managerBadgeStyle}>Gestor</span> : null}
            {driver.loginEmail && !driver.hasCompletedFirstLogin ? (
              <span style={pendingBadgeStyle}>Pendente</span>
            ) : null}
          </div>
          <div style={vehicleRowStyle}>
            <span style={vehicleLabelStyle}>Veículo</span>
            <span style={vehicleValueStyle}>{getVehicleLabel(driver)}</span>
          <div style={headerStyle}>
            {driver.photoDataUrl ? (
              <DriverAvatar photoDataUrl={driver.photoDataUrl} fullName={driver.fullName} />
            ) : (
              <div style={avatarFallbackStyle}>{driver.fullName.slice(0, 1).toUpperCase()}</div>
            )}
            <div style={identityStyle}>
              <div style={nameRowStyle}>
                <strong style={{ fontSize: "1.05rem" }}>{driver.fullName}</strong>
                {driver.accountRole === "MANAGER" ? <span style={managerBadgeStyle}>Gestor</span> : null}
                {driver.loginEmail && !driver.hasCompletedFirstLogin ? (
                  <span style={pendingBadgeStyle}>Pendente</span>
                ) : null}
              </div>
              <p style={mutedStyle}>
                {isCompany
                  ? `Matrícula: ${driver.registrationId ?? "Não informada"}`
                  : `CPF: ${driver.cpf ?? "Não informado"}`}
              </p>
              <p style={statusTextStyle}>{getStatusLabel(driver.employmentStatus)}</p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

const listStyle: CSSProperties = {
  display: "grid",
  gap: "1.1rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(272px, 1fr))"
};

const cardStyle: CSSProperties = {
  padding: "1.25rem",
  borderRadius: "1.25rem",
  background: "linear-gradient(180deg, rgba(30, 41, 59, 0.55), rgba(15, 23, 42, 0.55))",
  border: "1px solid rgba(148, 163, 184, 0.14)",
  boxShadow: "0 1px 0 rgba(255, 255, 255, 0.02) inset, 0 12px 24px rgba(2, 6, 23, 0.18)",
  minHeight: "100%",
  position: "relative",
  overflow: "visible",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease"
};

const cardMutedStyle: CSSProperties = {
  background: "rgba(15, 23, 42, 0.32)",
  boxShadow: "none"
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.9rem"
};

const identityStyle: CSSProperties = {
  display: "grid",
  gap: "0.3rem",
  minWidth: 0,
  flex: 1
};

const nameStyle: CSSProperties = {
  fontSize: "1.08rem",
  fontWeight: 700,
  letterSpacing: "-0.01em",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};

const badgeRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
  flexWrap: "wrap",
  marginTop: "0.9rem"
};

const managerBadgeStyle: CSSProperties = {
  padding: "0.2rem 0.55rem",
  borderRadius: "999px",
  background: "rgba(251, 191, 36, 0.14)",
  color: "#fbbf24",
  fontSize: "0.68rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em"
};

const pendingBadgeStyle: CSSProperties = {
  padding: "0.2rem 0.55rem",
  borderRadius: "999px",
  background: "rgba(148, 163, 184, 0.14)",
  color: "#cbd5e1",
  fontSize: "0.68rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em"
};

const mutedStyle: CSSProperties = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "0.88rem"
};

const vehicleRowStyle: CSSProperties = {
  marginTop: "1rem",
  paddingTop: "0.85rem",
  borderTop: "1px solid rgba(148, 163, 184, 0.12)",
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: "0.6rem"
};

const vehicleLabelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "0.78rem",
  flexShrink: 0
};

const vehicleValueStyle: CSSProperties = {
  color: "#cbd5e1",
  fontSize: "0.88rem",
  fontWeight: 600,
  textAlign: "right",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};

const avatarStyle: CSSProperties = {
  width: "58px",
  height: "58px",
  flexShrink: 0,
  borderRadius: "999px",
  objectFit: "cover",
  border: "2px solid rgba(148, 163, 184, 0.18)"
};

const avatarMutedStyle: CSSProperties = {
  filter: "grayscale(0.6)",
  opacity: 0.75
};

const avatarFallbackStyle: CSSProperties = {
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(160deg, rgba(251, 191, 36, 0.24), rgba(251, 191, 36, 0.08))",
  color: "#fbbf24",
  fontWeight: 800,
  fontSize: "1.15rem"
};

const avatarFallbackMutedStyle: CSSProperties = {
  background: "rgba(148, 163, 184, 0.12)",
  color: "#94a3b8"
};
