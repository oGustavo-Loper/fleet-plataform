import type { CSSProperties } from "react";
import type { TenantSummary, VehicleListItem } from "@fleet/shared-types";

import { planLabel } from "../../lib/plans";

export function VehiclePlanSummary({
  tenant,
  vehiclesCount,
  limitReached,
  onUpgrade
}: {
  tenant: TenantSummary;
  vehiclesCount: number;
  limitReached: boolean;
  onUpgrade: () => void;
}) {
  const isIndividual = tenant.accountType === "INDIVIDUAL";
  const isCompanyTrial = tenant.accountType === "COMPANY" && tenant.planStatus !== "ACTIVE";

  if (!isIndividual && !isCompanyTrial) {
    return null;
  }

  return (
    <article style={planCardStyle}>
      <strong>{isIndividual ? "Pessoa física" : "Empresa em avaliação"}</strong>
      <p style={planTextStyle}>
        Plano atual: {planLabel(tenant.planCode)}.{" "}
        {isCompanyTrial
          ? "A empresa pode cadastrar até 3 veículos até confirmar o pagamento recorrente."
          : "Ao atingir o limite, será necessário assinar um plano superior."}
      </p>
      <p style={{ ...planTextStyle, color: limitReached ? "#fda4af" : "#fbbf24" }}>
        Veículos cadastrados: {vehiclesCount}/{tenant.vehicleLimit ?? "Ilimitado"}
      </p>
      {limitReached ? (
        <button
          type="button"
          style={{ ...secondaryButtonStyle, marginTop: "0.9rem" }}
          onClick={onUpgrade}
        >
          Fazer upgrade do plano
        </button>
      ) : null}
    </article>
  );
}

const secondaryButtonStyle: CSSProperties = {
  borderRadius: "0.9rem",
  padding: "0.9rem 1rem",
  background: "transparent",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.22)"
};

const planCardStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(251, 191, 36, 0.18)",
  marginBottom: "1rem"
};

const planTextStyle: CSSProperties = {
  marginBottom: 0,
  color: "#cbd5e1"
};
