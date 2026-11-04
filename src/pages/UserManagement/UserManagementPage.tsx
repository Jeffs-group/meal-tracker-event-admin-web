import React, { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Users,
  Shield,
  Plus,
  RotateCcw,
  Key,
  Mail,
  UserX,
  UserCheck,
  Trash2,
  Lock,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { StatusPill } from "@/components/ui/StatusPill";
import { Avatar } from "@/components/ui/Avatar";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { usePermissions } from "@/hooks/usePermissions";
import { useTableFilters } from "@/hooks/useTableFilters";
import {
  useUsers,
  useRoles,
  useUserMutations,
  useRoleMutations,
} from "@/hooks/useUsers";
import { UserFormDialog } from "@/components/users/UserFormDialog";
import { RoleFormDialog } from "@/components/users/RoleFormDialog";
import { UserRowMenu } from "@/components/users/UserRowMenu";
import { RoleRowMenu } from "@/components/users/RoleRowMenu";
import { AvatarStack } from "@/components/users/AvatarStack";
import { RoleScopeSummary } from "@/components/users/RoleScopeSummary";
import { UserCardList } from "@/components/users/UserCardList";
import { RoleCardList } from "@/components/users/RoleCardList";
import type { User, Role, UserStatus, RoleStatus } from "@/types/users.types";
import type { UserFormValues } from "@/validations/user.validation";

export const UserManagementPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "roles";
  const roleFilterParam = searchParams.get("roleId") || "";

  const {
    can,
    user: currentAuthUser,
    getMissingPermissionTooltip,
  } = usePermissions();
  const canCreate = can("users", "create");

  // Filters for Users tab
  const userFilters = useTableFilters({
    page: 1,
    pageSize: 6,
    search: "",
    status: "ALL",
  });

  // Filter for Roles tab
  const [roleSearch, setRoleSearch] = useState("");

  // Queries
  const {
    data: usersData,
    isLoading: isUsersLoading,
    isError: isUsersError,
    error: usersError,
    refetch: refetchUsers,
  } = useUsers({
    page: userFilters.page,
    pageSize: userFilters.pageSize,
    search: userFilters.debouncedSearch,
    roleId: roleFilterParam || undefined,
    status: userFilters.status !== "ALL" ? userFilters.status : undefined,
  });

  const {
    data: rolesData,
    isLoading: isRolesLoading,
    isError: isRolesError,
    error: rolesError,
    refetch: refetchRoles,
  } = useRoles({
    search: roleSearch,
  });

  // Mutations
  const userMutations = useUserMutations();
  const roleMutations = useRoleMutations();

  // Dialog states
  const [userModal, setUserModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    user?: User | null;
  }>({ isOpen: false, mode: "create" });

  const [roleModal, setRoleModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit" | "duplicate";
    role?: Role | null;
  }>({ isOpen: false, mode: "create" });

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type:
      | "statusUser"
      | "resetPassword"
      | "resendCredentials"
      | "statusRole"
      | "deleteRole";
    user?: User | null;
    role?: Role | null;
    actionNote?: string;
  }>({ isOpen: false, type: "statusUser" });

  // Toast
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const users = usersData?.items ?? [];
  const usersStats = usersData?.stats ?? {
    total: 0,
    active: 0,
    inactive: 0,
    activeRoleCount: 0,
  };
  const roles = rolesData?.items ?? [];
  const rolesStats = rolesData?.stats ?? {
    total: 0,
    system: 0,
    custom: 0,
    superadminTier: 0,
    delegated: 0,
    delegatedActiveOperators: 0,
    moduleCount: 5,
  };

  const handleTabChange = (tabId: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", tabId);
        return next;
      },
      { replace: true },
    );
  };

  const tabs: TabItem[] = [
    {
      id: "roles",
      label: "Roles & Permissions",
      count: rolesStats.total,
      icon: <Shield className="h-4 w-4" />,
    },
    {
      id: "users",
      label: "Users",
      count: usersStats.total,
      icon: <Users className="h-4 w-4" />,
    },
  ];

  // Active percentage calculation
  const activeUserPct = useMemo(() => {
    if (usersStats.total === 0) return 0;
    return Math.round((usersStats.active / usersStats.total) * 1000) / 10;
  }, [usersStats.active, usersStats.total]);

  // Primary contextual button click
  const handlePrimaryAction = () => {
    if (currentTab === "users") {
      setUserModal({ isOpen: true, mode: "create", user: null });
    } else {
      setRoleModal({ isOpen: true, mode: "create", role: null });
    }
  };

  // Form submit handlers
  const handleUserFormSubmit = async (values: UserFormValues) => {
    if (userModal.mode === "create") {
      await userMutations.createUser(values);
      showToast(`User ${values.name} created successfully.`);
    } else if (userModal.user) {
      await userMutations.updateUser({
        id: userModal.user.id,
        payload: {
          name: values.name,
          contact: values.contact,
          roleId: values.roleId,
        },
      });
      showToast(`User details for ${values.name} updated.`);
    }
  };

  const handleRoleFormSubmit = async (payload: {
    name: string;
    description?: string;
    permissions: Role["permissions"];
  }) => {
    if (roleModal.mode === "create" || roleModal.mode === "duplicate") {
      const created = await roleMutations.createRole({
        name: payload.name,
        description: payload.description,
        permissions: payload.permissions,
      });
      showToast(`Role ${created.name} (${created.code}) saved successfully.`);
    } else if (roleModal.role) {
      await roleMutations.updateRole({
        id: roleModal.role.id,
        payload: {
          name: payload.name,
          description: payload.description,
          permissions: payload.permissions,
        },
      });
      showToast(`Role ${payload.name} updated.`);
    }
  };

  // Confirm action executor
  const handleConfirmAction = async () => {
    try {
      if (confirmState.type === "statusUser" && confirmState.user) {
        const nextStatus: UserStatus =
          confirmState.user.status === "active" ? "inactive" : "active";
        await userMutations.setUserStatus({
          id: confirmState.user.id,
          status: nextStatus,
        });
        showToast(
          `User ${confirmState.user.name} ${nextStatus === "active" ? "activated" : "deactivated"}.`,
        );
      } else if (confirmState.type === "resetPassword" && confirmState.user) {
        const res = await userMutations.sendPasswordReset(confirmState.user.id);
        showToast(res.message);
      } else if (
        confirmState.type === "resendCredentials" &&
        confirmState.user
      ) {
        const res = await userMutations.resendCredentials(confirmState.user.id);
        showToast(res.message);
      } else if (confirmState.type === "statusRole" && confirmState.role) {
        const nextStatus: RoleStatus =
          confirmState.role.status === "active" ? "inactive" : "active";
        await roleMutations.setRoleStatus({
          id: confirmState.role.id,
          status: nextStatus,
        });
        showToast(
          `Role ${confirmState.role.name} ${nextStatus === "active" ? "activated" : "deactivated"}.`,
        );
      } else if (confirmState.type === "deleteRole" && confirmState.role) {
        const res = await roleMutations.deleteRole(confirmState.role.id);
        showToast(res.message);
      }
      setConfirmState({ isOpen: false, type: "statusUser" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Action failed.";
      showToast(msg, "error");
    }
  };

  // User table columns
  const userColumns: ColumnDef<User>[] = [
    {
      key: "name",
      header: "User Name",
      render: (u) => {
        const handle = `@${u.email.split("@")[0] || ""}`;
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={u.name} size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs text-slate-900 truncate">
                  {u.name}
                </span>
                {u.isCurrentUser && (
                  <span className="rounded-md bg-[#FAF4E6] px-1.5 py-0.2 font-mono text-[10px] font-bold text-[#644813] border border-[#ECD59A]">
                    You
                  </span>
                )}
              </div>
              <p className="font-mono text-[11px] text-slate-400 truncate">
                {handle}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "email",
      header: "Email Address",
      render: (u) => (
        <span
          className="text-xs text-slate-700 truncate max-w-[220px] block"
          title={u.email}
        >
          {u.email}
        </span>
      ),
    },
    {
      key: "contact",
      header: "Contact Number",
      render: (u) => (
        <span className="font-mono text-xs text-slate-700 whitespace-nowrap">
          {u.contact}
        </span>
      ),
    },
    {
      key: "role",
      header: "Assigned Role",
      render: (u) => (
        <div className="max-w-[200px]">
          <span className="font-bold text-xs text-slate-800 line-clamp-2">
            {u.roleName}
          </span>
          {u.roleCode && (
            <span className="font-mono text-[10px] text-slate-400 block">
              {u.roleCode}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (u) => (
        <StatusPill
          status={u.status.toUpperCase() as "ACTIVE" | "INACTIVE"}
          size="sm"
        />
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      render: (u) => (
        <UserRowMenu
          user={u}
          onEdit={(user) => setUserModal({ isOpen: true, mode: "edit", user })}
          onResetPassword={(user) =>
            setConfirmState({ isOpen: true, type: "resetPassword", user })
          }
          onResendCredentials={(user) =>
            setConfirmState({ isOpen: true, type: "resendCredentials", user })
          }
          onToggleStatus={(user) =>
            setConfirmState({ isOpen: true, type: "statusUser", user })
          }
        />
      ),
    },
  ];

  // Role table columns
  const roleColumns: ColumnDef<Role>[] = [
    {
      key: "name",
      header: "Role Name",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF4E6] text-[#9B7415] border border-[#ECD59A]/80 shrink-0">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs sm:text-sm text-slate-900">
                {r.name}
              </span>
              {r.isSystem && (
                <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 border border-slate-200">
                  <Lock className="h-2.5 w-2.5" />
                  System
                </span>
              )}
            </div>
            <span className="font-mono text-[11px] text-slate-400 block font-semibold">
              {r.code}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (r) => (
        <p
          className="text-xs text-slate-600 min-w-[220px] max-w-[320px] line-clamp-2 leading-relaxed"
          title={r.description || undefined}
        >
          {r.description || "—"}
        </p>
      ),
    },
    {
      key: "assignedUsers",
      header: "Assigned Users",
      render: (r) => (
        <AvatarStack
          roleId={r.id}
          roleName={r.name}
          totalCount={r.assignedUserCount}
          usersPreview={r.assignedUsersPreview}
        />
      ),
    },
    {
      key: "permissions",
      header: "Permissions Scope",
      render: (r) => (
        <RoleScopeSummary
          permissions={r.permissions}
          isSuperadmin={r.tier === "superadmin"}
        />
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusPill
          status={r.status.toUpperCase() as "ACTIVE" | "INACTIVE"}
          size="sm"
        />
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      render: (r) => (
        <RoleRowMenu
          role={r}
          onEdit={(role) => setRoleModal({ isOpen: true, mode: "edit", role })}
          onDuplicate={(role) =>
            setRoleModal({ isOpen: true, mode: "duplicate", role })
          }
          onToggleStatus={(role) =>
            setConfirmState({ isOpen: true, type: "statusRole", role })
          }
          onDelete={(role) =>
            setConfirmState({ isOpen: true, type: "deleteRole", role })
          }
        />
      ),
    },
  ];

  const primaryActionLabel =
    currentTab === "users" ? "Add User" : "Create Role";
  const missingPermTooltip = !canCreate
    ? getMissingPermissionTooltip("users", "create")
    : undefined;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          role={toast.type === "error" ? "alert" : "status"}
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-md animate-in fade-in ${
            toast.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-xs font-bold underline ml-3 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "User Management" },
        ]}
        title="User & Role Management"
        description="Manage tournament operators, defined administrative roles, and access permission scopes across event modules."
      />

      {/* Tabs Navigation with seamless Right Action Button */}
      <Tabs
        tabs={tabs}
        activeTab={currentTab}
        onChange={handleTabChange}
        variant="underline"
        className="mb-6"
        rightSlot={
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrimaryAction}
            disabled={!canCreate}
            title={missingPermTooltip}
            className="rounded-xl shadow-xs text-xs font-semibold px-4 py-2 bg-[#C9A227] hover:bg-[#B58E1E] text-white"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            {primaryActionLabel}
          </Button>
        }
      />

      {/* Primary Action Button (Mobile: full width underneath tabs) */}
      <div className="sm:hidden mb-6 -mt-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handlePrimaryAction}
          disabled={!canCreate}
          title={missingPermTooltip}
          className="w-full justify-center rounded-xl shadow-xs text-xs font-semibold py-2.5 bg-[#C9A227] hover:bg-[#B58E1E] text-white"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          {primaryActionLabel}
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: USERS DIRECTORY */}
      {/* ========================================================================= */}
      {currentTab === "users" && (
        <div className="space-y-6">
          {/* 3 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="TOTAL USERS"
              value={isUsersLoading ? "..." : usersStats.total}
              subtitle="registered"
              badgeText={`Across ${usersStats.activeRoleCount} active roles`}
              badgeVariant="neutral"
              icon={<Users className="h-5 w-5 text-slate-400" />}
            />

            <StatCard
              title="ACTIVE USERS"
              value={isUsersLoading ? "..." : usersStats.active}
              subtitle="Authorized portal access"
              badgeText={`${activeUserPct}% active`}
              badgeVariant="success"
              icon={<UserCheck className="h-5 w-5 text-emerald-500" />}
            />

            <StatCard
              title="INACTIVE USERS"
              value={isUsersLoading ? "..." : usersStats.inactive}
              subtitle="deactivated"
              badgeText="Deactivated accounts"
              badgeVariant="danger"
              icon={<UserX className="h-5 w-5 text-rose-500" />}
            />
          </div>

          {/* Filter Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <SearchInput
                  value={userFilters.search}
                  onChange={(val) => userFilters.setSearch(val)}
                  placeholder="Search by name or email…"
                />
              </div>

              <div className="w-full sm:w-48">
                <Select
                  options={[
                    { value: "", label: "All Roles" },
                    ...roles.map((r) => ({ value: r.id, label: r.name })),
                  ]}
                  value={roleFilterParam}
                  onChange={(e) => {
                    setSearchParams(
                      (prev) => {
                        const next = new URLSearchParams(prev);
                        if (!e.target.value) next.delete("roleId");
                        else next.set("roleId", e.target.value);
                        next.set("page", "1");
                        return next;
                      },
                      { replace: true },
                    );
                  }}
                />
              </div>

              <div className="w-full sm:w-40">
                <Select
                  options={[
                    { value: "ALL", label: "All Status" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                  value={userFilters.status || "ALL"}
                  onChange={(e) => userFilters.setStatus(e.target.value)}
                />
              </div>

              {(userFilters.search ||
                roleFilterParam ||
                (userFilters.status && userFilters.status !== "ALL")) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    userFilters.resetFilters();
                    setSearchParams(
                      (prev) => {
                        const next = new URLSearchParams(prev);
                        next.delete("roleId");
                        return next;
                      },
                      { replace: true },
                    );
                  }}
                  leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                  className="rounded-xl border-slate-300 text-xs font-semibold"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Users Table (≥768px) */}
          {isUsersError ? (
            <ErrorDisplay
              title="Failed to Load Users"
              message={
                usersError instanceof Error
                  ? usersError.message
                  : "An unexpected error occurred."
              }
              onRetry={() => refetchUsers()}
            />
          ) : (
            <div className="hidden md:block">
              <DataTable
                columns={userColumns}
                data={users}
                isLoading={isUsersLoading}
                emptyTitle="No Users Found"
                emptyDescription="No portal users match your search query or filter selection."
                onEmptyAction={() => {
                  userFilters.resetFilters();
                  setSearchParams(
                    (prev) => {
                      const next = new URLSearchParams(prev);
                      next.delete("roleId");
                      return next;
                    },
                    { replace: true },
                  );
                }}
                emptyActionLabel="Clear Filters"
                getId={(u) => u.id}
              />
            </div>
          )}

          {/* Mobile Users Cards (<768px) */}
          <UserCardList
            users={users}
            onEdit={(user) =>
              setUserModal({ isOpen: true, mode: "edit", user })
            }
            onResetPassword={(user) =>
              setConfirmState({ isOpen: true, type: "resetPassword", user })
            }
            onResendCredentials={(user) =>
              setConfirmState({ isOpen: true, type: "resendCredentials", user })
            }
            onToggleStatus={(user) =>
              setConfirmState({ isOpen: true, type: "statusUser", user })
            }
          />

          {/* Pagination Footer */}
          {usersData && usersData.total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500 font-medium">
                Showing {(userFilters.page - 1) * userFilters.pageSize + 1} to{" "}
                {Math.min(
                  userFilters.page * userFilters.pageSize,
                  usersData.total,
                )}{" "}
                of {usersData.total} users
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Rows:</span>
                  <select
                    value={userFilters.pageSize}
                    onChange={(e) =>
                      userFilters.setPageSize(Number(e.target.value))
                    }
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 shadow-2xs outline-none"
                  >
                    <option value={6}>6</option>
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                  </select>
                </div>

                <Pagination
                  currentPage={userFilters.page}
                  totalPages={
                    Math.ceil(usersData.total / userFilters.pageSize) || 1
                  }
                  totalItems={usersData.total}
                  pageSize={userFilters.pageSize}
                  onPageChange={userFilters.setPage}
                  onPageSizeChange={userFilters.setPageSize}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ROLES & PERMISSIONS */}
      {/* ========================================================================= */}
      {currentTab === "roles" && (
        <div className="space-y-6">
          {/* 3 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="TOTAL DEFINED ROLES"
              value={isRolesLoading ? "..." : rolesStats.total}
              subtitle={`Covering ${rolesStats.moduleCount} administrative modules`}
              badgeText={`${rolesStats.system} system · ${rolesStats.custom} custom`}
              badgeVariant="neutral"
              icon={<Shield className="h-5 w-5 text-slate-400" />}
            />

            <StatCard
              title="ADMINISTRATOR ROLES"
              value={isRolesLoading ? "..." : rolesStats.superadminTier}
              subtitle="Full Authority"
              badgeText="All 5 modules full access"
              badgeVariant="warning"
              icon={<Lock className="h-5 w-5 text-[#C9A227]" />}
            />

            <StatCard
              title="DELEGATED ROLES"
              value={isRolesLoading ? "..." : rolesStats.delegated}
              subtitle="Custom Permissions"
              badgeText={`${rolesStats.delegatedActiveOperators} active operators`}
              badgeVariant="success"
              icon={<Users className="h-5 w-5 text-emerald-500" />}
            />
          </div>

          {/* Filter Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <SearchInput
                  value={roleSearch}
                  onChange={setRoleSearch}
                  placeholder="Filter roles…"
                />
              </div>

              {roleSearch && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRoleSearch("")}
                  leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                  className="rounded-xl border-slate-300 text-xs font-semibold"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Roles Table (≥768px) */}
          {isRolesError ? (
            <ErrorDisplay
              title="Failed to Load Roles"
              message={
                rolesError instanceof Error
                  ? rolesError.message
                  : "An unexpected error occurred."
              }
              onRetry={() => refetchRoles()}
            />
          ) : (
            <div className="hidden md:block">
              <DataTable
                columns={roleColumns}
                data={roles}
                isLoading={isRolesLoading}
                emptyTitle="No Roles Defined"
                emptyDescription="No administrative roles match your search keyword."
                onEmptyAction={() => setRoleSearch("")}
                emptyActionLabel="Clear Filter"
                getId={(r) => r.id}
              />
            </div>
          )}

          {/* Mobile Roles Cards (<768px) */}
          <RoleCardList
            roles={roles}
            onEdit={(role) =>
              setRoleModal({ isOpen: true, mode: "edit", role })
            }
            onDuplicate={(role) =>
              setRoleModal({ isOpen: true, mode: "duplicate", role })
            }
            onToggleStatus={(role) =>
              setConfirmState({ isOpen: true, type: "statusRole", role })
            }
            onDelete={(role) =>
              setConfirmState({ isOpen: true, type: "deleteRole", role })
            }
          />

          {/* Roles Table Summary Footer */}
          {rolesData && (
            <div className="text-xs text-slate-500 font-medium pt-2">
              Showing 1 to {roles.length} of {rolesStats.total} roles
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOGS */}
      {/* ========================================================================= */}

      {/* User Form Dialog (Add / Edit) */}
      <UserFormDialog
        isOpen={userModal.isOpen}
        mode={userModal.mode}
        initialUser={userModal.user}
        roles={roles}
        onClose={() =>
          setUserModal({ isOpen: false, mode: "create", user: null })
        }
        onSubmit={handleUserFormSubmit}
        isSubmitting={userMutations.isCreating || userMutations.isUpdating}
      />

      {/* Role Form Dialog (Create / Edit / Duplicate) */}
      <RoleFormDialog
        isOpen={roleModal.isOpen}
        mode={roleModal.mode}
        initialRole={roleModal.role}
        currentUserRoleId={currentAuthUser?.roleId}
        onClose={() =>
          setRoleModal({ isOpen: false, mode: "create", role: null })
        }
        onSubmit={handleRoleFormSubmit}
        isSubmitting={
          roleMutations.isCreating ||
          roleMutations.isUpdating ||
          roleMutations.isDuplicating
        }
      />

      {/* Confirm Action Dialog */}
      <ConfirmActionDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, type: "statusUser" })}
        onConfirm={handleConfirmAction}
        isSubmitting={
          userMutations.isSettingStatus ||
          userMutations.isSendingReset ||
          userMutations.isResendingCredentials ||
          roleMutations.isSettingStatus ||
          roleMutations.isDeleting
        }
        title={
          confirmState.type === "statusUser"
            ? confirmState.user?.status === "active"
              ? "Deactivate User Account?"
              : "Reactivate User Account?"
            : confirmState.type === "resetPassword"
              ? "Send Password Reset Link?"
              : confirmState.type === "resendCredentials"
                ? "Resend Temporary Credentials?"
                : confirmState.type === "statusRole"
                  ? confirmState.role?.status === "active"
                    ? "Deactivate Role?"
                    : "Activate Role?"
                  : "Delete Role?"
        }
        subtitle={
          confirmState.type === "statusUser"
            ? confirmState.user?.status === "active"
              ? "They will be signed out and lose portal access immediately."
              : "They will regain portal access with their assigned role."
            : confirmState.type === "resetPassword"
              ? `A secure one-time password reset link will be dispatched to ${confirmState.user?.email}.`
              : confirmState.type === "resendCredentials"
                ? `Resend temporary portal sign-in credentials to ${confirmState.user?.email}.`
                : confirmState.type === "statusRole"
                  ? confirmState.role?.status === "active"
                    ? "Deactivating this role will prevent assigning it to any new portal users."
                    : "Reactivating this role will permit assigning it to users."
                  : `Are you sure you want to permanently delete role ${confirmState.role?.name}? This action cannot be undone.`
        }
        tone={
          confirmState.type === "deleteRole" ||
          (confirmState.type === "statusUser" &&
            confirmState.user?.status === "active")
            ? "danger"
            : confirmState.type === "statusRole" &&
                confirmState.role?.status === "active"
              ? "neutral"
              : "success"
        }
        confirmLabel={
          confirmState.type === "statusUser"
            ? confirmState.user?.status === "active"
              ? "Deactivate User"
              : "Activate User"
            : confirmState.type === "resetPassword"
              ? "Send Reset Link"
              : confirmState.type === "resendCredentials"
                ? "Resend Credentials"
                : confirmState.type === "statusRole"
                  ? confirmState.role?.status === "active"
                    ? "Deactivate Role"
                    : "Activate Role"
                  : "Delete Role"
        }
        confirmIcon={
          confirmState.type === "deleteRole" ? (
            <Trash2 className="h-4 w-4" />
          ) : confirmState.type === "resetPassword" ? (
            <Key className="h-4 w-4" />
          ) : confirmState.type === "resendCredentials" ? (
            <Mail className="h-4 w-4" />
          ) : confirmState.type === "statusUser" &&
            confirmState.user?.status === "active" ? (
            <UserX className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )
        }
      >
        {/* User Card inside confirm modal */}
        {confirmState.user && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
            <div className="flex items-center gap-3">
              <Avatar name={confirmState.user.name} size="sm" />
              <div>
                <p className="font-bold text-xs text-slate-900">
                  {confirmState.user.name}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {confirmState.user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
              <span className="text-slate-500">Role:</span>
              <span className="font-semibold text-slate-800">
                {confirmState.user.roleName}
              </span>
            </div>
          </div>
        )}

        {/* Role Notice inside confirm modal */}
        {confirmState.role && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-slate-900">
                  {confirmState.role.name}
                </p>
                <p className="font-mono text-[11px] text-slate-400">
                  {confirmState.role.code}
                </p>
              </div>
              <span className="font-semibold text-xs text-slate-700">
                {confirmState.role.assignedUserCount} assigned
              </span>
            </div>

            {confirmState.type === "deleteRole" &&
              confirmState.role.assignedUserCount > 0 && (
                <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs">
                  <p className="font-semibold">
                    Cannot delete role with assigned users.
                  </p>
                  <Link
                    to={`/user-management?tab=users&roleId=${confirmState.role.id}`}
                    onClick={() =>
                      setConfirmState({ isOpen: false, type: "statusUser" })
                    }
                    className="mt-1 text-[#9B7415] underline font-bold block"
                  >
                    Reassign the {confirmState.role.assignedUserCount} users
                    first →
                  </Link>
                </div>
              )}
          </div>
        )}
      </ConfirmActionDialog>
    </div>
  );
};

export default UserManagementPage;
