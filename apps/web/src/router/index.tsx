import { Navigate, Route, Routes } from "react-router-dom";

import { AppNavigation } from "../components/AppNavigation";
import { NotificationsCenter } from "../components/NotificationsCenter";
import { useAuth } from "../contexts/AuthContext";
import { AdminReportPage } from "../pages/AdminReportPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DriversPage } from "../pages/DriversPage";
import { FirstAccessPage } from "../pages/FirstAccessPage";
import { FuelsPage } from "../pages/FuelsPage";
import { LoginPage } from "../pages/LoginPage";
import { MaintenancePage } from "../pages/MaintenancePage";
import { BillingCheckoutPage } from "../pages/BillingCheckoutPage";
import { LandingPage } from "../pages/LandingPage";
import { OnboardingPage } from "../pages/OnboardingPage";
import { ReportsPage } from "../pages/ReportsPage";
import { PlansPage } from "../pages/PlansPage";
import { ProfilePage } from "../pages/ProfilePage";
import { RegisterCompanyPage } from "../pages/RegisterCompanyPage";
import { RegisterIndividualPage } from "../pages/RegisterIndividualPage";
import { SuperAdminPage } from "../pages/SuperAdminPage";
import { TeamPage } from "../pages/TeamPage";
import { TermsPage } from "../pages/TermsPage";
import { VehiclesPage } from "../pages/VehiclesPage";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRouter() {
  const { auth, isAuthenticated, isInitializing } = useAuth();

  return (
    <>
      <AppNavigation />
      <NotificationsCenter />
      <Routes>
        <Route
          path="/"
          element={
            isInitializing ? null : isAuthenticated
              ? <Navigate to={auth?.mustChangePassword ? "/first-access" : "/dashboard"} replace />
              : <LandingPage />
          }
        />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/first-access" element={<FirstAccessPage />} />
        <Route path="/register/company" element={<RegisterCompanyPage />} />
        <Route path="/register/individual" element={<RegisterIndividualPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/termos" element={<TermsPage />} />
        <Route path="/billing/checkout" element={<BillingCheckoutPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/fuels" element={<FuelsPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["ADMIN", "MANAGER", "COMPANY", "INDIVIDUAL"]} />}>
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["ADMIN", "COMPANY", "INDIVIDUAL"]} />}>
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/drivers" element={<DriversPage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["ADMIN", "COMPANY"]} />}>
          <Route path="/admin/report" element={<AdminReportPage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]} />}>
          <Route path="/team" element={<TeamPage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
          <Route path="/super-admin" element={<SuperAdminPage />} />
        </Route>
      </Routes>
    </>
  );
}
