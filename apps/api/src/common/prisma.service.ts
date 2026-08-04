import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import * as argon2 from "argon2";
import { Pool, PoolClient } from "pg";

import { PtBrMessage } from "./messages.js";
import type {
  ActivityLogRecord,
  AlertRecord,
  DriverRecord,
  FuelLogRecord,
  MaintenanceRecord,
  PasswordResetCodeRecord,
  SyncEventRecord,
  TenantRecord,
  UserRecord,
  VehicleRecord
} from "./prisma/records.js";
import { decryptSensitiveValue, encryptSensitiveValue } from "./sensitive-data.js";
import {
  activitySeed,
  alertsSeed,
  driversSeed,
  fuelLogsSeed,
  maintenanceSeed,
  syncEventsSeed,
  tenantsSeed,
  usersSeed,
  vehiclesSeed
} from "./prisma/seed-data.js";
import { PRISMA_SCHEMA_SQL } from "./prisma/schema.js";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://fleet:fleet@localhost:5432/fleet_platform";
const pool = new Pool({
  connectionString: databaseUrl
});

const severityRank: Record<string, number> = {
  critical: 3,
  warning: 2,
  info: 1
};

function toStringOrUndefined(value: unknown) {
  return value === null || value === undefined ? undefined : String(value);
}

function toNumber(value: unknown) {
  return value === null || value === undefined || value === "" ? 0 : Number(value);
}

function toBoolean(value: unknown) {
  return Boolean(value);
}

function normalizePlate(value: unknown) {
  const clean = String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
  if (clean.length <= 3) {
    return clean;
  }
  return `${clean.slice(0, 3)} ${clean.slice(3)}`;
}

function toDateOrUndefined(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  return value instanceof Date ? value : new Date(String(value));
}

function toDateString(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

function toDateTimeString(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item));
}

function hashResetCode(code: string, salt: string) {
  return createHash("sha256").update(`${salt}:${code}`).digest("hex");
}

function buildArrayParam(values?: string[] | null) {
  return values && values.length > 0 ? values : [];
}

function compareValues(left: unknown, right: unknown) {
  if (left === right) {
    return 0;
  }

  if (left === null || left === undefined) {
    return 1;
  }

  if (right === null || right === undefined) {
    return -1;
  }

  const leftDate = left instanceof Date ? left.getTime() : Date.parse(String(left));
  const rightDate = right instanceof Date ? right.getTime() : Date.parse(String(right));
  const leftIsDate = Number.isFinite(leftDate);
  const rightIsDate = Number.isFinite(rightDate);

  if (leftIsDate && rightIsDate) {
    return leftDate - rightDate;
  }

  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left).localeCompare(String(right));
}

function sortByOrder<T extends Record<string, unknown>>(
  rows: T[],
  orderBy?: Record<string, "asc" | "desc"> | Array<Record<string, "asc" | "desc">>
) {
  if (!orderBy) {
    return rows;
  }

  const clauses = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...rows].sort((left, right) => {
    for (const clause of clauses) {
      const [field, direction] = Object.entries(clause)[0] ?? [];
      if (!field) {
        continue;
      }

      let leftValue = left[field];
      let rightValue = right[field];

      if (field === "severity") {
        leftValue = severityRank[String(leftValue)] ?? 0;
        rightValue = severityRank[String(rightValue)] ?? 0;
      }

      const comparison = compareValues(leftValue, rightValue);
      if (comparison !== 0) {
        return direction === "desc" ? -comparison : comparison;
      }
    }
    return 0;
  });
}

async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function ensureSchema(client: PoolClient) {
  await client.query(PRISMA_SCHEMA_SQL);
}

async function reencryptLegacySensitiveData(client: PoolClient) {
  const tenants = await client.query<{ id: string; document_number: string | null }>(
    "SELECT id, document_number FROM tenants WHERE document_number IS NOT NULL"
  );

  for (const tenant of tenants.rows) {
    const encryptedDocumentNumber = encryptSensitiveValue(tenant.document_number);
    if (encryptedDocumentNumber !== tenant.document_number) {
      await client.query("UPDATE tenants SET document_number = $2, updated_at = NOW() WHERE id = $1", [
        tenant.id,
        encryptedDocumentNumber
      ]);
    }
  }

  const drivers = await client.query<{ id: string; cpf: string | null; cnh: string | null }>(
    "SELECT id, cpf, cnh FROM drivers"
  );

  for (const driver of drivers.rows) {
    const encryptedCpf = encryptSensitiveValue(driver.cpf);
    const encryptedCnh = encryptSensitiveValue(driver.cnh);

    if (encryptedCpf !== driver.cpf || encryptedCnh !== driver.cnh) {
      await client.query(
        "UPDATE drivers SET cpf = $2, cnh = $3, updated_at = NOW() WHERE id = $1",
        [driver.id, encryptedCpf, encryptedCnh]
      );
    }
  }
}

async function seedDatabase(client: PoolClient) {
  const tenantCount = await client.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM tenants");
  if (Number(tenantCount.rows[0]?.count ?? "0") > 0) {
    return;
  }

  for (const tenant of tenantsSeed) {
    await client.query(
      `
        INSERT INTO tenants (
          id, name, account_type, document_number, plan_code, plan_status,
          vehicle_limit, billing_provider, billing_customer_id, billing_subscription_id,
          billing_activated_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        )
      `,
      [
        tenant.id,
        tenant.name,
        tenant.accountType,
        encryptSensitiveValue(tenant.documentNumber ?? null),
        tenant.planCode,
        tenant.planStatus,
        tenant.vehicleLimit ?? null,
        tenant.billingProvider ?? null,
        tenant.billingCustomerId ?? null,
        tenant.billingSubscriptionId ?? null,
        tenant.billingActivatedAt ?? null,
        new Date("2026-04-20T00:00:00Z"),
        new Date("2026-04-20T00:00:00Z")
      ]
    );
  }

  for (const vehicle of vehiclesSeed) {
    await client.query(
      `
        INSERT INTO vehicles (
          id, tenant_id, plate, vehicle_type, model, brand, year, fuel_type, current_km,
          owner_name, company_name, status, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      `,
      [
        vehicle.id,
        vehicle.tenantId,
        vehicle.plate,
        vehicle.vehicleType,
        vehicle.model,
        vehicle.brand,
        vehicle.year,
        vehicle.fuelType,
        vehicle.currentKm,
        vehicle.ownerName,
        vehicle.companyName ?? null,
        vehicle.status,
        vehicle.createdAt,
        vehicle.updatedAt
      ]
    );
  }

  for (const driver of driversSeed) {
    await client.query(
      `
        INSERT INTO drivers (
          id, tenant_id, full_name, cpf, registration_id, cnh, cnh_category, cnh_expires_at,
          login_email, assigned_vehicle_ids, allow_any_vehicle, employment_status, is_active, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      `,
      [
        driver.id,
        driver.tenantId,
        driver.fullName,
        encryptSensitiveValue(driver.cpf ?? null),
        driver.registrationId ?? null,
        encryptSensitiveValue(driver.cnh),
        driver.cnhCategory,
        driver.cnhExpiresAt,
        driver.loginEmail ?? null,
        driver.assignedVehicleIds,
        driver.allowAnyVehicle,
        driver.employmentStatus,
        driver.isActive,
        driver.createdAt,
        driver.updatedAt
      ]
    );
  }

  for (const user of usersSeed) {
    const passwordHash =
      user.passwordHash ?? (user.demoPassword ? await argon2.hash(user.demoPassword) : null);

    await client.query(
      `
        INSERT INTO users (
          id, tenant_id, email, full_name, role, password_hash, demo_password,
          must_change_password, driver_id, assigned_vehicle_ids, allow_any_vehicle, is_active, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      `,
      [
        user.id,
        user.tenantId,
        user.email,
        user.fullName,
        user.role,
        passwordHash,
        null,
        user.mustChangePassword,
        user.driverId ?? null,
        buildArrayParam(user.assignedVehicleIds),
        user.allowAnyVehicle ?? false,
        user.isActive,
        new Date(),
        new Date()
      ]
    );
  }

  for (const fuelLog of fuelLogsSeed) {
    await client.query(
      `
        INSERT INTO fuel_logs (
          id, tenant_id, vehicle_id, driver_id, fueled_at, odometer_km, fuel_type,
          liters, total_cost, price_per_liter, station_name, notes, previous_km,
          distance_km, average_consumption, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      `,
      [
        fuelLog.id,
        fuelLog.tenantId,
        fuelLog.vehicleId,
        fuelLog.driverId ?? null,
        fuelLog.fueledAt,
        fuelLog.odometerKm,
        fuelLog.fuelType,
        fuelLog.liters,
        fuelLog.totalCost,
        fuelLog.pricePerLiter,
        fuelLog.stationName ?? null,
        fuelLog.notes ?? null,
        fuelLog.previousKm ?? null,
        fuelLog.distanceKm,
        fuelLog.averageConsumption,
        fuelLog.createdAt,
        fuelLog.createdAt
      ]
    );
  }

  for (const alert of alertsSeed) {
    await client.query(
      `
        INSERT INTO alerts (id, tenant_id, title, severity, created_at)
        VALUES ($1,$2,$3,$4,$5)
      `,
      [alert.id, alert.tenantId, alert.title, alert.severity, alert.createdAt]
    );
  }

  for (const syncEvent of syncEventsSeed) {
    await client.query(
      `
        INSERT INTO sync_events (
          id, tenant_id, device_id, entity, operation, operation_id, payload,
          status, error_message, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      `,
      [
        syncEvent.id,
        syncEvent.tenantId,
        syncEvent.deviceId,
        syncEvent.entity,
        syncEvent.operation,
        syncEvent.operationId,
        JSON.stringify(syncEvent.payload ?? {}),
        syncEvent.status,
        syncEvent.errorMessage ?? null,
        syncEvent.createdAt,
        syncEvent.updatedAt
      ]
    );
  }

  for (const maintenance of maintenanceSeed) {
    await client.query(
      `
        INSERT INTO maintenance_logs (
          id, tenant_id, vehicle_id, title, maintenance_type, performed_at, odometer_km,
          total_cost, supplier_name, notes, next_maintenance_at, next_maintenance_km,
          oil_type, oil_brand, oil_cost, changed_oil_filter, changed_air_filter,
          changed_fuel_filter, tire_brand, tire_quantity, tire_unit_cost, battery_brand,
          battery_cost, battery_voltage, brake_service, belt_changed, part_name, part_brand,
          part_cost, created_at, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,
          $23,$24,$25,$26,$27,$28,$29,$30,$31
        )
      `,
      [
        maintenance.id,
        maintenance.tenantId,
        maintenance.vehicleId,
        maintenance.title,
        maintenance.maintenanceType,
        toDateString(maintenance.performedAt) ?? maintenance.performedAt,
        maintenance.odometerKm,
        maintenance.totalCost,
        maintenance.supplierName ?? null,
        maintenance.notes ?? null,
        toDateString(maintenance.nextMaintenanceAt) ?? null,
        maintenance.nextMaintenanceKm ?? null,
        maintenance.oilType ?? null,
        maintenance.oilBrand ?? null,
        maintenance.oilCost ?? null,
        maintenance.changedOilFilter ?? null,
        maintenance.changedAirFilter ?? null,
        maintenance.changedFuelFilter ?? null,
        maintenance.tireBrand ?? null,
        maintenance.tireQuantity ?? null,
        maintenance.tireUnitCost ?? null,
        maintenance.batteryBrand ?? null,
        maintenance.batteryCost ?? null,
        maintenance.batteryVoltage ?? null,
        maintenance.brakeService ?? null,
        maintenance.beltChanged ?? null,
        maintenance.partName ?? null,
        maintenance.partBrand ?? null,
        maintenance.partCost ?? null,
        new Date(),
        new Date()
      ]
    );
  }

  for (const activity of activitySeed) {
    await client.query(
      `
        INSERT INTO activity_logs (
          id, tenant_id, entity, action, title, details, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      `,
      [
        activity.id,
        activity.tenantId,
        activity.entity,
        activity.action,
        activity.title,
        activity.details ?? null,
        activity.createdAt
      ]
    );
  }
}

type SortDirection = "asc" | "desc";

type FindManyArgs<TWhere = Record<string, unknown>> = {
  where?: TWhere;
  orderBy?: Record<string, SortDirection> | Array<Record<string, SortDirection>>;
  take?: number;
  include?: Record<string, boolean>;
  select?: Record<string, boolean>;
};

type CreateArgs<TData> = {
  data: TData;
};

type UpdateArgs<TData> = {
  where: Record<string, string>;
  data: TData;
};

type FindUniqueArgs = {
  where: Record<string, string>;
};

type UpsertArgs<TCreate, TUpdate> = {
  where: Record<string, string>;
  create: TCreate;
  update: TUpdate;
};

type Repository<TRecord = Record<string, unknown>> = {
  findMany(args?: FindManyArgs): Promise<TRecord[]>;
  findUnique(args: FindUniqueArgs): Promise<TRecord | null>;
  create(args: CreateArgs<Record<string, unknown>>): Promise<TRecord>;
  update(args: UpdateArgs<Record<string, unknown>>): Promise<TRecord>;
  count(args?: { where?: Record<string, unknown> }): Promise<number>;
  upsert(
    args: UpsertArgs<Record<string, unknown>, Record<string, unknown>>
  ): Promise<TRecord>;
};

function createRepository<TRecord = Record<string, unknown>>(): Repository<TRecord> {
  return {
    async findMany() {
      return [];
    },
    async findUnique() {
      return null;
    },
    async create(args) {
      return args.data as TRecord;
    },
    async update(args) {
      return {
        ...(args.data as object),
        ...(args.where as object)
      } as TRecord;
    },
    async count() {
      return 0;
    },
    async upsert(args) {
      return {
        ...(args.create as object),
        ...(args.update as object)
      } as TRecord;
    }
  };
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private initializationPromise: Promise<void> | null = null;

  private async ensureReady() {
    if (!this.initializationPromise) {
      this.initializationPromise = withTransaction(async (client) => {
        await ensureSchema(client);
        await seedDatabase(client);
        await reencryptLegacySensitiveData(client);
      });
    }

    await this.initializationPromise;
  }

  private mapTenantRow(row: Record<string, unknown>): TenantRecord {
    return {
      id: String(row.id),
      name: String(row.name),
      accountType: String(row.account_type) as "COMPANY" | "INDIVIDUAL",
      documentNumber: decryptSensitiveValue(toStringOrUndefined(row.document_number)),
      planCode: String(row.plan_code ?? "ESSENTIAL_FREE"),
      planStatus: String(row.plan_status ?? "TRIAL") as "TRIAL" | "ACTIVE" | "INACTIVE",
      vehicleLimit:
        row.vehicle_limit === null || row.vehicle_limit === undefined
          ? undefined
          : Number(row.vehicle_limit),
      photoDataUrl: toStringOrUndefined(row.photo_data_url),
      billingProvider: toStringOrUndefined(row.billing_provider),
      billingCustomerId: toStringOrUndefined(row.billing_customer_id),
      billingSubscriptionId: toStringOrUndefined(row.billing_subscription_id),
      billingActivatedAt: toDateOrUndefined(row.billing_activated_at)
    };
  }

  private mapUserRow(row: Record<string, unknown>): UserRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      email: String(row.email),
      fullName: String(row.full_name),
      role: String(row.role) as "ADMIN" | "COMPANY" | "DRIVER" | "INDIVIDUAL",
      passwordHash: toStringOrUndefined(row.password_hash),
      demoPassword: toStringOrUndefined(row.demo_password),
      mustChangePassword: Boolean(row.must_change_password),
      driverId: toStringOrUndefined(row.driver_id),
      assignedVehicleIds: toStringArray(row.assigned_vehicle_ids),
      allowAnyVehicle: Boolean(row.allow_any_vehicle),
      isActive: Boolean(row.is_active),
      photoDataUrl: toStringOrUndefined(row.photo_data_url)
    };
  }

  private mapDriverRow(row: Record<string, unknown>): DriverRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      fullName: String(row.full_name),
      cpf: decryptSensitiveValue(toStringOrUndefined(row.cpf)),
      registrationId: toStringOrUndefined(row.registration_id),
      cnh: decryptSensitiveValue(toStringOrUndefined(row.cnh)),
      cnhCategory: toStringOrUndefined(row.cnh_category),
      cnhExpiresAt: toStringOrUndefined(row.cnh_expires_at),
      loginEmail: toStringOrUndefined(row.login_email),
      assignedVehicleIds: toStringArray(row.assigned_vehicle_ids),
      allowAnyVehicle: Boolean(row.allow_any_vehicle),
      employmentStatus: String(row.employment_status ?? (row.is_active ? "ACTIVE" : "VACATION")) as "ACTIVE" | "VACATION" | "TERMINATED",
      isActive: Boolean(row.is_active),
      photoDataUrl: toStringOrUndefined(row.photo_data_url),
      createdAt: new Date(String(row.created_at)),
      updatedAt: new Date(String(row.updated_at))
    };
  }

  private mapVehicleRow(row: Record<string, unknown>): VehicleRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      plate: String(row.plate),
      vehicleType: String(row.vehicle_type ?? "CAR"),
      model: String(row.model),
      brand: String(row.brand),
      year: Number(row.year),
      fuelType: String(row.fuel_type),
      currentKm: Number(row.current_km),
      ownerName: String(row.owner_name),
      companyName: toStringOrUndefined(row.company_name),
      status: String(row.status),
      createdAt: new Date(String(row.created_at)),
      updatedAt: new Date(String(row.updated_at))
    };
  }

  private mapFuelLogRow(row: Record<string, unknown>): FuelLogRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      vehicleId: String(row.vehicle_id),
      driverId: toStringOrUndefined(row.driver_id),
      fueledAt: String(row.fueled_at),
      odometerKm: Number(row.odometer_km),
      fuelType: String(row.fuel_type),
      liters: Number(row.liters),
      totalCost: Number(row.total_cost),
      pricePerLiter: Number(row.price_per_liter),
      stationName: toStringOrUndefined(row.station_name),
      notes: toStringOrUndefined(row.notes),
      receiptPhotoDataUrl: toStringOrUndefined(row.receipt_photo_data_url),
      fuelingAddress: toStringOrUndefined(row.fueling_address),
      fuelingLatitude:
        row.fueling_latitude === null || row.fueling_latitude === undefined
          ? undefined
          : Number(row.fueling_latitude),
      fuelingLongitude:
        row.fueling_longitude === null || row.fueling_longitude === undefined
          ? undefined
          : Number(row.fueling_longitude),
      previousKm: row.previous_km === null || row.previous_km === undefined ? undefined : Number(row.previous_km),
      distanceKm: Number(row.distance_km ?? 0),
      averageConsumption: Number(row.average_consumption ?? 0),
      createdAt: new Date(String(row.created_at)),
      updatedAt: new Date(String(row.updated_at))
    };
  }

  private mapAlertRow(row: Record<string, unknown>): AlertRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      title: String(row.title),
      severity: String(row.severity),
      createdAt: new Date(String(row.created_at))
    };
  }

  private mapSyncEventRow(row: Record<string, unknown>): SyncEventRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      deviceId: String(row.device_id),
      entity: String(row.entity),
      operation: String(row.operation),
      operationId: String(row.operation_id),
      payload: typeof row.payload === "object" && row.payload !== null ? (row.payload as Record<string, unknown>) : {},
      status: String(row.status),
      errorMessage: toStringOrUndefined(row.error_message) ?? null,
      createdAt: new Date(String(row.created_at)),
      updatedAt: new Date(String(row.updated_at))
    };
  }

  private mapMaintenanceRow(row: Record<string, unknown>): MaintenanceRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      vehicleId: String(row.vehicle_id),
      title: String(row.title),
      maintenanceType: String(row.maintenance_type),
      performedAt: new Date(String(row.performed_at)),
      odometerKm: Number(row.odometer_km),
      totalCost: Number(row.total_cost),
      supplierName: toStringOrUndefined(row.supplier_name),
      notes: toStringOrUndefined(row.notes),
      nextMaintenanceAt: toDateOrUndefined(row.next_maintenance_at),
      nextMaintenanceKm:
        row.next_maintenance_km === null || row.next_maintenance_km === undefined
          ? undefined
          : Number(row.next_maintenance_km),
      oilType: toStringOrUndefined(row.oil_type),
      oilBrand: toStringOrUndefined(row.oil_brand),
      oilCost: row.oil_cost === null || row.oil_cost === undefined ? undefined : Number(row.oil_cost),
      previousOilChangeAt: toStringOrUndefined(row.previous_oil_change_at),
      previousOilChangeKm:
        row.previous_oil_change_km === null || row.previous_oil_change_km === undefined
          ? undefined
          : Number(row.previous_oil_change_km),
      previousOilChangeNotes: toStringOrUndefined(row.previous_oil_change_notes),
      changedOilFilter: row.changed_oil_filter === null || row.changed_oil_filter === undefined ? undefined : Boolean(row.changed_oil_filter),
      changedAirFilter: row.changed_air_filter === null || row.changed_air_filter === undefined ? undefined : Boolean(row.changed_air_filter),
      changedFuelFilter: row.changed_fuel_filter === null || row.changed_fuel_filter === undefined ? undefined : Boolean(row.changed_fuel_filter),
      tireBrand: toStringOrUndefined(row.tire_brand),
      tireQuantity:
        row.tire_quantity === null || row.tire_quantity === undefined ? undefined : Number(row.tire_quantity),
      tireUnitCost:
        row.tire_unit_cost === null || row.tire_unit_cost === undefined ? undefined : Number(row.tire_unit_cost),
      batteryBrand: toStringOrUndefined(row.battery_brand),
      batteryCost:
        row.battery_cost === null || row.battery_cost === undefined ? undefined : Number(row.battery_cost),
      batteryVoltage: toStringOrUndefined(row.battery_voltage),
      brakeService: toStringOrUndefined(row.brake_service),
      beltChanged:
        row.belt_changed === null || row.belt_changed === undefined ? undefined : Boolean(row.belt_changed),
      partName: toStringOrUndefined(row.part_name),
      partBrand: toStringOrUndefined(row.part_brand),
      partCost:
        row.part_cost === null || row.part_cost === undefined ? undefined : Number(row.part_cost),
      vehicle: {
        plate: String(row.vehicle_plate ?? ""),
        model: String(row.vehicle_model ?? "")
      }
    };
  }

  private mapActivityRow(row: Record<string, unknown>): ActivityLogRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      entity: String(row.entity),
      action: String(row.action),
      title: String(row.title),
      details: toStringOrUndefined(row.details),
      createdAt: new Date(String(row.created_at))
    };
  }

  private async syncDriverUser(client: PoolClient, driver: DriverRecord): Promise<string | undefined> {
    if (!driver.loginEmail) {
      return undefined;
    }

    const existing = await client.query<{ id: string; password_hash: string | null; demo_password: string | null }>(
      "SELECT id, password_hash, demo_password FROM users WHERE driver_id = $1 LIMIT 1",
      [driver.id]
    );

    if (existing.rows[0]) {
      // Preserve a MANAGER promotion across driver edits — this sync would
      // otherwise silently demote a Gestor back to DRIVER on every save.
      await client.query(
        `
          UPDATE users
          SET email = $1, tenant_id = $2, full_name = $3,
              role = CASE WHEN role = 'MANAGER' THEN 'MANAGER' ELSE 'DRIVER' END,
              driver_id = $4, assigned_vehicle_ids = $5, allow_any_vehicle = $6,
              is_active = $7,
              updated_at = NOW()
          WHERE driver_id = $4
        `,
        [
          driver.loginEmail,
          driver.tenantId,
          driver.fullName,
          driver.id,
          driver.assignedVehicleIds,
          driver.allowAnyVehicle,
          driver.isActive
        ]
      );
      return undefined;
    }

    const temporaryPassword = randomInt(0, 1000000).toString().padStart(6, "0");

    await client.query(
      `
        INSERT INTO users (
          id, tenant_id, email, full_name, role, password_hash, demo_password,
          must_change_password, driver_id, assigned_vehicle_ids, allow_any_vehicle, is_active, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,'DRIVER',$5,NULL,TRUE,$6,$7,$8,$9,NOW(),NOW())
      `,
      [
        randomUUID(),
        driver.tenantId,
        driver.loginEmail,
        driver.fullName,
        await argon2.hash(temporaryPassword),
        driver.id,
        driver.assignedVehicleIds,
        driver.allowAnyVehicle,
        driver.isActive
      ]
    );

    return temporaryPassword;
  }

  tenant = {
    findMany: async (_args?: FindManyArgs) => {
      await this.ensureReady();
      const result = await pool.query("SELECT * FROM tenants ORDER BY created_at ASC");
      return result.rows.map((row: Record<string, unknown>) => this.mapTenantRow(row));
    },
    findUnique: async (args: FindUniqueArgs) => {
      await this.ensureReady();
      const result = await pool.query("SELECT * FROM tenants WHERE id = $1 LIMIT 1", [args.where.id]);
      return result.rows[0] ? this.mapTenantRow(result.rows[0]) : null;
    },
    create: async (args: CreateArgs<Record<string, unknown>>) => {
      await this.ensureReady();
      const recordId = randomUUID();
      const result = await pool.query(
        `
          INSERT INTO tenants (
            id, name, account_type, document_number, plan_code, plan_status,
            vehicle_limit, photo_data_url, billing_provider, billing_customer_id, billing_subscription_id,
            billing_activated_at, created_at, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
          RETURNING *
        `,
        [
          recordId,
          String(args.data.name),
          String(args.data.accountType),
          encryptSensitiveValue(args.data.documentNumber ? String(args.data.documentNumber) : null),
          String(args.data.planCode ?? "ESSENTIAL_FREE"),
          String(args.data.planStatus ?? "TRIAL"),
          args.data.vehicleLimit === undefined || args.data.vehicleLimit === null
            ? null
            : Number(args.data.vehicleLimit),
          args.data.photoDataUrl ? String(args.data.photoDataUrl) : null,
          args.data.billingProvider ? String(args.data.billingProvider) : null,
          args.data.billingCustomerId ? String(args.data.billingCustomerId) : null,
          args.data.billingSubscriptionId ? String(args.data.billingSubscriptionId) : null,
          args.data.billingActivatedAt ? new Date(String(args.data.billingActivatedAt)) : null
        ]
      );
      return this.mapTenantRow(result.rows[0]);
    },
    update: async (args: UpdateArgs<Record<string, unknown>>) => {
      await this.ensureReady();
      const current = await this.tenant.findUnique({ where: { id: args.where.id } });
      if (!current) {
        throw new Error(PtBrMessage.TENANT_NOT_FOUND);
      }

      const nextVehicleLimit =
        args.data.vehicleLimit === undefined
          ? current.vehicleLimit
          : args.data.vehicleLimit === null
            ? undefined
            : Number(args.data.vehicleLimit);

      const result = await pool.query(
        `
          UPDATE tenants
          SET name = $2,
              account_type = $3,
              document_number = $4,
              plan_code = $5,
              plan_status = $6,
              vehicle_limit = $7,
              photo_data_url = $8,
              billing_provider = $9,
              billing_customer_id = $10,
              billing_subscription_id = $11,
              billing_activated_at = $12,
              updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `,
        [
          args.where.id,
          String(args.data.name ?? current.name),
          String(args.data.accountType ?? current.accountType),
          args.data.documentNumber === undefined
            ? encryptSensitiveValue(current.documentNumber ?? null)
            : args.data.documentNumber === null
              ? null
              : encryptSensitiveValue(String(args.data.documentNumber)),
          String(args.data.planCode ?? current.planCode),
          String(args.data.planStatus ?? current.planStatus),
          nextVehicleLimit ?? null,
          args.data.photoDataUrl === undefined ? current.photoDataUrl ?? null : args.data.photoDataUrl ? String(args.data.photoDataUrl) : null,
          args.data.billingProvider === undefined ? current.billingProvider ?? null : args.data.billingProvider ? String(args.data.billingProvider) : null,
          args.data.billingCustomerId === undefined ? current.billingCustomerId ?? null : args.data.billingCustomerId ? String(args.data.billingCustomerId) : null,
          args.data.billingSubscriptionId === undefined ? current.billingSubscriptionId ?? null : args.data.billingSubscriptionId ? String(args.data.billingSubscriptionId) : null,
          args.data.billingActivatedAt === undefined ? current.billingActivatedAt ?? null : args.data.billingActivatedAt ? new Date(String(args.data.billingActivatedAt)) : null
        ]
      );
      return this.mapTenantRow(result.rows[0]);
    },
    delete: async (args: { where: { id: string } }) => {
      await this.ensureReady();
      await pool.query("DELETE FROM tenants WHERE id = $1", [args.where.id]);
    }
  };

  user = {
    findUnique: async (args: FindUniqueArgs) => {
      await this.ensureReady();
      const key = args.where.id ?? args.where.email;
      const column = args.where.id ? "id" : "email";
      const result = await pool.query(`SELECT * FROM users WHERE ${column} = $1 LIMIT 1`, [key]);
      return result.rows[0] ? this.mapUserRow(result.rows[0]) : null;
    },
    findMany: async (args?: FindManyArgs) => {
      await this.ensureReady();
      const tenantId = args?.where?.tenantId as string | undefined;
      const driverId = args?.where?.driverId as string | undefined;
      let sql = "SELECT * FROM users";
      const params: unknown[] = [];
      const where: string[] = [];
      if (tenantId) {
        params.push(tenantId);
        where.push(`tenant_id = $${params.length}`);
      }
      if (driverId) {
        params.push(driverId);
        where.push(`driver_id = $${params.length}`);
      }
      if (where.length > 0) {
        sql += ` WHERE ${where.join(" AND ")}`;
      }
      const result = await pool.query(sql, params);
      const rows = result.rows.map((row: Record<string, unknown>) => this.mapUserRow(row));
      return sortByOrder(rows, args?.orderBy) as UserRecord[];
    },
    create: async (args: CreateArgs<Record<string, unknown>>) => {
      await this.ensureReady();
      const result = await pool.query(
        `
          INSERT INTO users (
            id, tenant_id, email, full_name, role, password_hash, demo_password,
            must_change_password, driver_id, assigned_vehicle_ids, allow_any_vehicle, is_active, photo_data_url, created_at, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())
          RETURNING *
        `,
        [
          randomUUID(),
          String(args.data.tenantId),
          String(args.data.email),
          String(args.data.fullName),
          String(args.data.role),
          args.data.passwordHash ? String(args.data.passwordHash) : null,
          args.data.demoPassword ? String(args.data.demoPassword) : null,
          args.data.mustChangePassword === undefined ? false : Boolean(args.data.mustChangePassword),
          args.data.driverId ? String(args.data.driverId) : null,
          buildArrayParam(args.data.assignedVehicleIds as string[] | undefined),
          Boolean(args.data.allowAnyVehicle),
          args.data.isActive === undefined ? true : Boolean(args.data.isActive),
          args.data.photoDataUrl ? String(args.data.photoDataUrl) : null
        ]
      );
      return this.mapUserRow(result.rows[0]);
    },
    update: async (args: UpdateArgs<Record<string, unknown>>) => {
      await this.ensureReady();
      const current = await this.user.findUnique({ where: args.where });
      if (!current) {
        throw new Error(PtBrMessage.USER_NOT_FOUND);
      }

      const result = await pool.query(
        `
          UPDATE users
          SET tenant_id = $2,
              email = $3,
              full_name = $4,
              role = $5,
              password_hash = $6,
              demo_password = $7,
              must_change_password = $8,
              driver_id = $9,
              assigned_vehicle_ids = $10,
              allow_any_vehicle = $11,
              is_active = $12,
              photo_data_url = $13,
              updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `,
        [
          args.where.id ?? current.id,
          String(args.data.tenantId ?? current.tenantId),
          String(args.data.email ?? current.email),
          String(args.data.fullName ?? current.fullName),
          String(args.data.role ?? current.role),
          args.data.passwordHash === undefined ? current.passwordHash ?? null : args.data.passwordHash ? String(args.data.passwordHash) : null,
          args.data.demoPassword === undefined ? current.demoPassword ?? null : args.data.demoPassword ? String(args.data.demoPassword) : null,
          args.data.mustChangePassword === undefined ? current.mustChangePassword : Boolean(args.data.mustChangePassword),
          args.data.driverId === undefined ? current.driverId ?? null : args.data.driverId ? String(args.data.driverId) : null,
          args.data.assignedVehicleIds === undefined
            ? current.assignedVehicleIds ?? []
            : toStringArray(args.data.assignedVehicleIds),
          args.data.allowAnyVehicle === undefined
            ? current.allowAnyVehicle
            : Boolean(args.data.allowAnyVehicle),
          args.data.isActive === undefined ? current.isActive : Boolean(args.data.isActive),
          args.data.photoDataUrl === undefined
            ? current.photoDataUrl ?? null
            : args.data.photoDataUrl
              ? String(args.data.photoDataUrl)
              : null
        ]
      );
      return this.mapUserRow(result.rows[0]);
    }
  };

  driver = {
    findMany: async (args?: FindManyArgs) => {
      await this.ensureReady();
      const tenantId = args?.where?.tenantId as string | undefined;
      const params: unknown[] = [];
      let sql = "SELECT * FROM drivers";
      if (tenantId) {
        params.push(tenantId);
        sql += " WHERE tenant_id = $1";
      }
      sql += " ORDER BY created_at DESC";
      const result = await pool.query(sql, params);
      const rows = result.rows.map((row: Record<string, unknown>) => this.mapDriverRow(row));
      return sortByOrder(rows, args?.orderBy) as DriverRecord[];
    },
    findUnique: async (args: FindUniqueArgs) => {
      await this.ensureReady();
      const result = await pool.query("SELECT * FROM drivers WHERE id = $1 LIMIT 1", [args.where.id]);
      return result.rows[0] ? this.mapDriverRow(result.rows[0]) : null;
    },
    create: async (args: CreateArgs<Record<string, unknown>>) => {
      await this.ensureReady();
      const nextEmploymentStatus =
        args.data.employmentStatus === undefined
          ? args.data.isActive === false
            ? "VACATION"
            : "ACTIVE"
          : String(args.data.employmentStatus);
      const nextIsActive = nextEmploymentStatus === "ACTIVE";

      return withTransaction(async (client) => {
        const result = await client.query(
        `
          INSERT INTO drivers (
              id, tenant_id, full_name, cpf, registration_id, cnh, cnh_category, cnh_expires_at,
              login_email, assigned_vehicle_ids, allow_any_vehicle, employment_status, is_active, photo_data_url, created_at, updated_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW())
            RETURNING *
          `,
          [
            randomUUID(),
            String(args.data.tenantId),
            String(args.data.fullName),
            encryptSensitiveValue(args.data.cpf ? String(args.data.cpf) : null),
            args.data.registrationId ? String(args.data.registrationId) : null,
            encryptSensitiveValue(args.data.cnh ? String(args.data.cnh) : null),
            args.data.cnhCategory ? String(args.data.cnhCategory) : null,
            args.data.cnhExpiresAt ? String(args.data.cnhExpiresAt) : null,
            args.data.loginEmail ? String(args.data.loginEmail) : null,
            buildArrayParam(args.data.assignedVehicleIds as string[] | undefined),
            Boolean(args.data.allowAnyVehicle),
            nextEmploymentStatus,
            nextIsActive,
            args.data.photoDataUrl ? String(args.data.photoDataUrl) : null
          ]
        );

        const record = this.mapDriverRow(result.rows[0]);
        const temporaryPassword = await this.syncDriverUser(client, record);
        return temporaryPassword ? { ...record, temporaryPassword } : record;
      });
    },
    update: async (args: UpdateArgs<Record<string, unknown>>) => {
      await this.ensureReady();
      const current = await this.driver.findUnique({ where: { id: args.where.id } });
      if (!current) {
        throw new Error(PtBrMessage.DRIVER_NOT_FOUND);
      }

      const nextLoginEmail =
        args.data.loginEmail === undefined
          ? current.loginEmail
          : args.data.loginEmail
            ? String(args.data.loginEmail)
            : undefined;
      const nextAssignedVehicleIds =
        Array.isArray(args.data.assignedVehicleIds) && args.data.assignedVehicleIds.length > 0
          ? (args.data.assignedVehicleIds as string[])
          : current.assignedVehicleIds;
      const nextAllowAnyVehicle =
        args.data.allowAnyVehicle === undefined
          ? current.allowAnyVehicle
          : Boolean(args.data.allowAnyVehicle);
      const nextEmploymentStatus =
        args.data.employmentStatus === undefined
          ? args.data.isActive === undefined
            ? current.employmentStatus
            : args.data.isActive === false
              ? "VACATION"
              : "ACTIVE"
          : String(args.data.employmentStatus);
      const nextIsActive =
        nextEmploymentStatus === "ACTIVE";

      return withTransaction(async (client) => {
        const result = await client.query(
          `
            UPDATE drivers
            SET full_name = $2,
                cpf = $3,
                registration_id = $4,
                cnh = $5,
                cnh_category = $6,
                cnh_expires_at = $7,
                login_email = $8,
                assigned_vehicle_ids = $9,
                allow_any_vehicle = $10,
                employment_status = $11,
                is_active = $12,
                photo_data_url = $13,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
          `,
          [
            args.where.id,
            String(args.data.fullName ?? current.fullName),
            args.data.cpf === undefined
              ? encryptSensitiveValue(current.cpf ?? null)
              : args.data.cpf
                ? encryptSensitiveValue(String(args.data.cpf))
                : null,
            args.data.registrationId === undefined
              ? current.registrationId ?? null
              : args.data.registrationId
                ? String(args.data.registrationId)
                : null,
            args.data.cnh === undefined
              ? encryptSensitiveValue(current.cnh ?? null)
              : args.data.cnh
                ? encryptSensitiveValue(String(args.data.cnh))
                : null,
            args.data.cnhCategory === undefined
              ? current.cnhCategory ?? null
              : args.data.cnhCategory
                ? String(args.data.cnhCategory)
                : null,
            args.data.cnhExpiresAt === undefined
              ? current.cnhExpiresAt ?? null
              : args.data.cnhExpiresAt
                ? String(args.data.cnhExpiresAt)
                : null,
            nextLoginEmail ?? null,
            nextAssignedVehicleIds,
            nextAllowAnyVehicle,
            nextEmploymentStatus,
            nextIsActive,
            args.data.photoDataUrl === undefined ? current.photoDataUrl ?? null : args.data.photoDataUrl ? String(args.data.photoDataUrl) : null
          ]
        );

        const record = this.mapDriverRow(result.rows[0]);
        const temporaryPassword = await this.syncDriverUser(client, record);
        return temporaryPassword ? { ...record, temporaryPassword } : record;
      });
    },
    delete: async (args: { where: { id: string } }) => {
      await this.ensureReady();
      const current = await this.driver.findUnique({ where: { id: args.where.id } });
      if (!current) {
        throw new Error(PtBrMessage.DRIVER_NOT_FOUND);
      }

      return withTransaction(async (client) => {
        const result = await client.query(
          `
            UPDATE drivers
            SET employment_status = 'TERMINATED',
                is_active = FALSE,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
          `,
          [args.where.id]
        );
        await this.syncDriverUser(client, this.mapDriverRow(result.rows[0]));
        return this.mapDriverRow(result.rows[0]);
      });
    }
  };

  vehicle = {
    findMany: async (args?: FindManyArgs) => {
      await this.ensureReady();
      const tenantId = args?.where?.tenantId as string | undefined;
      const params: unknown[] = [];
      let sql = "SELECT * FROM vehicles";
      if (tenantId) {
        params.push(tenantId);
        sql += " WHERE tenant_id = $1";
      }
      const result = await pool.query(sql, params);
      const rows = result.rows.map((row: Record<string, unknown>) => this.mapVehicleRow(row));
      return sortByOrder(rows, args?.orderBy) as VehicleRecord[];
    },
    findUnique: async (args: FindUniqueArgs) => {
      await this.ensureReady();
      const result = await pool.query("SELECT * FROM vehicles WHERE id = $1 LIMIT 1", [args.where.id]);
      return result.rows[0] ? this.mapVehicleRow(result.rows[0]) : null;
    },
    create: async (args: CreateArgs<Record<string, unknown>>) => {
      await this.ensureReady();
      const tenant = await this.tenant.findUnique({ where: { id: String(args.data.tenantId) } });
      const result = await pool.query(
      `
          INSERT INTO vehicles (
            id, tenant_id, plate, vehicle_type, model, brand, year, fuel_type, current_km,
            owner_name, company_name, status, created_at, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
          RETURNING *
        `,
        [
          randomUUID(),
          String(args.data.tenantId),
          normalizePlate(args.data.plate),
          String(args.data.vehicleType ?? "CAR"),
          String(args.data.model),
          String(args.data.brand),
          Number(args.data.year),
          String(args.data.fuelType),
          Number(args.data.currentKm),
          args.data.ownerName ? String(args.data.ownerName) : tenant?.name ?? PtBrMessage.NOT_INFORMED,
          args.data.companyName ? String(args.data.companyName) : null,
          String(args.data.status)
        ]
      );
      return this.mapVehicleRow(result.rows[0]);
    },
    update: async (args: UpdateArgs<Record<string, unknown>>) => {
      await this.ensureReady();
      const current = await this.vehicle.findUnique({ where: { id: args.where.id } });
      if (!current) {
        throw new Error(PtBrMessage.VEHICLE_NOT_FOUND);
      }
      const tenant = await this.tenant.findUnique({ where: { id: current.tenantId } });
      const result = await pool.query(
        `
          UPDATE vehicles
          SET plate = $2,
              vehicle_type = $3,
              model = $4,
              brand = $5,
              year = $6,
              fuel_type = $7,
              current_km = $8,
              owner_name = $9,
              company_name = $10,
              status = $11,
              updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `,
        [
          args.where.id,
          normalizePlate(args.data.plate ?? current.plate),
          String(args.data.vehicleType ?? current.vehicleType ?? "CAR"),
          String(args.data.model ?? current.model),
          String(args.data.brand ?? current.brand),
          Number(args.data.year ?? current.year),
          String(args.data.fuelType ?? current.fuelType),
          Number(args.data.currentKm ?? current.currentKm),
          args.data.ownerName ? String(args.data.ownerName) : tenant?.name ?? current.ownerName,
          args.data.companyName === undefined ? current.companyName ?? null : args.data.companyName ? String(args.data.companyName) : null,
          String(args.data.status ?? current.status)
        ]
      );
      return this.mapVehicleRow(result.rows[0]);
    }
  };

  fuelLog = {
    findMany: async (args?: FindManyArgs) => {
      await this.ensureReady();
      const tenantId = args?.where?.tenantId as string | undefined;
      const params: unknown[] = [];
      let sql = "SELECT * FROM fuel_logs";
      if (tenantId) {
        params.push(tenantId);
        sql += " WHERE tenant_id = $1";
      }
      const result = await pool.query(sql, params);
      const rows = result.rows.map((row: Record<string, unknown>) => this.mapFuelLogRow(row));
      return sortByOrder(rows, args?.orderBy) as FuelLogRecord[];
    },
    create: async (args: CreateArgs<Record<string, unknown>>) => {
      await this.ensureReady();
      const vehicle = await this.vehicle.findUnique({ where: { id: String(args.data.vehicleId) } });
      if (!vehicle) {
        throw new Error(PtBrMessage.VEHICLE_NOT_FOUND);
      }
      const previousKm = vehicle.currentKm;
      const odometerKm = Number(args.data.odometerKm);
      const liters = Number(args.data.liters);
      const distanceKm = Math.max(0, odometerKm - previousKm);
      const averageConsumption = liters > 0 ? Number((distanceKm / liters).toFixed(2)) : 0;
      const result = await pool.query(
        `
          INSERT INTO fuel_logs (
            id, tenant_id, vehicle_id, driver_id, fueled_at, odometer_km, fuel_type,
          liters, total_cost, price_per_liter, station_name, notes, receipt_photo_data_url,
          fueling_address, fueling_latitude, fueling_longitude, previous_km,
          distance_km, average_consumption, created_at, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW(),NOW())
          RETURNING *
        `,
        [
          randomUUID(),
          String(args.data.tenantId),
          String(args.data.vehicleId),
          args.data.driverId ? String(args.data.driverId) : null,
          String(args.data.fueledAt),
          odometerKm,
          String(args.data.fuelType),
          liters,
          Number(args.data.totalCost),
          Number(args.data.pricePerLiter),
          args.data.stationName ? String(args.data.stationName) : null,
          args.data.notes ? String(args.data.notes) : null,
          args.data.receiptPhotoDataUrl ? String(args.data.receiptPhotoDataUrl) : null,
          args.data.fuelingAddress ? String(args.data.fuelingAddress) : null,
          args.data.fuelingLatitude === undefined || args.data.fuelingLatitude === null
            ? null
            : Number(args.data.fuelingLatitude),
          args.data.fuelingLongitude === undefined || args.data.fuelingLongitude === null
            ? null
            : Number(args.data.fuelingLongitude),
          previousKm,
          distanceKm,
          averageConsumption
        ]
      );
      return this.mapFuelLogRow(result.rows[0]);
    }
  };

  alert = {
    findMany: async (args?: FindManyArgs) => {
      await this.ensureReady();
      const tenantId = args?.where?.tenantId as string | undefined;
      const params: unknown[] = [];
      let sql = "SELECT * FROM alerts";
      if (tenantId) {
        params.push(tenantId);
        sql += " WHERE tenant_id = $1";
      }
      const result = await pool.query(sql, params);
      const rows = result.rows.map((row: Record<string, unknown>) => this.mapAlertRow(row));
      const ordered = sortByOrder(rows, args?.orderBy) as AlertRecord[];
      return ordered.slice(0, args?.take ?? ordered.length);
    },
    create: async (args: CreateArgs<Record<string, unknown>>) => {
      await this.ensureReady();
      const result = await pool.query(
        `
          INSERT INTO alerts (id, tenant_id, title, severity, created_at)
          VALUES ($1,$2,$3,$4,NOW())
          RETURNING *
        `,
        [
          randomUUID(),
          String(args.data.tenantId),
          String(args.data.title),
          String(args.data.severity ?? "info")
        ]
      );
      return this.mapAlertRow(result.rows[0]);
    }
  };

  syncEvent = {
    findByOperationId: async (operationId: string) => {
      await this.ensureReady();
      const result = await pool.query("SELECT * FROM sync_events WHERE operation_id = $1 LIMIT 1", [
        operationId
      ]);
      return result.rows[0] ? this.mapSyncEventRow(result.rows[0]) : null;
    },
    count: async (args?: { where?: Record<string, unknown> }) => {
      await this.ensureReady();
      const tenantId = args?.where?.tenantId as string | undefined;
      const statusFilter = args?.where?.status as { in?: string[] } | undefined;
      const params: unknown[] = [];
      const where: string[] = [];
      if (tenantId) {
        params.push(tenantId);
        where.push(`tenant_id = $${params.length}`);
      }
      if (statusFilter?.in && statusFilter.in.length > 0) {
        params.push(statusFilter.in);
        where.push(`status = ANY($${params.length}::text[])`);
      }
      const sql = `SELECT COUNT(*)::int AS count FROM sync_events${where.length > 0 ? ` WHERE ${where.join(" AND ")}` : ""}`;
      const result = await pool.query<{ count: number }>(sql, params);
      return Number(result.rows[0]?.count ?? 0);
    },
    upsert: async (args: UpsertArgs<Record<string, unknown>, Record<string, unknown>>) => {
      await this.ensureReady();
      const existing = await pool.query("SELECT * FROM sync_events WHERE operation_id = $1 LIMIT 1", [
        args.where.operationId
      ]);

      if (existing.rows[0]) {
        const updated = await pool.query(
          `
            UPDATE sync_events
            SET status = $2,
                error_message = $3,
                updated_at = NOW()
            WHERE operation_id = $1
            RETURNING *
          `,
          [
            args.where.operationId,
            String(args.update.status ?? existing.rows[0].status),
            args.update.errorMessage === null || args.update.errorMessage === undefined
              ? null
              : String(args.update.errorMessage)
          ]
        );
        return this.mapSyncEventRow(updated.rows[0]);
      }

      const created = await pool.query(
        `
          INSERT INTO sync_events (
            id, tenant_id, device_id, entity, operation, operation_id, payload,
            status, error_message, created_at, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
          RETURNING *
        `,
        [
          randomUUID(),
          String(args.create.tenantId),
          String(args.create.deviceId),
          String(args.create.entity),
          String(args.create.operation),
          String(args.create.operationId),
          JSON.stringify(args.create.payload ?? {}),
          String(args.create.status),
          args.create.errorMessage === null || args.create.errorMessage === undefined
            ? null
            : String(args.create.errorMessage)
        ]
      );
      return this.mapSyncEventRow(created.rows[0]);
    }
  };

  activityLog = {
    findMany: async (args?: FindManyArgs) => {
      await this.ensureReady();
      const tenantId = args?.where?.tenantId as string | undefined;
      const params: unknown[] = [];
      let sql = "SELECT * FROM activity_logs";
      if (tenantId) {
        params.push(tenantId);
        sql += " WHERE tenant_id = $1";
      }
      sql += " ORDER BY created_at DESC";
      if (args?.take !== undefined) {
        params.push(args.take);
        sql += ` LIMIT $${params.length}`;
      }
      const result = await pool.query(sql, params);
      return result.rows.map((row: Record<string, unknown>) => this.mapActivityRow(row));
    },
    create: async (args: CreateArgs<Record<string, unknown>>) => {
      await this.ensureReady();
      const result = await pool.query(
        `
          INSERT INTO activity_logs (
            id, tenant_id, entity, action, title, details, created_at
          ) VALUES ($1,$2,$3,$4,$5,$6,NOW())
          RETURNING *
        `,
        [
          randomUUID(),
          String(args.data.tenantId),
          String(args.data.entity),
          String(args.data.action),
          String(args.data.title),
          args.data.details ? String(args.data.details) : null
        ]
      );
      return this.mapActivityRow(result.rows[0]);
    }
  };

  passwordResetCode = {
    findLatestByEmail: async (email: string) => {
      await this.ensureReady();
      const result = await pool.query(
        `
          SELECT *
          FROM password_reset_codes
          WHERE email = $1 AND used_at IS NULL
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [email]
      );
      const row = result.rows[0] as Record<string, unknown> | undefined;
      if (!row) {
        return null;
      }
      return {
        id: String(row.id),
        userId: String(row.user_id),
        email: String(row.email),
        codeHash: String(row.code_hash),
        codeSalt: String(row.code_salt),
        attempts: Number(row.attempts),
        expiresAt: new Date(String(row.expires_at)),
        usedAt: row.used_at ? new Date(String(row.used_at)) : null,
        createdAt: new Date(String(row.created_at)),
        updatedAt: new Date(String(row.updated_at))
      } as PasswordResetCodeRecord;
    },
    create: async (args: {
      userId: string;
      email: string;
      code: string;
      expiresAt: Date;
    }) => {
      await this.ensureReady();
      const salt = randomBytes(16).toString("hex");
      const codeHash = hashResetCode(args.code, salt);
      return withTransaction(async (client) => {
        await client.query(
          `
            UPDATE password_reset_codes
            SET used_at = NOW(), updated_at = NOW()
            WHERE email = $1 AND used_at IS NULL
          `,
          [args.email]
        );
        const result = await client.query(
          `
            INSERT INTO password_reset_codes (
              id, user_id, email, code_hash, code_salt, attempts, expires_at, created_at, updated_at
            ) VALUES ($1,$2,$3,$4,$5,0,$6,NOW(),NOW())
            RETURNING *
          `,
          [randomUUID(), args.userId, args.email, codeHash, salt, args.expiresAt]
        );
        const row = result.rows[0] as Record<string, unknown> | undefined;
        return row
          ? ({
              id: String(row.id),
              userId: String(row.user_id),
              email: String(row.email),
              codeHash: String(row.code_hash),
              codeSalt: String(row.code_salt),
              attempts: Number(row.attempts),
              expiresAt: new Date(String(row.expires_at)),
              usedAt: row.used_at ? new Date(String(row.used_at)) : null,
              createdAt: new Date(String(row.created_at)),
              updatedAt: new Date(String(row.updated_at))
            } as PasswordResetCodeRecord)
          : null;
      });
    },
    incrementAttempts: async (id: string) => {
      await this.ensureReady();
      await pool.query(
        `
          UPDATE password_reset_codes
          SET attempts = attempts + 1, updated_at = NOW()
          WHERE id = $1
        `,
        [id]
      );
    },
    markUsed: async (id: string) => {
      await this.ensureReady();
      await pool.query(
        `
          UPDATE password_reset_codes
          SET used_at = NOW(), updated_at = NOW()
          WHERE id = $1
        `,
        [id]
      );
    }
  };

  maintenanceLog = {
    findMany: async (args?: FindManyArgs) => {
      await this.ensureReady();
      const tenantId = args?.where?.tenantId as string | undefined;
      const params: unknown[] = [];
      let sql = `
        SELECT m.*, v.plate AS vehicle_plate, v.model AS vehicle_model
        FROM maintenance_logs m
        INNER JOIN vehicles v ON v.id = m.vehicle_id
      `;
      if (tenantId) {
        params.push(tenantId);
        sql += " WHERE m.tenant_id = $1";
      }
      const result = await pool.query(sql, params);
      const rows = result.rows.map((row: Record<string, unknown>) => this.mapMaintenanceRow(row));
      const ordered = sortByOrder(rows, args?.orderBy) as MaintenanceRecord[];
      return ordered.slice(0, args?.take ?? ordered.length);
    },
    create: async (args: CreateArgs<Record<string, unknown>>) => {
      await this.ensureReady();
      const vehicle = await this.vehicle.findUnique({ where: { id: String(args.data.vehicleId) } });
      if (!vehicle) {
        throw new Error(PtBrMessage.VEHICLE_NOT_FOUND);
      }
      const result = await pool.query(
        `
          INSERT INTO maintenance_logs (
            id, tenant_id, vehicle_id, title, maintenance_type, performed_at, odometer_km,
            total_cost, supplier_name, notes, next_maintenance_at, next_maintenance_km,
            oil_type, oil_brand, oil_cost, previous_oil_change_at, previous_oil_change_km, previous_oil_change_notes, changed_oil_filter, changed_air_filter,
            changed_fuel_filter, tire_brand, tire_quantity, tire_unit_cost, battery_brand,
            battery_cost, battery_voltage, brake_service, belt_changed, part_name, part_brand,
            part_cost, created_at, updated_at
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,
            $23,$24,$25,$26,$27,$28,$29,$30,$31,$32,NOW(),NOW()
          )
          RETURNING *
        `,
        [
          randomUUID(),
          String(args.data.tenantId),
          String(args.data.vehicleId),
          String(args.data.title),
          String(args.data.maintenanceType),
          String(args.data.performedAt),
          Number(args.data.odometerKm),
          Number(args.data.totalCost),
          args.data.supplierName ? String(args.data.supplierName) : null,
          args.data.notes ? String(args.data.notes) : null,
          args.data.nextMaintenanceAt ? String(args.data.nextMaintenanceAt) : null,
          args.data.nextMaintenanceKm === undefined || args.data.nextMaintenanceKm === null
            ? null
            : Number(args.data.nextMaintenanceKm),
          args.data.oilType ? String(args.data.oilType) : null,
          args.data.oilBrand ? String(args.data.oilBrand) : null,
          args.data.oilCost === undefined || args.data.oilCost === null ? null : Number(args.data.oilCost),
          args.data.previousOilChangeAt ? String(args.data.previousOilChangeAt) : null,
          args.data.previousOilChangeKm === undefined || args.data.previousOilChangeKm === null
            ? null
            : Number(args.data.previousOilChangeKm),
          args.data.previousOilChangeNotes ? String(args.data.previousOilChangeNotes) : null,
          args.data.changedOilFilter === undefined ? null : Boolean(args.data.changedOilFilter),
          args.data.changedAirFilter === undefined ? null : Boolean(args.data.changedAirFilter),
          args.data.changedFuelFilter === undefined ? null : Boolean(args.data.changedFuelFilter),
          args.data.tireBrand ? String(args.data.tireBrand) : null,
          args.data.tireQuantity === undefined || args.data.tireQuantity === null
            ? null
            : Number(args.data.tireQuantity),
          args.data.tireUnitCost === undefined || args.data.tireUnitCost === null
            ? null
            : Number(args.data.tireUnitCost),
          args.data.batteryBrand ? String(args.data.batteryBrand) : null,
          args.data.batteryCost === undefined || args.data.batteryCost === null
            ? null
            : Number(args.data.batteryCost),
          args.data.batteryVoltage ? String(args.data.batteryVoltage) : null,
          args.data.brakeService ? String(args.data.brakeService) : null,
          args.data.beltChanged === undefined ? null : Boolean(args.data.beltChanged),
          args.data.partName ? String(args.data.partName) : null,
          args.data.partBrand ? String(args.data.partBrand) : null,
          args.data.partCost === undefined || args.data.partCost === null
            ? null
            : Number(args.data.partCost)
        ]
      );

      return this.mapMaintenanceRow({
        ...result.rows[0],
        vehicle_plate: vehicle.plate,
        vehicle_model: vehicle.model
      });
    }
  };

  async onModuleInit() {
    await this.ensureReady();
  }

  async onModuleDestroy() {
    await pool.end();
  }
}
