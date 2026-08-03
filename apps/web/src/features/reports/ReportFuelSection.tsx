import type { CSSProperties } from "react";
import type { VehicleReportFuelItem } from "@fleet/shared-types";

import { PaginationControls } from "../../components/PaginationControls";
import { EmptyState } from "../../components/ScreenState";
import { formatCurrency } from "../../lib/currency";

export function ReportFuelSection({
  items,
  totalItems,
  page,
  totalPages,
  currentCount,
  onPageChange
}: {
  items: VehicleReportFuelItem[];
  totalItems: number;
  page: number;
  totalPages: number;
  currentCount: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>Abastecimentos</h2>
      {items.length > 0 ? (
        <>
          {items.map((item) => (
            <article key={item.id} style={itemCardStyle}>
              <strong>{new Date(item.fueledAt).toLocaleDateString("pt-BR")}</strong>
              <p style={mutedStyle}>
                KM {item.odometerKm.toLocaleString("pt-BR")} • Rodado {item.distanceKm.toLocaleString("pt-BR")} km
                • Média {item.averageConsumption.toFixed(2)} km/l
              </p>
              <p style={mutedStyle}>
                Litros {item.liters.toFixed(2)} • Custo {formatCurrency(item.totalCost)}
              </p>
            </article>
          ))}
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={6}
            currentCount={currentCount}
            onPageChange={onPageChange}
          />
        </>
      ) : (
        <EmptyState message="Nenhum abastecimento no período." />
      )}
    </section>
  );
}

const sectionStyle: CSSProperties = {
  marginTop: "1.25rem"
};

const sectionTitleStyle: CSSProperties = {
  marginTop: 0
};

const itemCardStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  marginBottom: "0.8rem",
  display: "grid",
  gap: "0.45rem",
  contentVisibility: "auto",
  containIntrinsicSize: "150px"
};

const mutedStyle: CSSProperties = {
  color: "#cbd5e1",
  marginBottom: 0
};
