import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import type { FuelLogItem } from "@fleet/shared-types";

import { FUEL_LOGS_QUERY } from "../lib/queries";
import { useAccessibleVehicles } from "./useAccessibleVehicles";
import { usePaginatedItems } from "./usePaginatedItems";
import { useTenant } from "./useTenant";

export function useFuelsPageState() {
  const { activeTenant, loading: tenantLoading } = useTenant();
  const tenantId = activeTenant?.id ?? "";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const fuelQuery = useQuery<{ fuelLogs: FuelLogItem[] }>(FUEL_LOGS_QUERY, {
    skip: !tenantId,
    variables: { tenantId }
  });
  const { vehicles, drivers, activeDrivers, assignedVehicleIds, allowAnyVehicle, loading, error } =
    useAccessibleVehicles(tenantId);

  const items = fuelQuery.data?.fuelLogs ?? [];
  const visibleItems = !allowAnyVehicle
    ? items.filter((item) => assignedVehicleIds.includes(item.vehicleId))
    : items;
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return visibleItems;
    }

    return visibleItems.filter((item) => {
      const vehicle = vehicles.find((candidate) => candidate.id === item.vehicleId);
      const driver = drivers.find((candidate) => candidate.id === item.driverId);
      return [item.vehicleLabel, vehicle?.plate, vehicle?.model, driver?.fullName, item.stationName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [drivers, search, vehicles, visibleItems]);

  const pageSize = 12;
  const pagination = usePaginatedItems({
    items: filteredItems,
    pageSize,
    resetDependencies: [search]
  });

  return {
    tenantId,
    tenantLoading,
    loading: fuelQuery.loading || loading,
    error: fuelQuery.error ?? error,
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
    ...pagination
  };
}
