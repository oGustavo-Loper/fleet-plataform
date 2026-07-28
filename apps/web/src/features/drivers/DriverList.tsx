import type { CSSProperties } from "react";

import type { AccountType, DriverListItem, VehicleListItem } from "@fleet/shared-types";

import { ActionMenu } from "../../components/ActionMenu";
import { resolveMediaUrl } from "../../lib/media";

export function DriverList({
  accountType,
  drivers,
  vehicles,
  onView,
  onEdit,
  onSetVacation,
  onActivate,
  onTerminate
}: {
  accountType?: AccountType;
  drivers: DriverListItem[];
  vehicles: VehicleListItem[];
  onView?: (driver: DriverListItem) => void;
  onEdit?: (driver: DriverListItem) => void;
  onSetVacation?: (driver: DriverListItem) => void;
  onActivate?: (driver: DriverListItem) => void;
  onTerminate?: (driver: DriverListItem) => void;
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
          style={{
            ...cardStyle,
            borderColor:
              driver.employmentStatus === "ACTIVE"
                ? "rgba(74, 222, 128, 0.36)"
                : driver.employmentStatus === "VACATION"
                  ? "rgba(248, 113, 113, 0.3)"
                  : "rgba(148, 163, 184, 0.26)"
          }}
        >
          <div style={topRowStyle}>
            <span
              style={{
                ...statusDotStyle,
                background:
                  driver.employmentStatus === "ACTIVE"
                    ? "#4ade80"
                    : driver.employmentStatus === "VACATION"
                      ? "#f87171"
                      : "#94a3b8"
              }}
            />
            <ActionMenu
              actions={[
                ...(onView ? [{ label: "Visualizar motorista", onSelect: () => onView(driver) }] : []),
                ...(onEdit ? [{ label: "Editar motorista", onSelect: () => onEdit(driver) }] : []),
                ...(driver.employmentStatus === "ACTIVE" && onSetVacation
                  ? [
                      {
                        label: "Colocar em férias",
                        onSelect: () => onSetVacation(driver)
                      }
                    ]
                  : []),
                ...(driver.employmentStatus !== "ACTIVE" && onActivate
                  ? [{ label: "Reativar motorista", onSelect: () => onActivate(driver) }]
                  : []),
                ...(driver.employmentStatus !== "TERMINATED" && onTerminate
                  ? [{ label: "Desligar motorista", danger: true, onSelect: () => onTerminate(driver) }]
                  : [])
              ]}
            />
          </div>
          <div style={headerStyle}>
            {driver.photoDataUrl ? (
              <img
                src={resolveMediaUrl(driver.photoDataUrl)}
                alt={driver.fullName}
                style={avatarStyle}
              />
            ) : (
              <div style={avatarFallbackStyle}>{driver.fullName.slice(0, 1).toUpperCase()}</div>
            )}
            <div style={identityStyle}>
              <strong style={{ fontSize: "1.05rem" }}>{driver.fullName}</strong>
              <p style={mutedStyle}>
                {isCompany
                  ? `Matrícula: ${driver.registrationId ?? "Não informada"}`
                  : `CPF: ${driver.cpf ?? "Não informado"}`}
              </p>
              <p style={statusTextStyle}>{getStatusLabel(driver.employmentStatus)}</p>
            </div>
          </div>
          <p style={supportingTextStyle}>{getVehicleLabel(driver)}</p>
        </article>
      ))}
    </section>
  );
}

function getStatusLabel(status: DriverListItem["employmentStatus"]) {
  if (status === "VACATION") {
    return "Em férias";
  }
  if (status === "TERMINATED") {
    return "Desligado";
  }
  return "Ativo";
}

const listStyle: CSSProperties = {
  display: "grid",
  gap: "1rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))"
};

const cardStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  minHeight: "100%",
  position: "relative",
  overflow: "visible"
};

const topRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "0.85rem"
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.85rem"
};

const identityStyle: CSSProperties = {
  display: "grid",
  gap: "0.25rem"
};

const mutedStyle: CSSProperties = {
  margin: 0,
  color: "#94a3b8"
};

const statusTextStyle: CSSProperties = {
  margin: 0,
  color: "#cbd5e1",
  fontSize: "0.9rem"
};

const supportingTextStyle: CSSProperties = {
  margin: "0.95rem 0 0",
  color: "#94a3b8"
};

const statusDotStyle: CSSProperties = {
  width: "0.65rem",
  height: "0.65rem",
  borderRadius: "999px"
};

const avatarStyle: CSSProperties = {
  width: "54px",
  height: "54px",
  borderRadius: "999px",
  objectFit: "cover",
  border: "1px solid rgba(148, 163, 184, 0.18)"
};

const avatarFallbackStyle: CSSProperties = {
  ...avatarStyle,
  display: "grid",
  placeItems: "center",
  background: "rgba(251, 191, 36, 0.14)",
  color: "#fbbf24",
  fontWeight: 800
};
