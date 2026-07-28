import type { CSSProperties } from "react";

import type { VehicleListItem } from "@fleet/shared-types";

import { ActionMenu } from "../../components/ActionMenu";
import { formatPlate } from "../../lib/masks";

const vehicleTypeLabel: Record<VehicleListItem["vehicleType"], string> = {
  CAR: "Carro",
  MOTORCYCLE: "Moto",
  TRUCK: "Caminhão",
  BUS: "Ônibus"
};

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
        <article key={vehicle.id} style={cardStyle}>
          <div style={topRowStyle}>
            <div style={identityStyle}>
              <strong style={{ fontSize: "1.1rem" }}>
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
          <p style={supportingStyle}>
            {vehicleTypeLabel[vehicle.vehicleType]} • {vehicle.status}
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
  gap: "0.15rem"
};

const mutedStyle: CSSProperties = {
  margin: "0.35rem 0 0",
  color: "#94a3b8"
};

const supportingStyle: CSSProperties = {
  margin: "0.95rem 0 0",
  color: "#94a3b8"
};
