import type { CSSProperties } from "react";

import type { FuelLogItem, FuelType } from "@fleet/shared-types";
import { ActionMenu } from "../../components/ActionMenu";
import { formatCurrency } from "../../lib/currency";

const fuelTypeLabel: Record<FuelType, string> = {
  GASOLINE: "Gasolina",
  ETHANOL: "Etanol",
  DIESEL: "Diesel",
  FLEX: "Flex",
  ELECTRIC: "Elétrico",
  HYBRID: "Híbrido"
};

export function FuelList({
  items,
  onView
}: {
  items: FuelLogItem[];
  onView?: (item: FuelLogItem) => void;
}) {
  return (
    <section style={listStyle}>
      {items.map((item) => (
        <article key={item.id} className="list-card" style={cardStyle}>
          <div style={headerStyle}>
            <div style={identityStyle}>
              <strong style={nameStyle}>{item.vehicleLabel}</strong>
              <p style={mutedStyle}>
                {new Date(item.fueledAt).toLocaleDateString("pt-BR")}
                {item.stationName ? ` • ${item.stationName}` : ""}
              </p>
            </div>
            {onView ? (
              <ActionMenu actions={[{ label: "Ver detalhes", onSelect: () => onView(item) }]} />
            ) : null}
          </div>
          <div style={badgeRowStyle}>
            <span style={fuelBadgeStyle}>{fuelTypeLabel[item.fuelType]}</span>
            {item.driverName ? <span style={driverBadgeStyle}>{item.driverName}</span> : null}
          </div>
          <div style={footerRowStyle}>
            <span style={footerLabelStyle}>Total</span>
            <span style={footerValueStyle}>{formatCurrency(item.totalCost)}</span>
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
  fontSize: "0.88rem",
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

const fuelBadgeStyle: CSSProperties = {
  padding: "0.3rem 0.65rem",
  borderRadius: "999px",
  background: "rgba(56, 189, 248, 0.14)",
  color: "#7dd3fc",
  fontSize: "0.72rem",
  fontWeight: 700
};

const driverBadgeStyle: CSSProperties = {
  padding: "0.2rem 0.55rem",
  borderRadius: "999px",
  background: "rgba(148, 163, 184, 0.14)",
  color: "#cbd5e1",
  fontSize: "0.68rem",
  fontWeight: 700
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
  color: "#fbbf24",
  fontSize: "0.95rem",
  fontWeight: 700,
  textAlign: "right",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};
