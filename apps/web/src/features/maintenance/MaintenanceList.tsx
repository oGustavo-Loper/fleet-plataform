import type { CSSProperties } from "react";

import type { MaintenanceItem } from "@fleet/shared-types";
import { ActionMenu } from "../../components/ActionMenu";
import { formatMaintenanceType } from "../../lib/maintenance";

export function MaintenanceList({
  items,
  onView
}: {
  items: MaintenanceItem[];
  onView?: (item: MaintenanceItem) => void;
}) {
  return (
    <section style={listStyle}>
      {items.map((item) => (
        <article key={item.id} style={cardStyle}>
          <div style={topRowStyle}>
            <div style={identityStyle}>
              <strong>{item.title}</strong>
              <p style={mutedStyle}>{item.vehicleLabel}</p>
            </div>
            <div style={actionsStyle}>
              <span style={badgeStyle}>R$ {item.totalCost.toFixed(2)}</span>
              {onView ? <ActionMenu actions={[{ label: "Ver detalhes", onSelect: () => onView(item) }]} /> : null}
            </div>
          </div>
          <p style={mutedStyle}>
            {new Date(item.performedAt).toLocaleDateString("pt-BR")} • {formatMaintenanceType(item.maintenanceType)}
          </p>
        </article>
      ))}
    </section>
  );
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
  position: "relative",
  overflow: "visible"
};

const topRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  alignItems: "flex-start"
};

const identityStyle: CSSProperties = {
  display: "grid",
  gap: "0.2rem"
};

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: "0.6rem",
  alignItems: "flex-start"
};

const badgeStyle: CSSProperties = {
  padding: "0.35rem 0.6rem",
  borderRadius: "999px",
  background: "rgba(251, 191, 36, 0.14)",
  color: "#fbbf24",
  fontSize: "0.82rem",
  height: "fit-content"
};

const mutedStyle: CSSProperties = {
  margin: "0.9rem 0 0",
  color: "#94a3b8"
};
