import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import type { DriverListItem, VehicleListItem } from "@fleet/shared-types";

import { useAuth } from "../contexts/AuthContext";
import { DRIVERS_QUERY, VEHICLES_QUERY } from "../lib/queries";

type UseAccessibleVehiclesResult = {
  vehicles: VehicleListItem[];
  drivers: DriverListItem[];
  activeDrivers: DriverListItem[];
  accessibleVehicles: VehicleListItem[];
  assignedVehicleIds: string[];
  allowAnyVehicle: boolean;
  currentDriver: DriverListItem | null;
  loading: boolean;
  error: Error | undefined;
};

export function useAccessibleVehicles(tenantId: string): UseAccessibleVehiclesResult {
  const { auth } = useAuth();
  const vehiclesQuery = useQuery<{ vehicles: VehicleListItem[] }>(VEHICLES_QUERY, {
    skip: !tenantId,
    variables: { tenantId }
  });
  const driversQuery = useQuery<{ drivers: DriverListItem[] }>(DRIVERS_QUERY, {
    skip: !tenantId,
    variables: { tenantId }
  });

  const vehicles = vehiclesQuery.data?.vehicles ?? [];
  const drivers = driversQuery.data?.drivers ?? [];
  const activeDrivers = useMemo(
    () => drivers.filter((driver) => driver.employmentStatus === "ACTIVE"),
    [drivers]
  );
  const currentDriver = useMemo(
    () => drivers.find((driver) => driver.id === auth?.driverId) ?? null,
    [auth?.driverId, drivers]
  );
  const allowAnyVehicle =
    auth?.role === "DRIVER"
      ? currentDriver?.allowAnyVehicle ?? auth.allowAnyVehicle
      : true;
  const assignedVehicleIds =
    auth?.role === "DRIVER"
      ? currentDriver?.assignedVehicleIds ?? auth.assignedVehicleIds ?? []
      : [];
  const accessibleVehicles = useMemo(() => {
    if (auth?.role !== "DRIVER" || allowAnyVehicle) {
      return vehicles;
    }

    const assignedSet = new Set(assignedVehicleIds);
    return vehicles.filter((vehicle) => assignedSet.has(vehicle.id));
  }, [allowAnyVehicle, assignedVehicleIds, auth?.role, vehicles]);

  return {
    vehicles,
    drivers,
    activeDrivers,
    accessibleVehicles,
    assignedVehicleIds,
    allowAnyVehicle,
    currentDriver,
    loading: vehiclesQuery.loading || driversQuery.loading,
    error: (vehiclesQuery.error ?? driversQuery.error) as Error | undefined
  };
}
