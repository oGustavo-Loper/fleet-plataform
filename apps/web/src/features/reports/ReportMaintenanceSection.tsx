import type { CSSProperties } from "react";
import type { VehicleReportMaintenanceItem } from "@fleet/shared-types";

import { PaginationControls } from "../../components/PaginationControls";
import { EmptyState } from "../../components/ScreenState";

export function ReportMaintenanceSection({
  items,
  totalItems,
  page,
  totalPages,
  currentCount,
  onPageChange
}: {
  items: VehicleReportMaintenanceItem[];
  totalItems: number;
  page: number;
  totalPages: number;
  currentCount: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>Manutenções</h2>
      {items.length > 0 ? (
        <>
          {items.map((item) => (
            <article key={item.id} style={itemCardStyle}>
              <strong>{item.title}</strong>
              <p style={mutedStyle}>
                {new Date(item.performedAt).toLocaleDateString("pt-BR")} • KM {item.odometerKm.toLocaleString("pt-BR")}
              </p>
              <p style={mutedStyle}>
                Custo R$ {item.totalCost.toFixed(2)} • {item.supplierName ?? "Fornecedor não informado"}
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
        <EmptyState message="Nenhuma manutenção no período." />
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
  containIntrinsicSize: "130px"
};

const mutedStyle: CSSProperties = {
  color: "#cbd5e1",
  marginBottom: 0
};
