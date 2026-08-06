import { AppShell } from "@fleet/ui";
import { useState } from "react";
import type { FuelLogItem } from "@fleet/shared-types";

import { DrawerPanel } from "../components/DrawerPanel";
import { PaginationControls } from "../components/PaginationControls";
import { EmptyState, ErrorState, LoadingState } from "../components/ScreenState";
import { FuelDetailsPanel } from "../features/fuels/FuelDetailsPanel";
import { FuelForm } from "../features/fuels/FuelForm";
import { FuelList } from "../features/fuels/FuelList";
import { useFuelsPageState } from "../hooks/useFuelsPageState";
import { usePageMeta } from "../hooks/usePageMeta";

export function FuelsPage() {
  usePageMeta("Abastecimentos", "Registro rápido de abastecimentos, custos e histórico por veículo.");
  const [selectedItem, setSelectedItem] = useState<FuelLogItem | null>(null);
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
    activeDrivers,
    assignedVehicleIds,
    allowAnyVehicle,
    filteredItems,
    pageSize,
    page,
    setPage,
    totalPages,
    pagedItems
  } = useFuelsPageState();

  return (
    <AppShell
      title="Abastecimentos"
      subtitle="Registro rápido de abastecimentos, custos e histórico por veículo."
    >
      <div style={quickActionsStyle}>
        <button style={quickActionButtonStyle} type="button" onClick={() => setDrawerOpen(true)}>
          Novo abastecimento
        </button>
        <button style={quickActionGhostStyle} type="button" onClick={() => window.scrollTo({ top: 520, behavior: "smooth" })}>
          Ver histórico
        </button>
      </div>
      <div style={searchBarStyle}>
        <label style={searchLabelStyle}>
          Buscar abastecimento
          <input
            style={searchInputStyle}
            placeholder="Ex: Hilux, Carlos, posto..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>
      {tenantLoading || loading ? (
        <LoadingState message="Carregando abastecimentos..." />
      ) : error ? (
        <ErrorState message="Falha ao carregar abastecimentos da API." />
      ) : filteredItems.length > 0 ? (
        <>
          <FuelList items={pagedItems} onView={setSelectedItem} />
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
        <EmptyState message="Nenhum abastecimento retornado pela API para esta conta." />
      )}
      <DrawerPanel
        open={drawerOpen}
        title="Novo abastecimento"
        subtitle="Preencha os dados no drawer e acompanhe o histórico logo abaixo."
        width="min(680px, 100vw)"
        onClose={() => setDrawerOpen(false)}
      >
        {tenantId ? (
          <FuelForm
            tenantId={tenantId}
            vehicles={vehicles}
            drivers={activeDrivers}
            assignedVehicleIds={assignedVehicleIds}
            allowAnyVehicle={allowAnyVehicle}
            onDone={() => setDrawerOpen(false)}
            onCancel={() => setDrawerOpen(false)}
          />
        ) : null}
      </DrawerPanel>
      <DrawerPanel
        open={Boolean(selectedItem)}
        title="Detalhes do abastecimento"
        subtitle="Visualize os dados completos do registro selecionado."
        onClose={() => setSelectedItem(null)}
      >
        {selectedItem ? <FuelDetailsPanel item={selectedItem} /> : null}
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
