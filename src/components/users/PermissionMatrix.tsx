import React from "react";
import { MODULES, PERMISSION_ACTIONS } from "@/constants/permissions";
import {
  togglePermissionAction,
  isPermissionChecked,
} from "@/utils/permissionReducer";
import type { ModuleKey, PermissionAction } from "@/types/users.types";
import { Info, Check } from "lucide-react";
import { cn } from "@/utils/cn";

export interface PermissionMatrixProps {
  permissions: Record<ModuleKey, PermissionAction[]>;
  onChange?: (next: Record<ModuleKey, PermissionAction[]>) => void;
  disabled?: boolean;
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  permissions,
  onChange,
  disabled = false,
}) => {
  const handleToggle = (module: ModuleKey, action: PermissionAction) => {
    if (disabled || !onChange) return;
    const isChecked = isPermissionChecked(permissions, module, action);
    const updated = togglePermissionAction(
      permissions,
      module,
      action,
      !isChecked,
    );
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Module Permissions Matrix
          </h4>
          <p className="text-[11px] text-slate-500">
            Select granular permissions granted for each portal module.
          </p>
        </div>
      </div>

      {/* Desktop Table View (≥640px) */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700">
              <th
                scope="col"
                className="py-3 px-4 font-bold text-slate-800 w-[40%]"
              >
                Module Name
              </th>
              {PERMISSION_ACTIONS.map((actionItem) => (
                <th
                  key={actionItem.action}
                  scope="col"
                  className="py-3 px-3 font-bold text-center text-slate-800 w-[15%]"
                >
                  <div
                    className="inline-flex items-center justify-center gap-1 group cursor-help"
                    title={actionItem.tooltip}
                  >
                    <span>{actionItem.label}</span>
                    <Info className="h-3 w-3 text-slate-400 group-hover:text-slate-600" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <tr
                  key={mod.key}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <th
                    scope="row"
                    className="py-3 px-4 font-medium text-slate-900"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900">
                          {mod.label}
                        </p>
                        <p className="text-[10px] text-slate-400 font-normal leading-tight">
                          {mod.description}
                        </p>
                      </div>
                    </div>
                  </th>

                  {PERMISSION_ACTIONS.map((actionItem) => {
                    const checked = isPermissionChecked(
                      permissions,
                      mod.key,
                      actionItem.action,
                    );
                    const checkboxId = `chk-${mod.key}-${actionItem.action}`;

                    return (
                      <td
                        key={actionItem.action}
                        className="py-3 px-3 text-center align-middle"
                      >
                        <label
                          htmlFor={checkboxId}
                          className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            id={checkboxId}
                            name={checkboxId}
                            checked={checked}
                            onChange={() =>
                              handleToggle(mod.key, actionItem.action)
                            }
                            disabled={disabled}
                            aria-label={`${mod.label} – ${actionItem.label}`}
                            className="sr-only peer"
                          />
                          <div
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-md border transition-all shadow-2xs",
                              "peer-focus-visible:ring-2 peer-focus-visible:ring-[#9B7415] peer-focus-visible:ring-offset-1",
                              checked
                                ? "bg-[#C9A227] border-[#9B7415] text-white"
                                : "bg-white border-slate-300 hover:border-slate-400",
                              disabled && "opacity-50 cursor-not-allowed",
                            )}
                          >
                            {checked && (
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            )}
                          </div>
                        </label>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View (<640px) */}
      <div className="sm:hidden space-y-3">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.key}
              className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900">
                    {mod.label}
                  </h5>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {mod.description}
                  </p>
                </div>
              </div>

              {/* 2x2 Action Checkbox Grid with 44px touch targets */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                {PERMISSION_ACTIONS.map((actionItem) => {
                  const checked = isPermissionChecked(
                    permissions,
                    mod.key,
                    actionItem.action,
                  );
                  const mobileChkId = `m-chk-${mod.key}-${actionItem.action}`;

                  return (
                    <label
                      key={actionItem.action}
                      htmlFor={mobileChkId}
                      className={cn(
                        "flex items-center gap-2.5 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors min-h-[44px]",
                        checked
                          ? "bg-[#FAF4E6] border-[#ECD59A] text-[#644813]"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100",
                        disabled && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <input
                        type="checkbox"
                        id={mobileChkId}
                        name={mobileChkId}
                        checked={checked}
                        onChange={() =>
                          handleToggle(mod.key, actionItem.action)
                        }
                        disabled={disabled}
                        aria-label={`${mod.label} – ${actionItem.label}`}
                        className="sr-only peer"
                      />
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border transition-all shrink-0",
                          checked
                            ? "bg-[#C9A227] border-[#9B7415] text-white"
                            : "bg-white border-slate-300",
                        )}
                      >
                        {checked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{actionItem.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PermissionMatrix;
