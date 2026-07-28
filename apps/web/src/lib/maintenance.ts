const MAINTENANCE_TYPE_LABELS: Record<string, string> = {
  PREVENTIVE: "Preventiva",
  CORRECTIVE: "Corretiva",
  OIL_CHANGE: "Troca de óleo",
  BRAKES: "Freios",
  TIRES: "Pneus",
  BATTERY: "Bateria",
  BELTS: "Correias",
  OTHER_PARTS: "Outras peças"
};

export function formatMaintenanceType(maintenanceType?: string | null) {
  if (!maintenanceType) {
    return "Não informado";
  }
  return MAINTENANCE_TYPE_LABELS[maintenanceType] ?? maintenanceType;
}
