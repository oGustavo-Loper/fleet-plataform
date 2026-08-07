import type { CSSProperties } from "react";

import type { VehicleListItem, VehicleStatus, VehicleType } from "@fleet/shared-types";

import { ActionMenu } from "../../components/ActionMenu";
import { formatPlate } from "../../lib/masks";

const vehicleTypeLabel: Record<VehicleType, string> = {
  CAR: "Carro",
  MOTORCYCLE: "Moto",
  TRUCK: "Caminhão",
  BUS: "Ônibus"
};

const vehicleTypeIcon: Record<VehicleType, string> = {
  CAR: "🚗",
  MOTORCYCLE: "🏍️",
  TRUCK: "🚚",
  BUS: "🚌"
};

const STATUS_TONE: Record<VehicleStatus, { fg: string; bg: string; border: string; label: string }> = {
  ACTIVE: { fg: "#4ade80", bg: "rgba(74, 222, 128, 0.12)", border: "rgba(74, 222, 128, 0.28)", label: "Ativo" },
  MAINTENANCE: { fg: "#fbbf24", bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.28)", label: "Manutenção" },
  INACTIVE: { fg: "#94a3b8", bg: "rgba(148, 163, 184, 0.12)", border: "rgba(148, 163, 184, 0.24)", label: "Inativo" },
  SOLD: { fg: "#94a3b8", bg: "rgba(148, 163, 184, 0.12)", border: "rgba(148, 163, 184, 0.24)", label: "Vendido" }
};

function VehicleStatusPill({ status }: { status: VehicleStatus }) {
  const tone = STATUS_TONE[status];
  return (
    <span style={{ ...statusPillStyle, color: tone.fg, background: tone.bg, border: `1px solid ${tone.border}` }}>
      <span style={{ ...statusDotStyle, background: tone.fg }} />
      {tone.label}
    </span>
  );
}

export function VehicleList({
  vehicles,
  onEdit
}: {
  vehicles: VehicleListItem[];
  onEdit?: (vehicle: VehicleListItem) => void;
}) {
  return (
    <section style={listStyle}>
      {vehicles.map((vehicle) => (
        <article key={vehicle.id} className="list-card" style={cardStyle}>
          <div style={headerStyle}>
            <div style={typeIconStyle} aria-hidden="true">
              {vehicleTypeIcon[vehicle.vehicleType]}
            </div>
            <div style={identityStyle}>
              <strong style={nameStyle}>
                {vehicle.brand} {vehicle.model}
              </strong>
              <p style={mutedStyle}>{formatPlate(vehicle.plate)}</p>
            </div>
            {onEdit ? (
              <ActionMenu
                actions={[
                  {
                    label: "Editar veículo",
                    onSelect: () => onEdit(vehicle)
                  }
                ]}
              />
            ) : null}
          </div>
          <div style={badgeRowStyle}>
            <VehicleStatusPill status={vehicle.status} />
            <span style={typeBadgeStyle}>{vehicleTypeLabel[vehicle.vehicleType]}</span>
          </div>
          <div style={footerRowStyle}>
            <span style={footerLabelStyle}>KM atual</span>
            <span style={footerValueStyle}>{vehicle.currentKm.toLocaleString("pt-BR")}</span>
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
  position: "relative",
  overflow: "visible",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease"
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.9rem"
};

const typeIconStyle: CSSProperties = {
  width: "58px",
  height: "58px",
  flexShrink: 0,
  borderRadius: "999px",
  display: "grid",
  placeItems: "center",
  fontSize: "1.5rem",
  background: "linear-gradient(160deg, rgba(251, 191, 36, 0.24), rgba(251, 191, 36, 0.08))",
  border: "2px solid rgba(148, 163, 184, 0.18)"
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

const mutedStyle: CSSProperties = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "0.88rem"
};

const badgeRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
  flexWrap: "wrap",
  marginTop: "0.9rem"
};

const statusPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  padding: "0.3rem 0.65rem 0.3rem 0.55rem",
  borderRadius: "999px",
  fontSize: "0.72rem",
  fontWeight: 700
};

const statusDotStyle: CSSProperties = {
  width: "0.4rem",
  height: "0.4rem",
  borderRadius: "999px"
};

const typeBadgeStyle: CSSProperties = {
  padding: "0.2rem 0.55rem",
  borderRadius: "999px",
  background: "rgba(148, 163, 184, 0.14)",
  color: "#cbd5e1",
  fontSize: "0.68rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em"
};

const footerRowStyle: CSSProperties = {
  marginTop: "1rem",
  paddingTop: "0.85rem",
  borderTop: "1px solid rgba(148, 163, 184, 0.12)",
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: "0.6rem"
};

const footerLabelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "0.78rem",
  flexShrink: 0
};

const footerValueStyle: CSSProperties = {
  color: "#cbd5e1",
  fontSize: "0.88rem",
  fontWeight: 600,
  textAlign: "right",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};
