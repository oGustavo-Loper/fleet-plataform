export type AuthenticatedUser = {
  sub: string;
  tenantId: string;
  role: "ADMIN" | "COMPANY" | "DRIVER" | "INDIVIDUAL" | "MANAGER" | "SUPER_ADMIN";
  email: string;
  driverId?: string;
  assignedVehicleIds?: string[];
  allowAnyVehicle?: boolean;
  // Only ever set on the short-lived token minted by GET /media/token.
  // JwtStrategy rejects any token carrying this claim, so a media token
  // can't be replayed against GraphQL or other REST routes.
  scope?: "media";
};
