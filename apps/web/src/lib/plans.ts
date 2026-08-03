const PLAN_LABELS: Record<string, string> = {
  ESSENTIAL_FREE: "Free",
  INDIVIDUAL_PRO: "Pro",
  COMPANY_START: "Empresa Start",
  COMPANY_PRO: "Empresa Pro"
};

export function planLabel(code?: string | null) {
  if (!code) {
    return "Sem plano";
  }

  return PLAN_LABELS[code] ?? code;
}
