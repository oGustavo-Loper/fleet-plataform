import { gql } from "@apollo/client";

export const TENANTS_QUERY = gql`
  query Tenants {
    tenants {
      id
      name
      accountType
      documentNumber
      planCode
      planStatus
      vehicleLimit
      photoDataUrl
    }
  }
`;

export const TENANT_QUERY = gql`
  query Tenant($id: String!) {
    tenant(id: $id) {
      id
      name
      accountType
      documentNumber
      planCode
      planStatus
      vehicleLimit
      photoDataUrl
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      userId
      tenantId
      role
      fullName
      driverId
      assignedVehicleIds
      allowAnyVehicle
      mustChangePassword
    }
  }
`;

export const REFRESH_SESSION_MUTATION = gql`
  mutation RefreshSession($input: RefreshSessionInput!) {
    refreshSession(input: $input) {
      accessToken
      refreshToken
      userId
      tenantId
      role
      fullName
      driverId
      assignedVehicleIds
      allowAnyVehicle
      mustChangePassword
    }
  }
`;

export const COMPLETE_FIRST_LOGIN_MUTATION = gql`
  mutation CompleteFirstLogin($input: CompleteFirstLoginInput!) {
    completeFirstLogin(input: $input) {
      accessToken
      refreshToken
      userId
      tenantId
      role
      fullName
      driverId
      assignedVehicleIds
      allowAnyVehicle
      mustChangePassword
    }
  }
`;

export const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {
    requestPasswordReset(input: $input) {
      deliveryHint
      expiresAt
      debugCode
    }
  }
`;

export const CONFIRM_PASSWORD_RESET_MUTATION = gql`
  mutation ConfirmPasswordReset($input: ConfirmPasswordResetInput!) {
    confirmPasswordReset(input: $input) {
      accessToken
      refreshToken
      userId
      tenantId
      role
      fullName
      driverId
      assignedVehicleIds
      allowAnyVehicle
      mustChangePassword
    }
  }
`;

export const REGISTER_COMPANY_MUTATION = gql`
  mutation RegisterCompany($input: RegisterCompanyInput!) {
    registerCompany(input: $input) {
      accessToken
      refreshToken
      userId
      tenantId
      role
      fullName
      driverId
      assignedVehicleIds
      allowAnyVehicle
      mustChangePassword
    }
  }
`;

export const REGISTER_INDIVIDUAL_MUTATION = gql`
  mutation RegisterIndividual($input: RegisterIndividualInput!) {
    registerIndividual(input: $input) {
      accessToken
      refreshToken
      userId
      tenantId
      role
      fullName
      driverId
      assignedVehicleIds
      allowAnyVehicle
      mustChangePassword
    }
  }
`;

export const UPGRADE_PLAN_MUTATION = gql`
  mutation UpgradePlan($input: UpgradePlanInput!) {
    upgradePlan(input: $input) {
      id
      name
      accountType
      documentNumber
      planCode
      planStatus
      vehicleLimit
    }
  }
`;

export const CREATE_CHECKOUT_SESSION_MUTATION = gql`
  mutation CreateCheckoutSession($input: CreateCheckoutSessionInput!) {
    createCheckoutSession(input: $input) {
      checkoutUrl
      provider
      planCode
    }
  }
`;

export const CONFIRM_BILLING_PAYMENT_MUTATION = gql`
  mutation ConfirmBillingPayment($input: ConfirmBillingPaymentInput!) {
    confirmBillingPayment(input: $input) {
      id
      name
      accountType
      documentNumber
      planCode
      planStatus
      vehicleLimit
    }
  }
`;

export const DASHBOARD_SUMMARY_QUERY = gql`
  query DashboardSummary($tenantId: String!) {
    dashboardSummary(tenantId: $tenantId) {
      totalVehicles
      activeVehicles
      maintenanceVehicles
      monthlyCost
      averageConsumption
      pendingSyncItems
      costTrend {
        date
        cost
      }
      upcomingMaintenance {
        id
        vehicleLabel
        dueDate
        dueKm
      }
      alerts {
        id
        title
        severity
      }
      recentActivity {
        id
        entity
        action
        title
        createdAt
      }
    }
  }
`;

export const NOTIFICATIONS_QUERY = gql`
  query Notifications($tenantId: String!) {
    notifications(tenantId: $tenantId) {
      id
      title
      severity
      createdAt
    }
  }
`;

export const VEHICLES_QUERY = gql`
  query Vehicles($tenantId: String!) {
    vehicles(tenantId: $tenantId) {
      id
      plate
      vehicleType
      brand
      model
      year
      fuelType
      currentKm
      status
      ownerName
      createdAt
    }
  }
`;

export const CREATE_VEHICLE_MUTATION = gql`
  mutation CreateVehicle($input: CreateVehicleInput!) {
    createVehicle(input: $input) {
      id
      plate
      vehicleType
      brand
      model
      status
      currentKm
      createdAt
    }
  }
`;

export const UPDATE_VEHICLE_MUTATION = gql`
  mutation UpdateVehicle($input: UpdateVehicleInput!) {
    updateVehicle(input: $input) {
      id
      plate
      vehicleType
      brand
      model
      status
      currentKm
      createdAt
    }
  }
`;

export const DRIVERS_QUERY = gql`
  query Drivers($tenantId: String!) {
    drivers(tenantId: $tenantId) {
      id
      fullName
      cpf
      registrationId
      cnh
      cnhCategory
      cnhExpiresAt
      createdAt
      loginEmail
      assignedVehicleIds
      allowAnyVehicle
      employmentStatus
      isActive
      photoDataUrl
    }
  }
`;

export const CREATE_DRIVER_MUTATION = gql`
  mutation CreateDriver($input: CreateDriverInput!) {
    createDriver(input: $input) {
      id
      fullName
      cpf
      registrationId
      cnh
      cnhCategory
      cnhExpiresAt
      createdAt
      loginEmail
      assignedVehicleIds
      allowAnyVehicle
      employmentStatus
      isActive
      photoDataUrl
    }
  }
`;

export const UPDATE_DRIVER_MUTATION = gql`
  mutation UpdateDriver($input: UpdateDriverInput!) {
    updateDriver(input: $input) {
      id
      fullName
      cpf
      registrationId
      cnh
      cnhCategory
      cnhExpiresAt
      createdAt
      loginEmail
      assignedVehicleIds
      allowAnyVehicle
      employmentStatus
      isActive
      photoDataUrl
    }
  }
`;

export const DELETE_DRIVER_MUTATION = gql`
  mutation DeleteDriver($input: DeleteDriverInput!) {
    deleteDriver(input: $input) {
      id
      tenantId
    }
  }
`;

export const FUEL_LOGS_QUERY = gql`
  query FuelLogs($tenantId: String!) {
    fuelLogs(tenantId: $tenantId) {
      id
      tenantId
      vehicleId
      driverId
      fueledAt
      odometerKm
      fuelType
      liters
      totalCost
      pricePerLiter
      stationName
      notes
      vehicleLabel
      driverName
      receiptPhotoDataUrl
      fuelingAddress
      fuelingLatitude
      fuelingLongitude
      previousKm
      distanceKm
      averageConsumption
    }
  }
`;

export const VEHICLE_REPORT_QUERY = gql`
  query VehicleReport($tenantId: String!, $vehicleId: String!, $from: String, $to: String) {
    vehicleReport(tenantId: $tenantId, vehicleId: $vehicleId, from: $from, to: $to) {
      vehicle {
        id
        plate
        brand
        model
        year
        fuelType
        currentKm
        status
        ownerName
        createdAt
      }
      period {
        from
        to
      }
      summary {
        fuelCount
        maintenanceCount
        totalLiters
        totalDistanceKm
        totalFuelCost
        totalMaintenanceCost
        totalCost
        averageConsumption
      }
      fuelLogs {
        id
        fueledAt
        odometerKm
        fuelType
        liters
        totalCost
        pricePerLiter
        stationName
        notes
        vehicleLabel
        driverName
        receiptPhotoDataUrl
        fuelingAddress
        fuelingLatitude
        fuelingLongitude
        previousKm
        distanceKm
        averageConsumption
      }
      maintenanceLogs {
        id
        tenantId
        vehicleId
        vehicleLabel
        title
        maintenanceType
        performedAt
        odometerKm
        totalCost
        supplierName
        notes
        nextMaintenanceAt
        nextMaintenanceKm
        oilType
        oilBrand
        oilCost
        previousOilChangeAt
        previousOilChangeKm
        previousOilChangeNotes
        changedOilFilter
        changedAirFilter
        changedFuelFilter
        tireBrand
        tireQuantity
        tireUnitCost
        batteryBrand
        batteryCost
        batteryVoltage
        brakeService
        beltChanged
        partName
        partBrand
        partCost
      }
    }
  }
`;

export const CREATE_FUEL_LOG_MUTATION = gql`
  mutation CreateFuelLog($input: CreateFuelLogInput!) {
    createFuelLog(input: $input) {
      id
      tenantId
      vehicleId
      driverId
      fueledAt
      odometerKm
      fuelType
      liters
      totalCost
      pricePerLiter
      stationName
      notes
      vehicleLabel
      driverName
      receiptPhotoDataUrl
      fuelingAddress
      fuelingLatitude
      fuelingLongitude
      previousKm
      distanceKm
      averageConsumption
    }
  }
`;

export const MAINTENANCE_LOGS_QUERY = gql`
  query MaintenanceLogs($tenantId: String!) {
    maintenanceLogs(tenantId: $tenantId) {
      id
      tenantId
      vehicleId
      vehicleLabel
      title
      maintenanceType
      performedAt
      odometerKm
      totalCost
      supplierName
      notes
      nextMaintenanceAt
      nextMaintenanceKm
      oilType
      oilBrand
      oilCost
      previousOilChangeAt
      previousOilChangeKm
      previousOilChangeNotes
      changedOilFilter
      changedAirFilter
      changedFuelFilter
      tireBrand
      tireQuantity
      tireUnitCost
      batteryBrand
      batteryCost
      batteryVoltage
      brakeService
      beltChanged
      partName
      partBrand
      partCost
    }
  }
`;

export const CREATE_MAINTENANCE_MUTATION = gql`
  mutation CreateMaintenance($input: CreateMaintenanceInput!) {
    createMaintenance(input: $input) {
      id
      tenantId
      vehicleId
      vehicleLabel
      title
      maintenanceType
      performedAt
      odometerKm
      totalCost
      supplierName
      notes
      nextMaintenanceAt
      nextMaintenanceKm
      oilType
      oilBrand
      oilCost
      previousOilChangeAt
      previousOilChangeKm
      previousOilChangeNotes
      changedOilFilter
      changedAirFilter
      changedFuelFilter
      tireBrand
      tireQuantity
      tireUnitCost
      batteryBrand
      batteryCost
      batteryVoltage
      brakeService
      beltChanged
      partName
      partBrand
      partCost
    }
  }
`;

export const PUSH_SYNC_EVENT_MUTATION = gql`
  mutation PushSyncEvent($input: PushSyncInput!) {
    pushSyncEvent(input: $input) {
      operationId
      status
      errorMessage
    }
  }
`;
