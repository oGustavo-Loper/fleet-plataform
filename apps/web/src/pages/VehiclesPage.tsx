import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

import { AppShell } from "@fleet/ui";

import { DrawerPanel } from "../components/DrawerPanel";
import { PaginationControls } from "../components/PaginationControls";
import { EmptyState, ErrorState, LoadingState } from "../components/ScreenState";
import { VehicleForm } from "../features/vehicles/VehicleForm";
import { VehicleList } from "../features/vehicles/VehicleList";
import { VehiclePlanSummary } from "../features/vehicles/VehiclePlanSummary";
import { usePageMeta } from "../hooks/usePageMeta";
import { useVehiclesPageState } from "../hooks/useVehiclesPageState";

export function VehiclesPage() {
  usePageMeta("Veículos", "Cadastro, consulta rápida e status operacional da frota.");
  const navigate = useNavigate();
  const {
    activeTenant,
    tenantLoading,
    loading,
    error,
    vehicles,
    filteredVehicles,
    pagedVehicles,
    page,
    setPage,
    pageSize,
    totalPages,
    vehicleLimit,
    limitReached,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    drawerMode,
    editingVehicle,
    openCreateDrawer,
    openEditDrawer,
    closeDrawer
  } = useVehiclesPageState();

  return (
    <AppShell
      title="Veículos"
      subtitle="Cadastro, consulta rapida e status operacional da frota."
    >
      <div style={actionsStyle}>
        <button
          className="btn-primary"
          style={primaryButtonStyle}
          type="button"
          onClick={openCreateDrawer}
        >
          <span aria-hidden="true" style={primaryButtonIconStyle}>
            +
          </span>
          Novo veículo
        </button>
        <button
          style={secondaryButtonStyle}
          type="button"
          onClick={() => navigate("/drivers")}
        >
          Novo motorista
        </button>
        <button
          style={secondaryButtonStyle}
          type="button"
          onClick={() => navigate("/fuels")}
        >
          Novo abastecimento
        </button>
      </div>
      <div style={filterGridStyle}>
        <label style={filterLabelStyle}>
          Buscar
          <span style={searchFieldStyle}>
            <svg
              style={searchIconStyle}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              style={searchInputStyle}
              placeholder="Ex: Hilux, ABC 1D23, Fiat..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </span>
        </label>
        <label style={filterLabelStyle}>
          Status
          <select
            style={selectInputStyle}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          >
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="MAINTENANCE">Manutenção</option>
            <option value="SOLD">Vendido</option>
          </select>
        </label>
      </div>
      {activeTenant ? (
        <VehiclePlanSummary
          tenant={activeTenant}
          vehiclesCount={vehicles.length}
          limitReached={limitReached}
          onUpgrade={() => navigate("/plans")}
        />
      ) : null}
      {loading || tenantLoading ? (
        <LoadingState message="Carregando veículos..." />
      ) : error ? (
        <ErrorState message="Falha ao carregar veículos da API." />
      ) : filteredVehicles.length > 0 ? (
        <>
          <VehicleList
            vehicles={pagedVehicles}
            onEdit={openEditDrawer}
          />
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={filteredVehicles.length}
            pageSize={pageSize}
            currentCount={pagedVehicles.length}
            onPageChange={setPage}
          />
        </>
      ) : (
        <EmptyState message="Nenhum veículo retornado pela API para esta conta." />
      )}
      <DrawerPanel
        open={Boolean(drawerMode)}
        title={drawerMode === "edit" ? "Editar veículo" : "Novo veículo"}
        onClose={closeDrawer}
      >
        {activeTenant?.id ? (
          <VehicleForm
            tenantId={activeTenant.id}
            tenantName={activeTenant.name}
            tenantAccountType={activeTenant.accountType}
            vehicleLimit={vehicleLimit ?? undefined}
            vehicleCount={vehicles.length}
            initialVehicle={editingVehicle}
            onDone={closeDrawer}
            onCancel={closeDrawer}
          />
        ) : null}
      </DrawerPanel>
    </AppShell>
  );
}

const actionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  marginBottom: "1rem"
};

const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  border: 0,
  borderRadius: "0.9rem",
  padding: "0.9rem 1.1rem",
  background: "#fbbf24",
  color: "#0f172a",
  fontWeight: 700,
  transition: "transform 0.15s ease, box-shadow 0.15s ease"
};

const primaryButtonIconStyle: CSSProperties = {
  display: "inline-grid",
  placeItems: "center",
  width: "1.1rem",
  height: "1.1rem",
  fontSize: "1rem",
  lineHeight: 1
};

const secondaryButtonStyle: CSSProperties = {
  borderRadius: "0.9rem",
  padding: "0.9rem 1rem",
  background: "transparent",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.22)"
};

const filterGridStyle: CSSProperties = {
  display: "grid",
  gap: "0.85rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  marginBottom: "1rem"
};

const filterLabelStyle: CSSProperties = {
  display: "grid",
  gap: "0.4rem",
  color: "#cbd5e1",
  fontSize: "0.95rem"
};

const searchFieldStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center"
};

const searchIconStyle: CSSProperties = {
  position: "absolute",
  left: "1rem",
  color: "#64748b",
  pointerEvents: "none"
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  borderRadius: "0.9rem",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  background: "rgba(15, 23, 42, 0.68)",
  color: "#f8fafc",
  padding: "0.9rem 1rem 0.9rem 2.6rem",
  outline: "none"
};

const selectInputStyle: CSSProperties = {
  borderRadius: "0.9rem",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  background: "rgba(15, 23, 42, 0.68)",
  color: "#f8fafc",
  padding: "0.9rem 1rem",
  outline: "none"
};
