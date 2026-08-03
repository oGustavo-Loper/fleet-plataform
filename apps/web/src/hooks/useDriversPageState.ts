import { useMutation, useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import type { DriverEmploymentStatus, DriverListItem, VehicleListItem } from "@fleet/shared-types";

import {
  DELETE_DRIVER_MUTATION,
  DEMOTE_MANAGER_TO_DRIVER_MUTATION,
  DRIVERS_QUERY,
  PROMOTE_DRIVER_TO_MANAGER_MUTATION,
  UPDATE_DRIVER_MUTATION,
  VEHICLES_QUERY
} from "../lib/queries";
import { usePaginatedItems } from "./usePaginatedItems";
import { useTenant } from "./useTenant";
import { upsertQueryListItem } from "../lib/apollo-cache";

type StatusFilter = "ALL" | DriverEmploymentStatus;

export function useDriversPageState() {
  const [drawerMode, setDrawerMode] = useState<"create" | "view" | "edit" | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<DriverListItem | null>(null);
  const [driverPendingTermination, setDriverPendingTermination] = useState<DriverListItem | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const { activeTenant, loading: tenantLoading } = useTenant();

  const [updateDriver] = useMutation(UPDATE_DRIVER_MUTATION, {
    update(cache, { data }) {
      if (!activeTenant?.id || !data?.updateDriver) {
        return;
      }

      upsertQueryListItem({
        cache,
        query: DRIVERS_QUERY,
        variables: { tenantId: activeTenant.id },
        field: "drivers",
        item: data.updateDriver
      });
    }
  });
  const [terminateDriver, { loading: terminatingDriver }] = useMutation(DELETE_DRIVER_MUTATION, {
    refetchQueries: activeTenant?.id ? [{ query: DRIVERS_QUERY, variables: { tenantId: activeTenant.id } }] : []
  });
  const [promoteDriverToManager, { loading: promotingDriver, error: promoteError }] = useMutation(
    PROMOTE_DRIVER_TO_MANAGER_MUTATION,
    {
      update(cache, { data }) {
        if (!activeTenant?.id || !data?.promoteDriverToManager) {
          return;
        }

        upsertQueryListItem({
          cache,
          query: DRIVERS_QUERY,
          variables: { tenantId: activeTenant.id },
          field: "drivers",
          item: data.promoteDriverToManager
        });
      }
    }
  );
  const [demoteManagerToDriver, { loading: demotingDriver, error: demoteError }] = useMutation(
    DEMOTE_MANAGER_TO_DRIVER_MUTATION,
    {
      update(cache, { data }) {
        if (!activeTenant?.id || !data?.demoteManagerToDriver) {
          return;
        }

        upsertQueryListItem({
          cache,
          query: DRIVERS_QUERY,
          variables: { tenantId: activeTenant.id },
          field: "drivers",
          item: data.demoteManagerToDriver
        });
      }
    }
  );
  const driversQuery = useQuery<{ drivers: DriverListItem[] }>(DRIVERS_QUERY, {
    skip: !activeTenant?.id,
    variables: {
      tenantId: activeTenant?.id ?? ""
    }
  });
  const vehiclesQuery = useQuery<{ vehicles: VehicleListItem[] }>(VEHICLES_QUERY, {
    skip: !activeTenant?.id,
    variables: {
      tenantId: activeTenant?.id ?? ""
    }
  });

  const drivers = driversQuery.data?.drivers ?? [];
  const vehicles = vehiclesQuery.data?.vehicles ?? [];
  const filteredDrivers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const numericSearch = normalizedSearch.replace(/\D/g, "");

    return drivers.filter((driver) => {
      const matchesRegistration =
        driver.registrationId?.toLowerCase().includes(normalizedSearch) ?? false;
      const matchesCpf =
        !!driver.cpf &&
        numericSearch.length > 0 &&
        driver.cpf.replace(/\D/g, "").includes(numericSearch);
      const matchesSearch =
        !normalizedSearch ||
        driver.fullName.toLowerCase().includes(normalizedSearch) ||
        matchesRegistration ||
        matchesCpf;
      const matchesStatus = statusFilter === "ALL" || driver.employmentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [drivers, search, statusFilter]);

  const activeAndVacationDrivers = filteredDrivers.filter((driver) => driver.employmentStatus !== "TERMINATED");
  const terminatedDrivers = filteredDrivers.filter((driver) => driver.employmentStatus === "TERMINATED");
  const primaryDrivers = statusFilter === "TERMINATED" ? terminatedDrivers : activeAndVacationDrivers;
  const pageSize = 8;
  const { page, setPage, totalPages, pagedItems: pagedDrivers } = usePaginatedItems({
    items: primaryDrivers,
    pageSize,
    resetDependencies: [search, statusFilter]
  });

  async function handleStatusUpdate(driver: DriverListItem, employmentStatus: DriverEmploymentStatus) {
    await updateDriver({
      variables: {
        input: {
          id: driver.id,
          fullName: driver.fullName,
          cpf: driver.cpf,
          registrationId: driver.registrationId,
          cnh: driver.cnh,
          cnhCategory: driver.cnhCategory,
          cnhExpiresAt: driver.cnhExpiresAt,
          loginEmail: driver.loginEmail,
          assignedVehicleIds: driver.assignedVehicleIds,
          allowAnyVehicle: driver.allowAnyVehicle,
          employmentStatus,
          isActive: employmentStatus === "ACTIVE",
          photoDataUrl: driver.photoDataUrl
        }
      }
    });
  }

  async function handleConfirmTermination() {
    if (!driverPendingTermination) {
      return;
    }

    await terminateDriver({
      variables: {
        input: {
          id: driverPendingTermination.id
        }
      }
    });

    setSelectedDriver((current) => (current?.id === driverPendingTermination.id ? null : current));
    setDrawerMode((current) => (current === "view" || current === "edit" ? null : current));
    setDriverPendingTermination(null);
  }

  function openCreateDrawer() {
    setSelectedDriver(null);
    setDrawerMode("create");
  }

  function openViewDrawer(driver: DriverListItem) {
    setSelectedDriver(driver);
    setDrawerMode("view");
  }

  function openEditDrawer(driver: DriverListItem) {
    setSelectedDriver(driver);
    setDrawerMode("edit");
  }

  function closeDrawer() {
    setDrawerMode(null);
    setSelectedDriver(null);
  }

  async function handlePromoteToManager(driver: DriverListItem) {
    await promoteDriverToManager({ variables: { driverId: driver.id } });
  }

  async function handleDemoteToDriver(driver: DriverListItem) {
    await demoteManagerToDriver({ variables: { driverId: driver.id } });
  }

  const roleChangeError = promoteError
    ? promoteError.graphQLErrors?.[0]?.message ?? "Não foi possível promover o motorista."
    : demoteError
      ? demoteError.graphQLErrors?.[0]?.message ?? "Não foi possível rebaixar o gestor."
      : "";

  return {
    activeTenant,
    tenantLoading,
    loading: driversQuery.loading || vehiclesQuery.loading,
    error: driversQuery.error ?? vehiclesQuery.error,
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
    promotingDriver,
    demotingDriver,
    roleChangeError
  };
}
