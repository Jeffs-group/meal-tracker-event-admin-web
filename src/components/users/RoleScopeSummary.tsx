import React from "react";
import { getRoleScopeInfo } from "@/constants/permissions";
import type { Role } from "@/types/users.types";
import { cn } from "@/utils/cn";

export interface RoleScopeSummaryProps {
  permissions: Role["permissions"];
  isSuperadmin?: boolean;
}

export const RoleScopeSummary: React.FC<RoleScopeSummaryProps> = ({
  permissions,
  isSuperadmin = false,
}) => {
  const scopeInfo = getRoleScopeInfo(permissions);

  const isAllModules = scopeInfo.coveredModulesCount === scopeInfo.totalModules;

  return (
    <div className="space-y-1">
      {/* Scope Pill */}
      <div>
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border",
            isSuperadmin
              ? "bg-[#FAF4E6] text-[#644813] border-[#ECD59A]"
              : isAllModules
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-slate-100 text-slate-700 border-slate-200",
          )}
        >
          {scopeInfo.scopeLabel}
        </span>
      </div>

      {/* Muted Breakdown Line */}
      <div className="text-[11px] text-slate-500 font-medium leading-tight">
        <p className="truncate max-w-[280px]" title={scopeInfo.moduleListText}>
          {scopeInfo.moduleListText}
        </p>
        <p className="text-[10px] text-slate-400 capitalize">
          {scopeInfo.permissionSummaryText}
        </p>
      </div>
    </div>
  );
};

export default RoleScopeSummary;
