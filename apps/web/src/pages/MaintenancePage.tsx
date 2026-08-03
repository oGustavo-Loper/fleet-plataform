import { AppShell } from "@fleet/ui";
import { useRef, useState } from "react";
import type { MaintenanceItem } from "@fleet/shared-types";

import { DrawerPanel } from "../components/DrawerPanel";
import { PaginationControls } from "../components/PaginationControls";
import { EmptyState, ErrorState, LoadingState } from "../components/ScreenState";
import { MaintenanceDetailsPanel } from "../features/maintenance/MaintenanceDetailsPanel";
import { MaintenanceForm } from "../features/maintenance/MaintenanceForm";
import { MaintenanceList } from "../features/maintenance/MaintenanceList";
import { useMaintenancePageState } from "../hooks/useMaintenancePageState";
import { revealMaintenanceHistory } from "../lib/maintenance-history";

export function MaintenancePage() {
  const [selectedItem, setSelectedItem] = useState<MaintenanceItem | null>(null);
  const [historyHighlight, setHistoryHighlight] = useState(false);
  const historySectionRef = useRef<HTMLElement | null>(null);
  const {
    tenantId,
    tenantLoading,
    loading,
    error,
    drawerOpen,
    setDrawerOpen,
    search,
    setSearch,
    vehicles,
    assignedVehicleIds,
    allowAnyVehicle,
    filteredItems,
    pageSize,
    page,
    setPage,
    totalPages,
    pagedItems
  } = useMaintenancePageState();

  return (
    <AppShell
      title="Manutenções"
      subtitle="Registro de manutenções preventivas e corretivas, com próxima data ou quilometragem."
    >
      <div style={quickActionsStyle}>
        <button className="btn-primary" style={quickActionButtonStyle} type="button" onClick={() => setDrawerOpen(true)}>
          Nova manutenção
        </button>
        <button
          style={quickActionGhostStyle}
          type="button"
          onClick={() => {
            revealMaintenanceHistory(historySectionRef.current, setHistoryHighlight);
          }}
        >
          Ver histórico
        </button>
      </div>
      <div style={searchBarStyle}>
        <label style={searchLabelStyle}>
          Buscar manutenção
          <input
            style={searchInputStyle}
            placeholder="Ex: troca de óleo, Hilux, oficina..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>
      <section
        ref={historySectionRef}
        style={{
          ...historySectionStyle,
          ...(historyHighlight ? historySectionHighlightStyle : null)
        }}
      >
        {tenantLoading || loading ? (
          <LoadingState message="Carregando manutenções..." />
        ) : error ? (
          <ErrorState message="Falha ao carregar manutenções da API." />
        ) : filteredItems.length > 0 ? (
          <>
            <MaintenanceList items={pagedItems} onView={setSelectedItem} />
            <PaginationControls
              page={page}
              totalPages={totalPages}
              totalItems={filteredItems.length}
              pageSize={pageSize}
              currentCount={pagedItems.length}
              onPageChange={setPage}
            />
          </>
        ) : (
          <EmptyState message="Nenhuma manutenção retornada pela API para esta conta." />
        )}
      </section>
      <DrawerPanel
        open={drawerOpen}
        title="Nova manutenção"
        subtitle="Preencha os dados no drawer e acompanhe o histórico logo abaixo."
        onClose={() => setDrawerOpen(false)}
      >
        {tenantId ? (
          <MaintenanceForm
            tenantId={tenantId}
            vehicles={vehicles}
            assignedVehicleIds={assignedVehicleIds}
            allowAnyVehicle={allowAnyVehicle}
            onDone={() => setDrawerOpen(false)}
            onCancel={() => setDrawerOpen(false)}
          />
        ) : null}
      </DrawerPanel>
      <DrawerPanel
        open={Boolean(selectedItem)}
        title="Detalhes da manutenção"
        subtitle="Visualize os dados completos do registro selecionado."
        onClose={() => setSelectedItem(null)}
      >
        {selectedItem ? <MaintenanceDetailsPanel item={selectedItem} /> : null}
      </DrawerPanel>
    </AppShell>
  );
}

const quickActionsStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "0.75rem",
  marginBottom: "1rem"
};

const quickActionButtonStyle = {
  border: 0,
  borderRadius: "0.9rem",
  padding: "0.9rem 1rem",
  background: "#fbbf24",
  color: "#0f172a",
  fontWeight: 700
};

const quickActionGhostStyle = {
  borderRadius: "0.9rem",
  padding: "0.9rem 1rem",
  background: "transparent",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.22)"
};

const searchBarStyle = {
  marginBottom: "1rem"
};

const historySectionStyle = {
  scrollMarginTop: "6rem",
  borderRadius: "0.9rem",
  transition: "box-shadow 220ms ease, background-color 220ms ease"
};

const historySectionHighlightStyle = {
  backgroundColor: "rgba(15, 23, 42, 0.28)",
  boxShadow: "0 0 0 2px rgba(251, 191, 36, 0.28)"
};

const searchLabelStyle = {
  display: "grid",
  gap: "0.4rem",
  color: "#cbd5e1"
};

const searchInputStyle = {
  borderRadius: "0.9rem",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  background: "rgba(15, 23, 42, 0.68)",
  color: "#f8fafc",
  padding: "0.9rem 1rem",
  outline: "none"
};
