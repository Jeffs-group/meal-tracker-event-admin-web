import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import {
  isPublicRegistrationDomain,
  isPublicRegistrationPath,
} from "@/utils/domainRouting";
import { ROUTES } from "@/constants/routes";

export const DomainRouteGuard: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();

  // If visitor is on the public registration domain (e.g. cricket.jeffscorporatecatering.com)
  if (isPublicRegistrationDomain()) {
    // If root '/', redirect directly to /register
    if (location.pathname === "/" || location.pathname === "") {
      return <Navigate to={ROUTES.REGISTER} replace />;
    }

    // If attempting to access any admin/non-public route (e.g. /login, /dashboard, /manage-teams),
    // force redirect back to /register so admin surface is never accessible on the cricket domain.
    if (!isPublicRegistrationPath(location.pathname)) {
      return <Navigate to={ROUTES.REGISTER} replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default DomainRouteGuard;

