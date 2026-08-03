import type { CSSProperties } from "react";
import { AppShell } from "@fleet/ui";
import type { DriverEmploymentStatus } from "@fleet/shared-types";

import { ConfirmModal } from "../components/ConfirmModal";
import { DrawerPanel } from "../components/DrawerPanel";
import { PaginationControls } from "../components/PaginationControls";
import { EmptyState, ErrorState, LoadingState } from "../components/ScreenState";
import { useAuth } from "../contexts/AuthContext";
import { DriverDetailsPanel } from "../features/drivers/DriverDetailsPanel";
import { DriverForm } from "../features/drivers/DriverForm";
import { DriverList } from "../features/drivers/DriverList";
import { useDriversPageState } from "../hooks/useDriversPageState";

type StatusFilter = "ALL" | DriverEmploymentStatus;

export function DriversPage() {
  const { auth } = useAuth();
  const canManageRoles = auth?.role === "ADMIN";
  const canCreateDriver = auth?.role !== "INDIVIDUAL";
  const {
    activeTenant,
    tenantLoading,
    loading,
    error,
    drawerMode,
    selectedDriver,
    driverPendingTermination,
    terminatingDriver,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    vehicles,
    filteredDrivers,
    primaryDrivers,
    terminatedDrivers,
    pagedDrivers,
    page,
    setPage,
    pageSize,
    totalPages,
    handleStatusUpdate,
    handleConfirmTermination,
    openCreateDrawer,
    openViewDrawer,
    openEditDrawer,
    closeDrawer,
    setDriverPendingTermination,
    handlePromoteToManager,
    handleDemoteToDriver,
    roleChangeError
  } = useDriversPageState();

  return (
    <AppShell
      title="Motoristas"
      subtitle="Cadastro, status de acesso e histórico dos motoristas vinculados à conta."
    >
      <div style={toolbarStyle}>
        <div style={filtersStyle}>
          <label style={filterLabelStyle}>
            Buscar por nome ou {activeTenant?.accountType === "COMPANY" ? "matrícula" : "CPF"}
            <input
              style={filterInputStyle}
              placeholder={
                activeTenant?.accountType === "COMPANY"
                  ? "Ex: Carlos ou MT-1024"
                  : "Ex: Carlos ou 12345678910"
              }
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label style={filterLabelStyle}>
            Status
            <select
              style={filterInputStyle}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Ativos</option>
              <option value="VACATION">Em férias</option>
              <option value="TERMINATED">Desligados</option>
            </select>
          </label>
        </div>
        {canCreateDriver ? (
          <button type="button" style={primaryButtonStyle} onClick={openCreateDrawer}>
            Novo motorista
          </button>
        ) : null}
      </div>
      {!canCreateDriver ? (
        <p style={individualNoticeStyle}>
          Contas de pessoa física têm apenas o próprio perfil de motorista. Complete seus dados em
          "Meu perfil".
        </p>
      ) : null}
      {roleChangeError ? <p style={roleChangeErrorStyle}>{roleChangeError}</p> : null}
      {loading || tenantLoading ? (
        <LoadingState message="Carregando motoristas..." />
      ) : error ? (
        <ErrorState message="Falha ao carregar motoristas da API." />
      ) : filteredDrivers.length > 0 ? (
        <>
          {primaryDrivers.length > 0 ? (
            <>
              <DriverList
                accountType={activeTenant?.accountType}
                drivers={pagedDrivers}
                vehicles={vehicles}
                onView={openViewDrawer}
                onEdit={openEditDrawer}
                onSetVacation={(driver) => handleStatusUpdate(driver, "VACATION")}
                onActivate={(driver) => handleStatusUpdate(driver, "ACTIVE")}
                onTerminate={setDriverPendingTermination}
                onPromoteToManager={canManageRoles ? handlePromoteToManager : undefined}
                onDemoteToDriver={canManageRoles ? handleDemoteToDriver : undefined}
              />
              <PaginationControls
                page={page}
                totalPages={totalPages}
                totalItems={primaryDrivers.length}
                pageSize={pageSize}
                currentCount={pagedDrivers.length}
                onPageChange={setPage}
              />
            </>
          ) : (
            <EmptyState message="Nenhum motorista encontrado para os filtros atuais." />
          )}
          {statusFilter !== "TERMINATED" && terminatedDrivers.length > 0 ? (
            <section style={terminatedSectionStyle}>
              <div style={terminatedHeaderStyle}>
                <div>
                  <h3 style={{ margin: 0 }}>Motoristas desligados</h3>
                  <p style={terminatedSubtitleStyle}>
                    Registros preservados para consulta e histórico interno.
                  </p>
                </div>
                <span style={terminatedCountStyle}>{terminatedDrivers.length}</span>
              </div>
              <DriverList
                accountType={activeTenant?.accountType}
                drivers={terminatedDrivers}
                vehicles={vehicles}
                onView={openViewDrawer}
                onEdit={openEditDrawer}
                onActivate={(driver) => handleStatusUpdate(driver, "ACTIVE")}
              />
            </section>
          ) : null}
        </>
      ) : (
        <EmptyState message="Nenhum motorista retornado pela API para esta conta." />
      )}
      <DrawerPanel
        open={Boolean(drawerMode)}
        title={
          drawerMode === "create"
            ? "Novo motorista"
            : drawerMode === "edit"
              ? "Editar motorista"
              : "Motorista"
        }
        onClose={closeDrawer}
      >
        {drawerMode === "view" && selectedDriver ? (
          <DriverDetailsPanel
            accountType={activeTenant?.accountType}
            driver={selectedDriver}
            vehicles={vehicles}
          />
        ) : activeTenant?.id ? (
          <DriverForm
            accountType={activeTenant.accountType}
            tenantId={activeTenant.id}
            vehicles={vehicles}
            initialDriver={drawerMode === "edit" ? selectedDriver : null}
            onDone={closeDrawer}
            onCancel={closeDrawer}
          />
        ) : null}
      </DrawerPanel>
      <ConfirmModal
        open={Boolean(driverPendingTermination)}
        title="Desligar motorista"
        description={
          driverPendingTermination ? (
            <>
              <p style={{ marginTop: 0 }}>
                Você vai desligar <strong>{driverPendingTermination.fullName}</strong>.
              </p>
              <p style={{ marginBottom: 0 }}>
                O motorista perderá acesso ao sistema, mas o cadastro será preservado na sublista de desligados.
              </p>
            </>
          ) : null
        }
        confirmLabel="Desligar motorista"
        cancelLabel="Cancelar"
        danger
        loading={terminatingDriver}
        onCancel={() => setDriverPendingTermination(null)}
        onConfirm={handleConfirmTermination}
      />
    </AppShell>
  );
}

const toolbarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "end",
  flexWrap: "wrap",
  gap: "1rem",
  marginBottom: "1rem"
};

const filtersStyle: CSSProperties = {
  display: "grid",
  gap: "0.85rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  flex: "1 1 480px"
};

const filterLabelStyle: CSSProperties = {
  display: "grid",
  gap: "0.4rem",
  color: "#cbd5e1"
};

const filterInputStyle: CSSProperties = {
  borderRadius: "0.9rem",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  background: "rgba(15, 23, 42, 0.68)",
  color: "#f8fafc",
  padding: "0.9rem 1rem",
  outline: "none"
};

const roleChangeErrorStyle: CSSProperties = {
  padding: "0.9rem 1rem",
  borderRadius: "0.9rem",
  background: "rgba(248, 113, 113, 0.12)",
  border: "1px solid rgba(248, 113, 113, 0.3)",
  color: "#fda4af",
  marginBottom: "1rem"
};

const individualNoticeStyle: CSSProperties = {
  padding: "0.9rem 1rem",
  borderRadius: "0.9rem",
  background: "rgba(251, 191, 36, 0.1)",
  border: "1px solid rgba(251, 191, 36, 0.28)",
  color: "#fbbf24",
  marginBottom: "1rem"
};

const primaryButtonStyle: CSSProperties = {
  border: 0,
  borderRadius: "0.9rem",
  padding: "0.9rem 1rem",
  background: "#fbbf24",
  color: "#0f172a",
  fontWeight: 700
};

const terminatedSectionStyle: CSSProperties = {
  marginTop: "2rem",
  paddingTop: "1.5rem",
  borderTop: "1px solid rgba(148, 163, 184, 0.14)"
};

const terminatedHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  marginBottom: "1rem"
};

const terminatedSubtitleStyle: CSSProperties = {
  margin: "0.35rem 0 0",
  color: "#94a3b8"
};

const terminatedCountStyle: CSSProperties = {
  minWidth: "2rem",
  height: "2rem",
  borderRadius: "999px",
  display: "grid",
  placeItems: "center",
  background: "rgba(148, 163, 184, 0.16)",
  color: "#e2e8f0",
  padding: "0 0.65rem"
};
