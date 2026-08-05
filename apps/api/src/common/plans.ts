export const PAID_PLAN_CODES = new Set(["INDIVIDUAL_PRO", "COMPANY_PRO"]);
export const FREE_PLAN_CODES = new Set(["ESSENTIAL_FREE", "COMPANY_START"]);
export const ALL_PLAN_CODES = new Set([...FREE_PLAN_CODES, ...PAID_PLAN_CODES]);

export const PLAN_PRICES_BRL: Record<string, number> = {
  INDIVIDUAL_PRO: 19.9,
  COMPANY_PRO: 59.9
};

export function vehicleLimitForPlanCode(planCode: string): number | null {
  if (planCode === "INDIVIDUAL_PRO") {
    return 20;
  }
  if (planCode === "COMPANY_PRO") {
    return null;
  }
  return 3;
}
