import type { AuthenticatedUser } from "./auth-user.js";

/**
 * A DRIVER without allowAnyVehicle only sees their assigned vehicle(s).
 * Every other role sees the whole tenant fleet.
 */
export function getVisibleVehicleIds(user: AuthenticatedUser, tenantVehicleIds: string[]): string[] {
  if (user.role !== "DRIVER" || user.allowAnyVehicle) {
    return tenantVehicleIds;
  }

  const assigned = new Set(user.assignedVehicleIds ?? []);
  return tenantVehicleIds.filter((id) => assigned.has(id));
}
