import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { selectCurrentUser, selectIsAuthenticated, selectIsAuthInitialized } from "./authSlice";

export function ProtectedRoute({ allowedRoles = [] }) {
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsAuthInitialized);
  const user = useSelector(selectCurrentUser);

  if (!isInitialized) {
    return null;
  }

  if (!isAuthenticated) {
    // Preserve requested destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.role))) {
    // Redirect to role's default dashboard
    if (user?.role === "applicant") {
      return <Navigate to="/applicant/dashboard" replace />;
    }
    if (user?.role === "recruiter") {
      return <Navigate to="/recruiter/dashboard" replace />;
    }
    if (user?.role === "admin") {
      return <Navigate to="/admin/users" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

