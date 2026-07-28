import type { CSSProperties } from "react";

import type { MaintenanceItem } from "@fleet/shared-types";
import { formatMaintenanceType } from "../../lib/maintenance";

export function MaintenanceDetailsPanel({ item }: { item: MaintenanceItem }) {
  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <h3 style={{ margin: 0 }}>{item.title}</h3>
          <p style={mutedStyle}>
            {item.vehicleLabel} • {new Date(item.performedAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <span style={badgeStyle}>R$ {item.totalCost.toFixed(2)}</span>
      </div>
      <div style={gridStyle}>
        <DetailItem label="Tipo" value={formatMaintenanceType(item.maintenanceType)} />
        <DetailItem label="KM" value={item.odometerKm.toLocaleString("pt-BR")} />
        <DetailItem label="Fornecedor" value={item.supplierName ?? "Não informado"} />
        <DetailItem
          label="Próxima data"
          value={
            item.nextMaintenanceAt
              ? new Date(item.nextMaintenanceAt).toLocaleDateString("pt-BR")
              : "Não informada"
          }
        />
        <DetailItem
          label="Próximo KM"
          value={item.nextMaintenanceKm?.toLocaleString("pt-BR") ?? "Não informado"}
        />
      </div>
      {item.notes ? (
        <div style={sectionStyle}>
          <span style={detailLabelStyle}>Observações</span>
          <strong>{item.notes}</strong>
        </div>
      ) : null}
      <div style={sectionStyle}>
        <span style={detailLabelStyle}>Detalhes técnicos</span>
        <strong>{describeMaintenance(item)}</strong>
      </div>
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={detailCardStyle}>
      <span style={detailLabelStyle}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function describeMaintenance(item: MaintenanceItem) {
  if (item.maintenanceType === "OIL_CHANGE") {
    return [
      `${item.oilBrand ?? "Óleo"} ${item.oilType ?? ""}`.trim(),
      item.changedOilFilter ? "Filtro de óleo trocado" : null,
      item.changedAirFilter ? "Filtro de ar trocado" : null,
      item.changedFuelFilter ? "Filtro de combustível trocado" : null
    ]
      .filter(Boolean)
      .join(" • ");
  }

  if (item.maintenanceType === "TIRES") {
    return `${item.tireQuantity ?? 0} pneu(s) ${item.tireBrand ?? ""}`.trim();
  }

  if (item.maintenanceType === "BATTERY") {
    return `${item.batteryBrand ?? "Bateria"} ${item.batteryVoltage ?? ""}`.trim();
  }

  if (item.maintenanceType === "BRAKES") {
    return item.brakeService ?? "Serviço de freios";
  }

  if (item.maintenanceType === "OTHER_PARTS") {
    return `${item.partName ?? "Peça"} ${item.partBrand ?? ""}`.trim();
  }

  return item.notes ?? "Sem detalhes adicionais";
}

const panelStyle: CSSProperties = {
  display: "grid",
  gap: "1rem"
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  alignItems: "flex-start"
};

const gridStyle: CSSProperties = {
  display: "grid",
  gap: "0.85rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))"
};

const detailCardStyle: CSSProperties = {
  padding: "0.95rem",
  borderRadius: "1rem",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  background: "rgba(15, 23, 42, 0.5)",
  display: "grid",
  gap: "0.3rem"
};

const detailLabelStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: "0.86rem"
};

const sectionStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  background: "rgba(15, 23, 42, 0.5)",
  display: "grid",
  gap: "0.35rem"
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
  margin: "0.35rem 0 0",
  color: "#94a3b8"
};
