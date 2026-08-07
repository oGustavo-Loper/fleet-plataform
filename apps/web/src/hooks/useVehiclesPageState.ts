import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import type { VehicleListItem } from "@fleet/shared-types";

import { VEHICLES_QUERY } from "../lib/queries";
import { usePaginatedItems } from "./usePaginatedItems";
import { useTenant } from "./useTenant";

export function useVehiclesPageState() {
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<VehicleListItem | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | VehicleListItem["status"]>("ALL");
  const { activeTenant, loading: tenantLoading } = useTenant();
  const vehiclesQuery = useQuery<{ vehicles: VehicleListItem[] }>(VEHICLES_QUERY, {
    skip: !activeTenant?.id,
    variables: {
      tenantId: activeTenant?.id ?? ""
    }
  });

  const vehicles = vehiclesQuery.data?.vehicles ?? [];
  const isIndividual = activeTenant?.accountType === "INDIVIDUAL";
  const isCompanyTrial = activeTenant?.accountType === "COMPANY" && activeTenant?.planStatus !== "ACTIVE";
  const vehicleLimit = activeTenant?.vehicleLimit ?? null;
  const limitReached =
    (isIndividual || isCompanyTrial) && vehicleLimit !== null && vehicles.length >= vehicleLimit;
  const filteredVehicles = useMemo(() => {
    const term = search.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const matchesSearch =
        !term ||
        [vehicle.plate, vehicle.brand, vehicle.model, vehicle.ownerName]
          .join(" ")
          .toLowerCase()
          .includes(term);
      const matchesStatus = statusFilter === "ALL" || vehicle.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, vehicles]);

  const pageSize = 8;
  const { page, setPage, totalPages, pagedItems: pagedVehicles } = usePaginatedItems({
    items: filteredVehicles,
    pageSize,
    resetDependencies: [search, statusFilter]
  });

  function openCreateDrawer() {
    setEditingVehicle(null);
    setDrawerMode("create");
  }

  function openEditDrawer(vehicle: VehicleListItem) {
    setEditingVehicle(vehicle);
    setDrawerMode("edit");
  }

  function closeDrawer() {
    setDrawerMode(null);
    setEditingVehicle(null);
  }

  return {
    activeTenant,
    tenantLoading,
    loading: vehiclesQuery.loading,
    error: vehiclesQuery.error,
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
  };
}
