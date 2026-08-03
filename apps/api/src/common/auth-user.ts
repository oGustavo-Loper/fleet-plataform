export type AuthenticatedUser = {
  sub: string;
  tenantId: string;
  role: "ADMIN" | "COMPANY" | "DRIVER" | "INDIVIDUAL" | "MANAGER" | "SUPER_ADMIN";
  email: string;
};
