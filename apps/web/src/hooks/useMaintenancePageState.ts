import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import type { MaintenanceItem } from "@fleet/shared-types";

import { MAINTENANCE_LOGS_QUERY } from "../lib/queries";
import { formatMaintenanceType } from "../lib/maintenance";
import { useAccessibleVehicles } from "./useAccessibleVehicles";
import { usePaginatedItems } from "./usePaginatedItems";
import { useTenant } from "./useTenant";

export function useMaintenancePageState() {
  const { activeTenant, loading: tenantLoading } = useTenant();
  const tenantId = activeTenant?.id ?? "";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const maintenanceQuery = useQuery<{ maintenanceLogs: MaintenanceItem[] }>(MAINTENANCE_LOGS_QUERY, {
    skip: !tenantId,
    variables: { tenantId }
  });
  const { vehicles, assignedVehicleIds, allowAnyVehicle, loading, error } = useAccessibleVehicles(tenantId);

  const items = maintenanceQuery.data?.maintenanceLogs ?? [];
  const visibleItems = !allowAnyVehicle
    ? items.filter((item) => assignedVehicleIds.includes(item.vehicleId))
    : items;
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return visibleItems;
    }

    return visibleItems.filter((item) =>
      [item.vehicleLabel, item.title, item.maintenanceType, formatMaintenanceType(item.maintenanceType), item.supplierName, item.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [search, visibleItems]);

  const pageSize = 8;
  const pagination = usePaginatedItems({
    items: filteredItems,
    pageSize,
    resetDependencies: [search]
  });

  return {
    tenantId,
    tenantLoading,
    loading: maintenanceQuery.loading || loading,
    error: maintenanceQuery.error ?? error,
    drawerOpen,
    setDrawerOpen,
    search,
    setSearch,
    vehicles,
    assignedVehicleIds,
    allowAnyVehicle,
    filteredItems,
    pageSize,
    ...pagination
  };
}
