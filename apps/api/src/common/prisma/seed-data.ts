import type {
  ActivityLogRecord,
  AlertRecord,
  DriverRecord,
  FuelLogRecord,
  MaintenanceRecord,
  SyncEventRecord,
  TenantRecord,
  UserRecord,
  VehicleRecord
} from "./records.js";

export const tenantsSeed: TenantRecord[] = [
  {
    id: "tenant-sol",
    name: "Transportes Sol",
    accountType: "COMPANY",
    documentNumber: "12.345.678/0001-99",
    planCode: "COMPANY_START",
    planStatus: "TRIAL",
    vehicleLimit: 3,
    photoDataUrl: undefined,
    billingProvider: "mercado_pago"
  },
  {
    id: "tenant-user",
    name: "Conta Pessoal Demo",
    accountType: "INDIVIDUAL",
    documentNumber: "123.456.789-10",
    planCode: "ESSENTIAL_FREE",
    planStatus: "TRIAL",
    vehicleLimit: 3,
    photoDataUrl: undefined
  }
];

export const vehiclesSeed: VehicleRecord[] = [
  {
    id: "veh-1",
    tenantId: "tenant-sol",
    plate: "ABC 1D23",
    vehicleType: "CAR",
    brand: "Fiat",
    model: "Strada",
    year: 2023,
    fuelType: "FLEX",
    currentKm: 45210,
    ownerName: "Transportes Sol",
    companyName: "Transportes Sol",
    status: "ACTIVE",
    createdAt: new Date("2026-04-24T13:00:00Z"),
    updatedAt: new Date("2026-04-24T13:00:00Z")
  },
  {
    id: "veh-2",
    tenantId: "tenant-sol",
    plate: "XYZ 9K88",
    vehicleType: "TRUCK",
    brand: "Toyota",
    model: "Hilux",
    year: 2022,
    fuelType: "DIESEL",
    currentKm: 80115,
    ownerName: "Transportes Sol",
    companyName: "Transportes Sol",
    status: "MAINTENANCE",
    createdAt: new Date("2026-04-24T14:00:00Z"),
    updatedAt: new Date("2026-04-24T14:00:00Z")
  },
  {
    id: "veh-3",
    tenantId: "tenant-user",
    plate: "IND 1A23",
    vehicleType: "CAR",
    brand: "Honda",
    model: "Fit",
    year: 2021,
    fuelType: "FLEX",
    currentKm: 35220,
    ownerName: "Usuário Demo",
    status: "ACTIVE",
    createdAt: new Date("2026-04-23T13:00:00Z"),
    updatedAt: new Date("2026-04-23T13:00:00Z")
  },
  {
    id: "veh-4",
    tenantId: "tenant-user",
    plate: "IND 4B56",
    vehicleType: "CAR",
    brand: "Renault",
    model: "Kwid",
    year: 2020,
    fuelType: "GASOLINE",
    currentKm: 18450,
    ownerName: "Usuário Demo",
    status: "ACTIVE",
    createdAt: new Date("2026-04-22T13:00:00Z"),
    updatedAt: new Date("2026-04-22T13:00:00Z")
  },
  {
    id: "veh-5",
    tenantId: "tenant-user",
    plate: "IND 7C89",
    vehicleType: "CAR",
    brand: "VW",
    model: "Gol",
    year: 2019,
    fuelType: "ETHANOL",
    currentKm: 50990,
    ownerName: "Usuário Demo",
    status: "ACTIVE",
    createdAt: new Date("2026-04-21T13:00:00Z"),
    updatedAt: new Date("2026-04-21T13:00:00Z")
  }
];

export const usersSeed: UserRecord[] = [
  {
    id: "user-admin-1",
    tenantId: "tenant-sol",
    email: "demo@fleet.local",
    fullName: "Administrador Demo",
    role: "ADMIN",
    demoPassword: "demo1234",
    mustChangePassword: false,
    isActive: true
  },
  {
    id: "user-individual-1",
    tenantId: "tenant-user",
    email: "user@fleet.local",
    fullName: "Usuário Demo",
    role: "INDIVIDUAL",
    demoPassword: "demo1234",
    mustChangePassword: false,
    isActive: true
  },
  {
    id: "user-driver-1",
    tenantId: "tenant-sol",
    email: "carlos@fleet.local",
    fullName: "Carlos Almeida",
    role: "DRIVER",
    demoPassword: "demo1234",
    mustChangePassword: true,
    driverId: "driver-1",
    assignedVehicleIds: ["veh-1"],
    allowAnyVehicle: false,
    isActive: true
  },
  {
    id: "user-driver-2",
    tenantId: "tenant-sol",
    email: "mariana@fleet.local",
    fullName: "Mariana Souza",
    role: "DRIVER",
    demoPassword: "demo1234",
    mustChangePassword: true,
    driverId: "driver-2",
    assignedVehicleIds: ["veh-2"],
    allowAnyVehicle: true,
    isActive: true
  }
];

export const driversSeed: DriverRecord[] = [
  {
    id: "driver-1",
    tenantId: "tenant-sol",
    fullName: "Carlos Almeida",
    cpf: "123.456.789-10",
    registrationId: "MT-1001",
    cnh: "9988776655",
    cnhCategory: "B",
    cnhExpiresAt: "2027-08-10",
    loginEmail: "carlos@fleet.local",
    assignedVehicleIds: ["veh-1"],
    allowAnyVehicle: false,
    employmentStatus: "ACTIVE",
    isActive: true,
    photoDataUrl: undefined,
    createdAt: new Date("2026-04-20T10:00:00Z"),
    updatedAt: new Date("2026-04-20T10:00:00Z")
  },
  {
    id: "driver-2",
    tenantId: "tenant-sol",
    fullName: "Mariana Souza",
    cpf: "321.654.987-00",
    registrationId: "MT-1002",
    cnh: "1122334455",
    cnhCategory: "AB",
    cnhExpiresAt: "2026-12-14",
    loginEmail: "mariana@fleet.local",
    assignedVehicleIds: ["veh-2"],
    allowAnyVehicle: true,
    employmentStatus: "ACTIVE",
    isActive: true,
    photoDataUrl: undefined,
    createdAt: new Date("2026-04-24T10:00:00Z"),
    updatedAt: new Date("2026-04-24T10:00:00Z")
  }
];

export const fuelLogsSeed: FuelLogRecord[] = [
  {
    id: "fuel-1",
    tenantId: "tenant-sol",
    vehicleId: "veh-1",
    driverId: "driver-1",
    fueledAt: "2026-04-25",
    odometerKm: 45100,
    fuelType: "FLEX",
    liters: 42.5,
    totalCost: 249.9,
    pricePerLiter: 5.88,
    stationName: "Posto Avenida",
    notes: "Abastecimento de rotina",
    previousKm: 45020,
    distanceKm: 80,
    averageConsumption: 1.88,
    createdAt: new Date("2026-04-25T08:30:00Z"),
    updatedAt: new Date("2026-04-25T08:30:00Z")
  },
  {
    id: "fuel-2",
    tenantId: "tenant-sol",
    vehicleId: "veh-2",
    driverId: "driver-2",
    fueledAt: "2026-04-24",
    odometerKm: 79980,
    fuelType: "DIESEL",
    liters: 55,
    totalCost: 352,
    pricePerLiter: 6.4,
    stationName: "Posto Rodovia",
    notes: "Trecho intermunicipal",
    previousKm: 79820,
    distanceKm: 160,
    averageConsumption: 2.91,
    createdAt: new Date("2026-04-24T11:30:00Z"),
    updatedAt: new Date("2026-04-24T11:30:00Z")
  }
];

export const alertsSeed: AlertRecord[] = [
  {
    id: "alert-1",
    tenantId: "tenant-sol",
    title: "CNH vence em 7 dias",
    severity: "warning",
    createdAt: new Date("2026-04-24T10:00:00Z")
  },
  {
    id: "alert-2",
    tenantId: "tenant-sol",
    title: "KM inconsistente no último abastecimento",
    severity: "critical",
    createdAt: new Date("2026-04-25T10:00:00Z")
  }
];

export const syncEventsSeed: SyncEventRecord[] = [
  {
    id: "sync-1",
    tenantId: "tenant-sol",
    deviceId: "device-demo-1",
    entity: "fuel",
    operation: "create",
    operationId: "op-demo-1",
    payload: {},
    status: "PENDING",
    errorMessage: null,
    createdAt: new Date("2026-04-25T08:00:00Z"),
    updatedAt: new Date("2026-04-25T08:00:00Z")
  },
  {
    id: "sync-2",
    tenantId: "tenant-sol",
    deviceId: "device-demo-1",
    entity: "maintenance",
    operation: "create",
    operationId: "op-demo-2",
    payload: {},
    status: "PROCESSING",
    errorMessage: null,
    createdAt: new Date("2026-04-25T08:05:00Z"),
    updatedAt: new Date("2026-04-25T08:05:00Z")
  }
];

export const maintenanceSeed: MaintenanceRecord[] = [
  {
    id: "maintenance-1",
    tenantId: "tenant-sol",
    vehicleId: "veh-1",
    title: "Troca de óleo",
    maintenanceType: "PREVENTIVE",
    performedAt: new Date("2026-04-10T10:00:00Z"),
    odometerKm: 44000,
    totalCost: 320,
    supplierName: "Oficina Central",
    notes: "Troca de óleo e filtro",
    nextMaintenanceAt: new Date("2026-05-10T10:00:00Z"),
    oilType: "5W30",
    oilBrand: "Shell Helix",
    oilCost: 220,
    changedOilFilter: true,
    changedAirFilter: true,
    changedFuelFilter: false,
    vehicle: {
      plate: "ABC 1D23",
      model: "Strada"
    }
  },
  {
    id: "maintenance-2",
    tenantId: "tenant-sol",
    vehicleId: "veh-2",
    title: "Freios",
    maintenanceType: "CORRECTIVE",
    performedAt: new Date("2026-04-15T10:00:00Z"),
    odometerKm: 79000,
    totalCost: 980,
    supplierName: "Freios Brasil",
    notes: "Pastilhas dianteiras",
    nextMaintenanceKm: 80320,
    brakeService: "Troca de pastilhas dianteiras e revisão do disco",
    vehicle: {
      plate: "XYZ 9K88",
      model: "Hilux"
    }
  }
];

export const activitySeed: ActivityLogRecord[] = [
  {
    id: "activity-1",
    tenantId: "tenant-sol",
    entity: "vehicle",
    action: "create",
    title: "Veículo cadastrado: ABC 1D23",
    details: "Entrada inicial da frota",
    createdAt: new Date("2026-04-24T13:05:00Z")
  },
  {
    id: "activity-2",
    tenantId: "tenant-sol",
    entity: "fuel",
    action: "create",
    title: "Abastecimento registrado para ABC 1D23",
    details: "KM atualizado e consumo calculado",
    createdAt: new Date("2026-04-25T08:15:00Z")
  }
];
