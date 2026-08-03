export type AuthenticatedUser = {
  sub: string;
  tenantId: string;
  role: "ADMIN" | "COMPANY" | "DRIVER" | "INDIVIDUAL" | "MANAGER";
  email: string;
};
