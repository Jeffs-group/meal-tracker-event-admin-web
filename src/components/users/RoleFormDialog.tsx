import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  roleFormSchema,
  type RoleFormValues,
} from "@/validations/user.validation";
import { DialogShell } from "@/components/common/DialogShell";
import { Button } from "@/components/ui/Button";
import { PermissionMatrix } from "./PermissionMatrix";
import { hasAtLeastOnePermission } from "@/utils/permissionReducer";
import { Shield, AlertTriangle, Check, Lock, Users, Copy } from "lucide-react";
import type {
  Role,
  ModuleKey,
  PermissionAction,
  CreateRolePayload,
  UpdateRolePayload,
} from "@/types/users.types";
import { cn } from "@/utils/cn";

export interface RoleFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit" | "duplicate";
  initialRole?: Role | null;
  currentUserRoleId?: string;
  onClose: () => void;
  onSubmit: (payload: CreateRolePayload | UpdateRolePayload) => Promise<void>;
  isSubmitting?: boolean;
}

const defaultPermissions: Record<ModuleKey, PermissionAction[]> = {
  dashboard: ["view"],
  registrations: [],
  teams: [],
  reports: [],
  users: [],
};

export const RoleFormDialog: React.FC<RoleFormDialogProps> = ({
  isOpen,
  mode,
  initialRole,
  currentUserRoleId,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [permissions, setPermissions] =
    useState<Record<ModuleKey, PermissionAction[]>>(defaultPermissions);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const isSystemRole = mode === "edit" && initialRole?.isSystem;
  const isEditingCurrentRole =
    mode === "edit" && initialRole?.id === currentUserRoleId;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
    mode: "onChange",
  });

  const descriptionValue = watch("description") || "";

  useEffect(() => {
    if (isOpen) {
      setApiError(null);
      if (initialRole) {
        let prefillName = initialRole.name;
        if (mode === "duplicate") {
          prefillName = `${initialRole.name} (Copy)`;
        }
        reset({
          name: prefillName,
          description: initialRole.description || "",
        });
        setPermissions(JSON.parse(JSON.stringify(initialRole.permissions)));
      } else {
        reset({
          name: "",
          description: "",
        });
        setPermissions(defaultPermissions);
      }
    }
  }, [isOpen, mode, initialRole, reset]);

  const hasPermissions = hasAtLeastOnePermission(permissions);

  const onFormSubmit = async (values: RoleFormValues) => {
    if (!hasPermissions) {
      setApiError(
        "Please select at least one module permission for this role.",
      );
      return;
    }

    try {
      setApiError(null);
      await onSubmit({
        name: values.name.trim(),
        description: values.description?.trim() || "",
        permissions,
      });
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to save role configuration.";
      setApiError(msg);
    }
  };

  const dialogTitle =
    mode === "create"
      ? "Create New Role"
      : mode === "duplicate"
        ? "Duplicate Role"
        : "Edit Role";

  const dialogSubtitle =
    mode === "create"
      ? "Create a role and define the modules this role can access."
      : mode === "duplicate"
        ? "Clone permissions into a new custom role."
        : "Update permissions and scope for this role.";

  return (
    <DialogShell
      isOpen={isOpen}
      onClose={onClose}
      title={dialogTitle}
      subtitle={dialogSubtitle}
      icon={
        mode === "duplicate" ? (
          <Copy className="h-5 w-5 text-[#9B7415]" />
        ) : (
          <Shield className="h-5 w-5 text-[#9B7415]" />
        )
      }
      size="lg"
      isSubmitting={isSubmitting}
      initialFocusRef={nameInputRef}
      footer={
        <div className="flex w-full items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-9 px-4 text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </Button>

          {!isSystemRole && (
            <Button
              type="submit"
              form="role-form"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={
                isSubmitting ||
                !isValid ||
                !hasPermissions ||
                (mode === "edit" &&
                  !isDirty &&
                  JSON.stringify(permissions) ===
                    JSON.stringify(initialRole?.permissions))
              }
              className="h-9 px-5 text-xs font-semibold rounded-xl text-white bg-[#C9A227] hover:bg-[#B8901E] shadow-xs"
              leftIcon={<Check className="h-4 w-4" />}
            >
              {mode === "create" || mode === "duplicate"
                ? "Create Role"
                : "Save Changes"}
            </Button>
          )}
        </div>
      }
    >
      <form
        id="role-form"
        onSubmit={handleSubmit(onFormSubmit)}
        className="space-y-4"
        noValidate
      >
        {/* System Role Locked Banner */}
        {isSystemRole && (
          <div className="rounded-xl border border-slate-200 bg-slate-100 p-3.5 flex items-center gap-2.5 text-xs text-slate-700 font-medium">
            <Lock className="h-4 w-4 text-slate-500 shrink-0" />
            <span>
              <strong>System role is locked:</strong> Root administrative preset
              permissions cannot be modified or deactivated.
            </span>
          </div>
        )}

        {/* Current User Role Notice */}
        {isEditingCurrentRole && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Notice:</strong> You are editing your currently active
              role. Any permission modifications will apply to your session
              immediately upon saving.
            </p>
          </div>
        )}

        {/* API Error Alert */}
        {apiError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Role Name */}
        <div>
          <label
            htmlFor="role-name"
            className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5 block"
          >
            Role Name <span className="text-rose-500">*</span>
          </label>
          <input
            {...register("name")}
            ref={(e) => {
              register("name").ref(e);
              nameInputRef.current = e;
            }}
            id="role-name"
            type="text"
            disabled={isSubmitting || isSystemRole}
            placeholder="e.g. VIP Logistics Coordinator"
            className={cn(
              "w-full rounded-xl border bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 shadow-2xs outline-none transition-all placeholder:text-slate-400",
              isSystemRole
                ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                : errors.name
                  ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  : "border-slate-300 focus:border-[#C9A227] focus:ring-2 focus:ring-[#FAF4E6]",
            )}
          />
          {errors.name && (
            <p className="mt-1 text-[11px] font-semibold text-rose-600">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Description with live counter */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="role-desc"
              className="text-xs font-bold uppercase tracking-wider text-slate-800"
            >
              Description{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <span className="text-xs font-mono text-slate-500">
              {descriptionValue.length} / 160 characters
            </span>
          </div>
          <textarea
            {...register("description")}
            id="role-desc"
            rows={2}
            maxLength={160}
            disabled={isSubmitting || isSystemRole}
            placeholder="Summarize the administrative scope and responsibilities of operators holding this role…"
            className={cn(
              "w-full rounded-xl border bg-white p-2.5 text-xs sm:text-sm text-slate-900 shadow-2xs outline-none transition-all placeholder:text-slate-400 resize-none",
              isSystemRole
                ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                : "border-slate-300 focus:border-[#C9A227] focus:ring-2 focus:ring-[#FAF4E6]",
            )}
          />
        </div>

        {/* Module Permissions Matrix */}
        <div className="pt-2">
          <PermissionMatrix
            permissions={permissions}
            onChange={setPermissions}
            disabled={isSubmitting || isSystemRole}
          />
          {!hasPermissions && (
            <p className="mt-1 text-[11px] font-semibold text-rose-600">
              Please grant at least one module permission to this role.
            </p>
          )}
        </div>

        {/* Affected Users Info Box */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-start gap-2.5">
          <Users className="h-4 w-4 text-[#9B7415] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 space-y-0.5">
            <p className="font-semibold text-slate-800">
              Access Inheritance Policy
            </p>
            <p className="text-[11px] leading-relaxed">
              Users assigned to this role will inherit these permissions
              immediately upon saving.
              {mode === "edit" &&
                initialRole &&
                initialRole.assignedUserCount > 0 && (
                  <strong className="text-slate-900 block mt-1">
                    {initialRole.assignedUserCount} active{" "}
                    {initialRole.assignedUserCount === 1 ? "user" : "users"}{" "}
                    will be affected.
                  </strong>
                )}
            </p>
          </div>
        </div>
      </form>
    </DialogShell>
  );
};

export default RoleFormDialog;
