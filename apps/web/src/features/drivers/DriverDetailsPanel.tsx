import type { CSSProperties } from "react";
import type { AccountType, DriverListItem, VehicleListItem } from "@fleet/shared-types";

import { resolveMediaUrl } from "../../lib/media";
import { formatCpf } from "../../lib/masks";
import { DriverStatusPill } from "./DriverStatusPill";

export function DriverDetailsPanel({
  accountType,
  driver,
  vehicles
}: {
  accountType?: AccountType;
  driver: DriverListItem;
  vehicles: VehicleListItem[];
}) {
  const isCompany = accountType === "COMPANY";
  const assignedVehicle = vehicles.find((vehicle) => vehicle.id === driver.assignedVehicleIds[0]);

  return (
    <section style={detailsPanelStyle}>
      <div style={detailsHeaderStyle}>
        {driver.photoDataUrl ? (
          <img
            src={resolveMediaUrl(driver.photoDataUrl)}
            alt={driver.fullName}
            style={detailsAvatarStyle}
          />
        ) : (
          <div style={detailsAvatarFallbackStyle}>{driver.fullName.slice(0, 1).toUpperCase()}</div>
        )}
        <div style={detailsIdentityStyle}>
          <h3 style={{ margin: 0 }}>{driver.fullName}</h3>
          <p style={detailsMutedStyle}>
            {isCompany
              ? `Matrícula ${driver.registrationId ?? "Não informada"}`
              : `CPF ${driver.cpf ? formatCpf(driver.cpf) : "Não informado"}`}
          </p>
          <DriverStatusPill status={driver.employmentStatus} />
        </div>
      </div>
      <div style={detailsGridStyle}>
        <DetailItem label="CNH" value={driver.cnh ?? "Pendente"} />
        <DetailItem label="Categoria" value={driver.cnhCategory ?? "Pendente"} />
        <DetailItem
          label="Validade da CNH"
          value={driver.cnhExpiresAt ? new Date(driver.cnhExpiresAt).toLocaleDateString("pt-BR") : "Pendente"}
        />
        <DetailItem label="Login" value={driver.loginEmail ?? "Não configurado"} />
        <DetailItem
          label="Veículo vinculado"
          value={assignedVehicle ? `${assignedVehicle.plate} • ${assignedVehicle.model}` : "Sem veículo fixo"}
        />
        <DetailItem
          label="Permissão de abastecimento"
          value={driver.allowAnyVehicle ? "Qualquer veículo" : "Somente veículo vinculado"}
        />
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

const detailsPanelStyle: CSSProperties = {
  display: "grid",
  gap: "1rem"
};

const detailsHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1rem"
};

const detailsIdentityStyle: CSSProperties = {
  display: "grid",
  gap: "0.45rem"
};

const detailsAvatarStyle: CSSProperties = {
  width: "76px",
  height: "76px",
  flexShrink: 0,
  borderRadius: "999px",
  objectFit: "cover",
  border: "2px solid rgba(148, 163, 184, 0.18)"
};

const detailsAvatarFallbackStyle: CSSProperties = {
  ...detailsAvatarStyle,
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(160deg, rgba(251, 191, 36, 0.24), rgba(251, 191, 36, 0.08))",
  color: "#fbbf24",
  fontWeight: 800,
  fontSize: "1.4rem"
};

const detailsMutedStyle: CSSProperties = {
  margin: "0.4rem 0 0",
  color: "#94a3b8"
};

const detailsGridStyle: CSSProperties = {
  display: "grid",
  gap: "0.85rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))"
};

const detailCardStyle: CSSProperties = {
  padding: "0.95rem",
  borderRadius: "1rem",
  border: "1px solid rgba(148, 163, 184, 0.14)",
  background: "linear-gradient(180deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.5))",
  display: "grid",
  gap: "0.3rem"
};

const detailLabelStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: "0.86rem"
};
