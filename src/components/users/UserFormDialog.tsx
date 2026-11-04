import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  userFormSchema,
  type UserFormValues,
} from "@/validations/user.validation";
import { DialogShell } from "@/components/common/DialogShell";
import { Button } from "@/components/ui/Button";
import {
  UserPlus,
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  KeyRound,
  AlertTriangle,
  Check,
  Lock,
} from "lucide-react";
import { getRoleScopeInfo } from "@/constants/permissions";
import type { Role, User } from "@/types/users.types";
import { cn } from "@/utils/cn";

export interface UserFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialUser?: User | null;
  roles: Role[];
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export const UserFormDialog: React.FC<UserFormDialogProps> = ({
  isOpen,
  mode,
  initialUser,
  roles,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const fullNameInputRef = useRef<HTMLInputElement | null>(null);

  const activeRoles = roles.filter((r) => r.status === "active");
  const defaultRoleId = activeRoles[0]?.id || "";

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      contact: "+91 ",
      roleId: defaultRoleId,
    },
    mode: "onChange",
  });

  const selectedRoleId = watch("roleId");
  const emailValue = watch("email");

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const roleScope = selectedRole
    ? getRoleScopeInfo(selectedRole.permissions)
    : null;

  // Soft warning for generic public domains
  const isGenericEmail =
    emailValue &&
    /@(gmail|yahoo|hotmail|outlook|aol)\.com$/i.test(emailValue.trim());

  const isEditingSelf = mode === "edit" && initialUser?.isCurrentUser;

  useEffect(() => {
    if (isOpen) {
      setApiError(null);
      if (mode === "edit" && initialUser) {
        reset({
          name: initialUser.name,
          email: initialUser.email,
          contact: initialUser.contact,
          roleId: initialUser.roleId,
        });
      } else {
        reset({
          name: "",
          email: "",
          contact: "+91 ",
          roleId: defaultRoleId,
        });
      }
    }
  }, [isOpen, mode, initialUser, reset, defaultRoleId]);

  const onFormSubmit = async (values: UserFormValues) => {
    try {
      setApiError(null);
      await onSubmit(values);
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to save user account.";
      setApiError(msg);
    }
  };

  return (
    <DialogShell
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Add New User" : "Edit User"}
      subtitle={
        mode === "create"
          ? "Create a user account and assign portal access."
          : "Update user details and role assignment."
      }
      icon={<UserPlus className="h-5 w-5 text-[#9B7415]" />}
      size="md"
      isSubmitting={isSubmitting}
      initialFocusRef={fullNameInputRef}
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

          <Button
            type="submit"
            form="user-form"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={isSubmitting || !isValid || (mode === "edit" && !isDirty)}
            className="h-9 px-5 text-xs font-semibold rounded-xl text-white bg-[#C9A227] hover:bg-[#B8901E] shadow-xs"
            leftIcon={<Check className="h-4 w-4" />}
          >
            {mode === "create" ? "Create User" : "Save Changes"}
          </Button>
        </div>
      }
    >
      <form
        id="user-form"
        onSubmit={handleSubmit(onFormSubmit)}
        className="space-y-4"
        noValidate
      >
        {/* Inline API Error Alert */}
        {apiError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Full Name */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
            <label
              htmlFor="user-fullname"
              className="text-xs font-bold uppercase tracking-wider text-slate-800"
            >
              Full Name <span className="text-rose-500">*</span>
            </label>
            <span
              id="name-hint"
              className="text-[11px] text-slate-400 font-medium"
            >
              Official ID name
            </span>
          </div>
          <div className="relative">
            <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              {...register("name")}
              ref={(e) => {
                register("name").ref(e);
                fullNameInputRef.current = e;
              }}
              id="user-fullname"
              type="text"
              autoComplete="name"
              placeholder="e.g. John Doe"
              aria-describedby="name-hint"
              disabled={isSubmitting}
              className={cn(
                "w-full rounded-xl border bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 shadow-2xs outline-none transition-all placeholder:text-slate-400",
                errors.name
                  ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  : "border-slate-300 focus:border-[#C9A227] focus:ring-2 focus:ring-[#FAF4E6]",
              )}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-[11px] font-semibold text-rose-600">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
            <label
              htmlFor="user-email"
              className="text-xs font-bold uppercase tracking-wider text-slate-800"
            >
              Email Address <span className="text-rose-500">*</span>
            </label>
            <span
              id="email-hint"
              className="text-[11px] text-slate-400 font-medium"
            >
              Work domain preferred
            </span>
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              {...register("email")}
              id="user-email"
              type="email"
              autoComplete="email"
              readOnly={mode === "edit"}
              placeholder="operator@jeffsgroup.org"
              aria-describedby="email-hint"
              disabled={isSubmitting || mode === "edit"}
              className={cn(
                "w-full rounded-xl border bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 shadow-2xs outline-none transition-all placeholder:text-slate-400",
                mode === "edit"
                  ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                  : errors.email
                    ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    : "border-slate-300 focus:border-[#C9A227] focus:ring-2 focus:ring-[#FAF4E6]",
              )}
            />
            {mode === "edit" && (
              <Lock className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            )}
          </div>
          {errors.email && (
            <p className="mt-1 text-[11px] font-semibold text-rose-600">
              {errors.email.message}
            </p>
          )}
          {mode === "create" && isGenericEmail && (
            <p className="mt-1 text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
              Tip: Tournament operations prefer official organization or club
              domain emails.
            </p>
          )}
        </div>

        {/* Contact Number */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
            <label
              htmlFor="user-contact"
              className="text-xs font-bold uppercase tracking-wider text-slate-800"
            >
              Contact Number <span className="text-rose-500">*</span>
            </label>
            <span
              id="phone-hint"
              className="text-[11px] text-slate-400 font-medium"
            >
              Country code included
            </span>
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              {...register("contact")}
              id="user-contact"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+91 98450 12345"
              aria-describedby="phone-hint"
              disabled={isSubmitting}
              className={cn(
                "w-full rounded-xl border bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 shadow-2xs outline-none transition-all placeholder:text-slate-400 font-mono",
                errors.contact
                  ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  : "border-slate-300 focus:border-[#C9A227] focus:ring-2 focus:ring-[#FAF4E6]",
              )}
            />
          </div>
          {errors.contact && (
            <p className="mt-1 text-[11px] font-semibold text-rose-600">
              {errors.contact.message}
            </p>
          )}
        </div>

        {/* Assign Role */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
            <label
              htmlFor="user-role"
              className="text-xs font-bold uppercase tracking-wider text-slate-800"
            >
              Assign Role <span className="text-rose-500">*</span>
            </label>
            <span
              id="role-hint"
              className="text-[11px] text-slate-400 font-medium"
            >
              Pre-configured scope
            </span>
          </div>

          <div className="relative">
            <Shield className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <select
              {...register("roleId")}
              id="user-role"
              disabled={isSubmitting || isEditingSelf}
              aria-describedby="role-hint"
              className={cn(
                "w-full rounded-xl border bg-white py-2 pl-9 pr-8 text-xs sm:text-sm text-slate-900 shadow-2xs outline-none transition-all cursor-pointer",
                isEditingSelf
                  ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                  : "border-slate-300 focus:border-[#C9A227] focus:ring-2 focus:ring-[#FAF4E6]",
              )}
            >
              {activeRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>

          {isEditingSelf && (
            <p className="mt-1 text-[11px] text-slate-500 italic">
              Security notice: You cannot change your own assigned role.
            </p>
          )}

          {/* Live Summary of chosen role */}
          {roleScope && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">
                  Scope Overview:
                </span>
                <span className="font-bold text-[#644813] bg-[#FAF4E6] px-2 py-0.5 rounded-full border border-[#ECD59A] text-[10px]">
                  {roleScope.scopeLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                {roleScope.moduleListText} ({roleScope.permissionSummaryText})
              </p>
            </div>
          )}
        </div>

        {/* Credentials Notice (Create Mode Only) */}
        {mode === "create" && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-[#C9A227]">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-slate-900">
                Login Credentials
              </h5>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                Temporary login credentials will be automatically generated and
                shared with the user&apos;s registered email address.
              </p>
            </div>
          </div>
        )}
      </form>
    </DialogShell>
  );
};

export default UserFormDialog;
