export type TenantRecord = {
  id: string;
  name: string;
  accountType: "COMPANY" | "INDIVIDUAL";
  documentNumber?: string;
  planCode: string;
  planStatus: "TRIAL" | "ACTIVE" | "INACTIVE";
  vehicleLimit?: number;
  photoDataUrl?: string;
  billingProvider?: string;
  billingCustomerId?: string;
  billingSubscriptionId?: string;
  billingActivatedAt?: Date;
};

export type UserRecord = {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "COMPANY" | "DRIVER" | "INDIVIDUAL" | "MANAGER" | "SUPER_ADMIN";
  passwordHash?: string;
  demoPassword?: string;
  mustChangePassword: boolean;
  driverId?: string;
  assignedVehicleIds?: string[];
  allowAnyVehicle?: boolean;
  isActive: boolean;
  photoDataUrl?: string;
};

export type DriverRecord = {
  id: string;
  tenantId: string;
  fullName: string;
  cpf?: string;
  registrationId?: string;
  cnh?: string;
  cnhCategory?: string;
  cnhExpiresAt?: string;
  loginEmail?: string;
  assignedVehicleIds: string[];
  allowAnyVehicle: boolean;
  employmentStatus: "ACTIVE" | "VACATION" | "TERMINATED";
  isActive: boolean;
  photoDataUrl?: string;
  temporaryPassword?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type VehicleRecord = {
  id: string;
  tenantId: string;
  plate: string;
  vehicleType: string;
  model: string;
  brand: string;
  year: number;
  fuelType: string;
  currentKm: number;
  ownerName: string;
  companyName?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type FuelLogRecord = {
  id: string;
  tenantId: string;
  vehicleId: string;
  driverId?: string;
  fueledAt: string;
  odometerKm: number;
  fuelType: string;
  liters: number;
  totalCost: number;
  pricePerLiter: number;
  stationName?: string;
  notes?: string;
  receiptPhotoDataUrl?: string;
  fuelingAddress?: string;
  fuelingLatitude?: number;
  fuelingLongitude?: number;
  previousKm?: number;
  distanceKm: number;
  averageConsumption: number;
  createdAt: Date;
  updatedAt: Date;
};

export type AlertRecord = {
  id: string;
  tenantId: string;
  title: string;
  severity: string;
  createdAt: Date;
};

export type SyncEventRecord = {
  id: string;
  tenantId: string;
  deviceId: string;
  entity: string;
  operation: string;
  operationId: string;
  payload: Record<string, unknown>;
  status: string;
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ActivityLogRecord = {
  id: string;
  tenantId: string;
  entity: string;
  action: string;
  title: string;
  details?: string;
  createdAt: Date;
};

export type PasswordResetCodeRecord = {
  id: string;
  userId: string;
  email: string;
  codeHash: string;
  codeSalt: string;
  attempts: number;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MaintenanceRecord = {
  id: string;
  tenantId: string;
  vehicleId: string;
  title: string;
  maintenanceType: string;
  performedAt: Date;
  odometerKm: number;
  totalCost: number;
  supplierName?: string;
  notes?: string;
  nextMaintenanceAt?: Date;
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
  vehicle: {
    plate: string;
    model: string;
  };
};
