import type { CSSProperties } from "react";

import type { FuelLogItem } from "@fleet/shared-types";
import { ActionMenu } from "../../components/ActionMenu";

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
        <article key={item.id} style={cardStyle}>
          <div style={topRowStyle}>
            <div style={identityStyle}>
              <strong>{item.vehicleLabel}</strong>
            </div>
            {onView ? <ActionMenu actions={[{ label: "Ver detalhes", onSelect: () => onView(item) }]} /> : null}
          </div>
          <p style={secondaryTextStyle}>
            Data: {new Date(item.fueledAt).toLocaleDateString("pt-BR")}
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

const mutedStyle: CSSProperties = {
  margin: 0,
  color: "#94a3b8"
};

const secondaryTextStyle: CSSProperties = {
  margin: "0.9rem 0 0",
  color: "#cbd5e1"
};
