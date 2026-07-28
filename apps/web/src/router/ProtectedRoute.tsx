import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { auth, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && auth?.role && !allowedRoles.includes(auth.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (auth?.mustChangePassword && location.pathname !== "/first-access") {
    return <Navigate to="/first-access" replace />;
  }

  return <Outlet />;
}
