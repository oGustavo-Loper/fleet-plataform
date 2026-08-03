import type { CSSProperties } from "react";

import type { FuelLogItem } from "@fleet/shared-types";
import { formatCurrency } from "../../lib/currency";
import { resolveMediaUrl } from "../../lib/media";

export function FuelDetailsPanel({ item }: { item: FuelLogItem }) {
  const hasCoordinates = item.fuelingLatitude != null && item.fuelingLongitude != null;

  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <h3 style={{ margin: 0 }}>{item.vehicleLabel}</h3>
          <p style={mutedStyle}>
            {new Date(item.fueledAt).toLocaleDateString("pt-BR")} • {item.fuelType}
          </p>
        </div>
        <span style={badgeStyle}>{formatCurrency(item.totalCost)}</span>
      </div>
      <div style={gridStyle}>
        <DetailItem label="Litros" value={item.liters.toFixed(2)} />
        <DetailItem label="Valor por litro" value={formatCurrency(item.pricePerLiter)} />
        <DetailItem label="KM atual" value={item.odometerKm.toLocaleString("pt-BR")} />
        <DetailItem label="Motorista" value={item.driverName ?? "Não informado"} />
        <DetailItem label="KM rodado" value={item.distanceKm.toLocaleString("pt-BR")} />
        <DetailItem label="Média" value={`${item.averageConsumption.toFixed(2)} km/l`} />
        <DetailItem label="KM anterior" value={item.previousKm?.toLocaleString("pt-BR") ?? "Não informado"} />
        <DetailItem label="Posto" value={item.stationName ?? "Não informado"} />
      </div>
      {item.fuelingAddress || hasCoordinates ? (
        <div style={addressPanelStyle}>
          <span style={detailLabelStyle}>Endereço</span>
          <strong>{item.fuelingAddress ?? "Localização capturada"}</strong>
          {hasCoordinates ? (
            <>
              <iframe
                title="Local do abastecimento"
                style={mapFrameStyle}
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${item.fuelingLongitude! - 0.006}%2C${item.fuelingLatitude! - 0.004}%2C${item.fuelingLongitude! + 0.006}%2C${item.fuelingLatitude! + 0.004}&marker=${item.fuelingLatitude}%2C${item.fuelingLongitude}&layer=mapnik`}
              />
              <a
                href={`https://www.google.com/maps?q=${item.fuelingLatitude},${item.fuelingLongitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={mapLinkStyle}
              >
                Abrir em tela cheia
              </a>
            </>
          ) : null}
        </div>
      ) : null}
      {item.notes ? (
        <div style={addressPanelStyle}>
          <span style={detailLabelStyle}>Observações</span>
          <strong>{item.notes}</strong>
        </div>
      ) : null}
      {item.receiptPhotoDataUrl ? (
        <img src={resolveMediaUrl(item.receiptPhotoDataUrl)} alt="Comprovante" style={receiptStyle} />
      ) : null}
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

const addressPanelStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  background: "rgba(15, 23, 42, 0.5)",
  display: "grid",
  gap: "0.35rem"
};

const mapLinkStyle: CSSProperties = {
  color: "#fbbf24",
  fontSize: "0.86rem",
  justifySelf: "start"
};

const mapFrameStyle: CSSProperties = {
  width: "100%",
  height: "220px",
  border: 0,
  borderRadius: "0.85rem"
};

const receiptStyle: CSSProperties = {
  width: "100%",
  maxHeight: "280px",
  objectFit: "cover",
  borderRadius: "1rem",
  border: "1px solid rgba(148, 163, 184, 0.2)"
};

const badgeStyle: CSSProperties = {
  padding: "0.35rem 0.6rem",
  borderRadius: "999px",
  background: "rgba(56, 189, 248, 0.14)",
  color: "#7dd3fc",
  fontSize: "0.82rem",
  height: "fit-content"
};

const mutedStyle: CSSProperties = {
  margin: "0.35rem 0 0",
  color: "#94a3b8"
};
