import React from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";

export interface RequirePermissionProps {
  module: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  module,
  action,
  children,
  fallback,
}) => {
  const { can, getMissingPermissionTooltip, isLoading } = usePermissions();
  const navigate = useNavigate();

  if (isLoading) {
    return null;
  }

  if (!can(module, action)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const missingMsg = getMissingPermissionTooltip(module, action);

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center animate-in fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Access Restricted
        </h2>
        <p className="mt-1 max-w-md text-xs sm:text-sm text-slate-600">
          You do not hold sufficient administrative permissions to access this
          module.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-mono font-medium text-slate-700 border border-slate-200">
          <span>{missingMsg}</span>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            className="rounded-xl border-slate-300 text-xs font-semibold"
          >
            Go Back
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            leftIcon={<Home className="h-4 w-4" />}
            className="rounded-xl text-xs font-semibold"
          >
            Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequirePermission;
