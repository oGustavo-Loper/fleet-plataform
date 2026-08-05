export const PRISMA_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    document_number TEXT,
    plan_code TEXT NOT NULL DEFAULT 'ESSENTIAL_FREE',
    plan_status TEXT NOT NULL DEFAULT 'TRIAL',
    vehicle_limit INT,
    photo_data_url TEXT,
    billing_provider TEXT,
    billing_customer_id TEXT,
    billing_subscription_id TEXT,
    billing_activated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    password_hash TEXT,
    demo_password TEXT,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    driver_id TEXT,
    assigned_vehicle_ids TEXT[] NOT NULL DEFAULT '{}'::text[],
    allow_any_vehicle BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    cpf TEXT,
    registration_id TEXT,
    cnh TEXT NOT NULL,
    cnh_category TEXT NOT NULL,
    cnh_expires_at TEXT NOT NULL,
    login_email TEXT UNIQUE,
    assigned_vehicle_ids TEXT[] NOT NULL DEFAULT '{}'::text[],
    allow_any_vehicle BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    photo_data_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plate TEXT NOT NULL,
    vehicle_type TEXT NOT NULL DEFAULT 'CAR',
    model TEXT NOT NULL,
    brand TEXT NOT NULL,
    year INT NOT NULL,
    fuel_type TEXT NOT NULL,
    current_km INT NOT NULL,
    owner_name TEXT NOT NULL,
    company_name TEXT,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS fuel_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id TEXT,
    fueled_at TEXT NOT NULL,
    odometer_km INT NOT NULL,
    fuel_type TEXT NOT NULL,
    liters NUMERIC(10,2) NOT NULL,
    total_cost NUMERIC(10,2) NOT NULL,
    price_per_liter NUMERIC(10,2) NOT NULL,
    station_name TEXT,
    notes TEXT,
    receipt_photo_data_url TEXT,
    fueling_address TEXT,
    fueling_latitude NUMERIC(10,7),
    fueling_longitude NUMERIC(10,7),
    previous_km INT,
    distance_km INT NOT NULL DEFAULT 0,
    average_consumption NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS maintenance_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    maintenance_type TEXT NOT NULL,
    performed_at TEXT NOT NULL,
    odometer_km INT NOT NULL,
    total_cost NUMERIC(10,2) NOT NULL,
    supplier_name TEXT,
    notes TEXT,
    next_maintenance_at TEXT,
    next_maintenance_km INT,
    oil_type TEXT,
    oil_brand TEXT,
    oil_cost NUMERIC(10,2),
    previous_oil_change_at TEXT,
    previous_oil_change_km INT,
    previous_oil_change_notes TEXT,
    changed_oil_filter BOOLEAN,
    changed_air_filter BOOLEAN,
    changed_fuel_filter BOOLEAN,
    tire_brand TEXT,
    tire_quantity INT,
    tire_unit_cost NUMERIC(10,2),
    battery_brand TEXT,
    battery_cost NUMERIC(10,2),
    battery_voltage TEXT,
    brake_service TEXT,
    belt_changed BOOLEAN,
    part_name TEXT,
    part_brand TEXT,
    part_cost NUMERIC(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    severity TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS sync_events (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    entity TEXT NOT NULL,
    operation TEXT NOT NULL,
    operation_id TEXT NOT NULL UNIQUE,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity TEXT NOT NULL,
    action TEXT NOT NULL,
    title TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS login_attempts (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL UNIQUE,
    failed_count INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS media_files (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    path TEXT NOT NULL UNIQUE,
    scope TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS password_reset_codes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    code_salt TEXT NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  ALTER TABLE maintenance_logs
    ADD COLUMN IF NOT EXISTS previous_oil_change_at TEXT,
    ADD COLUMN IF NOT EXISTS previous_oil_change_km INT,
    ADD COLUMN IF NOT EXISTS previous_oil_change_notes TEXT;

  ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS vehicle_type TEXT NOT NULL DEFAULT 'CAR';

  ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS photo_data_url TEXT;

  ALTER TABLE users
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

  ALTER TABLE users
    ADD COLUMN IF NOT EXISTS photo_data_url TEXT;

  ALTER TABLE drivers
    ADD COLUMN IF NOT EXISTS registration_id TEXT;

  ALTER TABLE drivers
    ADD COLUMN IF NOT EXISTS employment_status TEXT NOT NULL DEFAULT 'ACTIVE';

  ALTER TABLE drivers
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

  ALTER TABLE drivers
    ADD COLUMN IF NOT EXISTS photo_data_url TEXT;

  ALTER TABLE drivers
    ALTER COLUMN cpf DROP NOT NULL;

  ALTER TABLE drivers
    ALTER COLUMN cnh DROP NOT NULL;

  ALTER TABLE drivers
    ALTER COLUMN cnh_category DROP NOT NULL;

  ALTER TABLE drivers
    ALTER COLUMN cnh_expires_at DROP NOT NULL;

  ALTER TABLE vehicles
    DROP CONSTRAINT IF EXISTS vehicles_tenant_id_plate_key;

  DROP INDEX IF EXISTS vehicles_plate_unique_idx;

  UPDATE vehicles
  SET plate = CASE
    WHEN plate IS NULL THEN plate
    ELSE
      CASE
        WHEN length(regexp_replace(upper(plate), '[^A-Z0-9]', '', 'g')) > 3 THEN
          concat(
            substr(regexp_replace(upper(plate), '[^A-Z0-9]', '', 'g'), 1, 3),
            ' ',
            substr(regexp_replace(upper(plate), '[^A-Z0-9]', '', 'g'), 4, 4)
          )
        ELSE regexp_replace(upper(plate), '[^A-Z0-9]', '', 'g')
      END
  END;

  ALTER TABLE fuel_logs
    ADD COLUMN IF NOT EXISTS receipt_photo_data_url TEXT,
    ADD COLUMN IF NOT EXISTS fueling_address TEXT,
    ADD COLUMN IF NOT EXISTS fueling_latitude NUMERIC(10,7),
    ADD COLUMN IF NOT EXISTS fueling_longitude NUMERIC(10,7);

  ALTER TABLE fuel_logs
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

  UPDATE drivers
  SET employment_status = CASE
    WHEN employment_status IS NULL OR employment_status = '' THEN CASE
      WHEN is_active = TRUE THEN 'ACTIVE'
      ELSE 'VACATION'
    END
    ELSE employment_status
  END;

  ALTER TABLE users
    ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS terms_version TEXT;

  ALTER TABLE users
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

  ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS retention_purged_at TIMESTAMPTZ;

  ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS billing_subscription_status TEXT;

  CREATE TABLE IF NOT EXISTS billing_webhook_events (
    id TEXT PRIMARY KEY,
    notification_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;
