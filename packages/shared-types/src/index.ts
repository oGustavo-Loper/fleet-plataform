export type AccountType = "COMPANY" | "INDIVIDUAL";
export type PlanStatus = "TRIAL" | "ACTIVE" | "INACTIVE";

export type UserRole = "ADMIN" | "COMPANY" | "DRIVER" | "INDIVIDUAL";

export type DriverEmploymentStatus = "ACTIVE" | "VACATION" | "TERMINATED";

export type VehicleStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "SOLD";

export type VehicleType = "CAR" | "MOTORCYCLE" | "TRUCK" | "BUS";

export type FuelType =
  | "GASOLINE"
  | "ETHANOL"
  | "DIESEL"
  | "FLEX"
  | "ELECTRIC"
  | "HYBRID";

export type SyncStatus =
  | "ONLINE"
  | "OFFLINE"
  | "SYNCING"
  | "SYNCED"
  | "CONFLICT";

export interface AuthUser {
  id: string;
  tenantId: string;
  role: UserRole;
  email: string;
  fullName: string;
}

export interface TenantSummary {
  id: string;
  name: string;
  accountType: AccountType;
  documentNumber?: string;
  planCode: string;
  planStatus: PlanStatus;
  vehicleLimit?: number;
  photoDataUrl?: string;
}

export interface DashboardSummary {
  totalVehicles: number;
  activeVehicles: number;
  maintenanceVehicles: number;
  monthlyCost: number;
  averageConsumption: number;
  pendingSyncItems: number;
  upcomingMaintenance: Array<{
    id: string;
    vehicleLabel: string;
    dueDate?: string;
    dueKm?: number;
  }>;
  alerts: Array<{
    id: string;
    title: string;
    severity: "info" | "warning" | "critical";
  }>;
  recentActivity: Array<{
    id: string;
    entity: "vehicle" | "fuel" | "maintenance" | "driver";
    action: "create" | "update";
    title: string;
    createdAt: string;
  }>;
}

export interface VehicleListItem {
  id: string;
  plate: string;
  vehicleType: VehicleType;
  brand: string;
  model: string;
  year: number;
  fuelType: FuelType;
  currentKm: number;
  status: VehicleStatus;
  ownerName: string;
  createdAt: string;
}

export interface DriverListItem {
  id: string;
  fullName: string;
  cpf?: string;
  registrationId?: string;
  cnh: string;
  cnhCategory: string;
  cnhExpiresAt: string;
  createdAt: string;
  loginEmail?: string;
  assignedVehicleIds: string[];
  allowAnyVehicle: boolean;
  employmentStatus: DriverEmploymentStatus;
  isActive: boolean;
  photoDataUrl?: string;
}

export interface FuelLogItem {
  id: string;
  tenantId: string;
  vehicleId: string;
  driverId?: string;
  fueledAt: string;
  odometerKm: number;
  fuelType: FuelType;
  liters: number;
  totalCost: number;
  pricePerLiter: number;
  stationName?: string;
  notes?: string;
  vehicleLabel: string;
  driverName?: string;
  receiptPhotoDataUrl?: string;
  fuelingAddress?: string;
  fuelingLatitude?: number;
  fuelingLongitude?: number;
  previousKm?: number;
  distanceKm: number;
  averageConsumption: number;
}

export interface MaintenanceItem {
  id: string;
  tenantId: string;
  vehicleId: string;
  vehicleLabel: string;
  title: string;
  maintenanceType: string;
  performedAt: string;
  odometerKm: number;
  totalCost: number;
  supplierName?: string;
  notes?: string;
  nextMaintenanceAt?: string;
  nextMaintenanceKm?: number;
  oilType?: string;
  oilBrand?: string;
  oilCost?: number;
  previousOilChangeAt?: string;
  previousOilChangeKm?: number;
  previousOilChangeNotes?: string;
  changedOilFilter?: boolean;
  changedAirFilter?: boolean;
  changedFuelFilter?: boolean;
  tireBrand?: string;
  tireQuantity?: number;
  tireUnitCost?: number;
  batteryBrand?: string;
  batteryCost?: number;
  batteryVoltage?: string;
  brakeService?: string;
  beltChanged?: boolean;
  partName?: string;
  partBrand?: string;
  partCost?: number;
}

export interface VehicleReportFuelItem extends FuelLogItem {}

export interface VehicleReportMaintenanceItem extends MaintenanceItem {}

export interface VehicleReportItem {
  vehicle: VehicleListItem;
  period: {
    from?: string;
    to?: string;
  };
  summary: {
    fuelCount: number;
    maintenanceCount: number;
    totalLiters: number;
    totalDistanceKm: number;
    totalFuelCost: number;
    totalMaintenanceCost: number;
    totalCost: number;
    averageConsumption: number;
  };
  fuelLogs: VehicleReportFuelItem[];
  maintenanceLogs: VehicleReportMaintenanceItem[];
}

export interface SyncQueueItem<TPayload = unknown> {
  id: string;
  tenantId: string;
  entity: "vehicle" | "driver" | "fuelLog" | "maintenance";
  operation: "create";
  payload: TPayload;
  createdAt: string;
  status: "PENDING" | "SYNCING" | "SYNCED" | "ERROR";
  errorMessage?: string;
}
