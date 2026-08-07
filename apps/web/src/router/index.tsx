import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppNavigation } from "../components/AppNavigation";
import { NotificationsCenter } from "../components/NotificationsCenter";
import { LoadingState } from "../components/ScreenState";
import { useAuth } from "../contexts/AuthContext";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { ProtectedRoute } from "./ProtectedRoute";

// Everything below is only needed once a route actually renders, so it ships
// in its own chunk instead of the initial bundle every visitor (including a
// first-time /login visit) downloads up front.
const AdminReportPage = lazy(() => import("../pages/AdminReportPage").then((m) => ({ default: m.AdminReportPage })));
const DashboardPage = lazy(() => import("../pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const DriversPage = lazy(() => import("../pages/DriversPage").then((m) => ({ default: m.DriversPage })));
const FirstAccessPage = lazy(() => import("../pages/FirstAccessPage").then((m) => ({ default: m.FirstAccessPage })));
const FuelsPage = lazy(() => import("../pages/FuelsPage").then((m) => ({ default: m.FuelsPage })));
const MaintenancePage = lazy(() => import("../pages/MaintenancePage").then((m) => ({ default: m.MaintenancePage })));
const OnboardingPage = lazy(() => import("../pages/OnboardingPage").then((m) => ({ default: m.OnboardingPage })));
const ReportsPage = lazy(() => import("../pages/ReportsPage").then((m) => ({ default: m.ReportsPage })));
const PlansPage = lazy(() => import("../pages/PlansPage").then((m) => ({ default: m.PlansPage })));
const ProfilePage = lazy(() => import("../pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const RegisterCompanyPage = lazy(() =>
  import("../pages/RegisterCompanyPage").then((m) => ({ default: m.RegisterCompanyPage }))
);
const RegisterIndividualPage = lazy(() =>
  import("../pages/RegisterIndividualPage").then((m) => ({ default: m.RegisterIndividualPage }))
);
const SuperAdminPage = lazy(() => import("../pages/SuperAdminPage").then((m) => ({ default: m.SuperAdminPage })));
const TeamPage = lazy(() => import("../pages/TeamPage").then((m) => ({ default: m.TeamPage })));
const TermsPage = lazy(() => import("../pages/TermsPage").then((m) => ({ default: m.TermsPage })));
const VehiclesPage = lazy(() => import("../pages/VehiclesPage").then((m) => ({ default: m.VehiclesPage })));

export function AppRouter() {
  const { auth, isAuthenticated, isInitializing } = useAuth();

  return (
    <>
      <AppNavigation />
      <NotificationsCenter />
      <Suspense fallback={<LoadingState message="Carregando..." />}>
        <Routes>
          <Route
            path="/"
            element={
              isInitializing ? null : isAuthenticated
                ? <Navigate to={auth?.mustChangePassword ? "/first-access" : "/dashboard"} replace />
                : <LandingPage />
            }
          />
          <Route path="/landing" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/first-access" element={<FirstAccessPage />} />
          <Route path="/register/company" element={<RegisterCompanyPage />} />
          <Route path="/register/individual" element={<RegisterIndividualPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/termos" element={<TermsPage />} />
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
      </Suspense>
    </>
  );
}
