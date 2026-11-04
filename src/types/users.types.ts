export type ModuleKey =
  "dashboard" | "registrations" | "teams" | "users" | "reports";

export type PermissionAction = "view" | "create" | "edit" | "manage";

export type RoleTier = "superadmin" | "delegated";

export type RoleStatus = "active" | "inactive";

export type UserStatus = "active" | "inactive";

export interface RoleUserPreview {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
}

export interface Role {
  id: string;
  code: string; // e.g. ROLE-001
  name: string;
  description: string;
  tier: RoleTier;
  isSystem: boolean;
  status: RoleStatus;
  permissions: Record<ModuleKey, PermissionAction[]>;
  assignedUserCount: number;
  assignedUsersPreview: RoleUserPreview[];
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  contact: string;
  roleId: string;
  roleName: string;
  roleCode?: string;
  status: UserStatus;
  mustChangePassword: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
  isCurrentUser?: boolean;
}

export interface UserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  roleId?: string;
  status?: string;
  sortBy?: "name" | "email" | "role" | "status" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface UserListStats {
  total: number;
  active: number;
  inactive: number;
  activeRoleCount: number;
}

export interface UserListResponse {
  items: User[];
  total: number;
  stats: UserListStats;
}

export interface RoleListParams {
  search?: string;
  sortBy?: "name" | "code" | "assignedUserCount" | "status";
  sortOrder?: "asc" | "desc";
}

export interface RoleListStats {
  total: number;
  system: number;
  custom: number;
  superadminTier: number;
  delegated: number;
  delegatedActiveOperators: number;
  moduleCount: number;
}

export interface RoleListResponse {
  items: Role[];
  total: number;
  stats: RoleListStats;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  contact: string;
  roleId: string;
}

export interface UpdateUserPayload {
  name: string;
  contact: string;
  roleId: string;
  status?: UserStatus;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissions: Record<ModuleKey, PermissionAction[]>;
}

export interface UpdateRolePayload {
  name: string;
  description?: string;
  permissions: Record<ModuleKey, PermissionAction[]>;
  status?: RoleStatus;
}

export interface RoleScopeInfo {
  totalModules: number;
  coveredModulesCount: number;
  scopeLabel: string; // e.g. "All Modules (5/5)" or "3 Modules"
  moduleListText: string; // e.g. "Registrations, Manage Teams, Reports"
  permissionSummaryText: string; // e.g. "Full Authority" or "View & Edit"
}
