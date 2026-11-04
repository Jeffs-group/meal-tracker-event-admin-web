import { axiosInstance } from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import type {
  User,
  Role,
  UserListParams,
  UserListResponse,
  RoleListParams,
  RoleListResponse,
  CreateUserPayload,
  UpdateUserPayload,
  CreateRolePayload,
  UpdateRolePayload,
  UserStatus,
  RoleStatus,
  ModuleKey,
  PermissionAction,
  UserListStats,
  RoleListStats,
} from "@/types/users.types";

interface BackendUserSummaryDto {
  totalUsers: number;
  activeUsers: number;
  activePercentage: number;
  inactiveUsers: number;
}

interface BackendUserResponseDto {
  id: string;
  userCode?: string | null;
  name: string;
  email: string;
  contactNumber?: string | null;
  handle?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  accountStatus: "ACTIVE" | "INVITATION_PENDING" | "INACTIVE";
  invitationStatus: "PENDING" | "ACCEPTED" | "EXPIRED";
  liveStation?: string | null;
  lastLogin?: string | null;
  roleId: string;
  role?: {
    id: string;
    name: string;
    code?: string | null;
    portal: "EVENT" | "SUPER";
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface BackendRoleSummaryDto {
  totalDefinedRoles: number;
  superAdminTier: number;
  delegatedStaffRoles: number;
  activeOperatorsCount: number;
}

interface BackendRoleResponseDto {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  portal: "EVENT" | "SUPER";
  isSystem: boolean;
  isActive?: boolean;
  permissionsScope?: string;
  permissions: Array<string | { permission: string }>;
  assignedUserCount?: number;
  assignedUsersCount?: number;
  assignedUsers?: Array<{
    id: string;
    name: string;
    initials: string;
    email: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

function permissionsToFlatList(
  matrix: Record<ModuleKey, PermissionAction[]>,
): string[] {
  const result: string[] = [];
  for (const [mod, actions] of Object.entries(matrix)) {
    for (const act of actions) {
      result.push(`${mod}.${act}`);
    }
  }
  return result;
}

function flatListToPermissions(
  list?: Array<string | { permission: string }>,
): Record<ModuleKey, PermissionAction[]> {
  const result: Record<ModuleKey, PermissionAction[]> = {
    dashboard: ["view"],
    registrations: [],
    teams: [],
    users: [],
    reports: [],
  };

  if (!list || !Array.isArray(list)) return result;

  for (const rawItem of list) {
    if (!rawItem) continue;
    const itemStr = typeof rawItem === "string" ? rawItem : rawItem.permission;
    if (!itemStr || typeof itemStr !== "string") continue;

    const sep = itemStr.includes(":")
      ? ":"
      : itemStr.includes(".")
        ? "."
        : null;
    if (sep) {
      const parts = itemStr.split(sep);
      const mod = parts[0]?.toLowerCase() as ModuleKey;
      let act = parts[1]?.toLowerCase() as PermissionAction;
      if ((act as string) === "read") act = "view";
      if ((act as string) === "review") act = "manage";

      if (
        mod &&
        mod in result &&
        act &&
        ["view", "create", "edit", "manage"].includes(act)
      ) {
        if (!result[mod].includes(act)) {
          result[mod].push(act);
        }
      }
    } else if (itemStr in result) {
      result[itemStr as ModuleKey] = ["view", "create", "edit", "manage"];
    }
  }
  return result;
}

function mapBackendUserToUser(dto: BackendUserResponseDto): User {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    contact: dto.contactNumber || "—",
    roleId: dto.roleId,
    roleName: dto.role?.name || "Event Operator",
    roleCode: dto.role?.code || "ROLE-OP",
    status: dto.isActive ? "active" : "inactive",
    mustChangePassword: false,
    lastLoginAt: dto.lastLogin || undefined,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    avatarUrl: dto.avatarUrl || undefined,
  };
}

function mapBackendRoleToRole(dto: BackendRoleResponseDto): Role {
  const isSuper =
    dto.name.toLowerCase().includes("super") ||
    dto.name.toLowerCase().includes("owner") ||
    dto.portal === "SUPER";

  const assignedCount =
    dto.assignedUserCount ??
    dto.assignedUsersCount ??
    dto.assignedUsers?.length ??
    0;

  return {
    id: dto.id,
    code: dto.code || `ROLE-${dto.id.slice(0, 4).toUpperCase()}`,
    name: dto.name,
    description:
      dto.description ||
      "Configured security role with custom operational scopes.",
    tier: isSuper ? "superadmin" : "delegated",
    isSystem: dto.isSystem,
    status: dto.isActive !== false ? "active" : "inactive",
    permissions: flatListToPermissions(dto.permissions),
    assignedUserCount: assignedCount,
    assignedUsersPreview: dto.assignedUsers || [],
    createdAt: dto.createdAt || new Date().toISOString(),
    updatedAt: dto.updatedAt || new Date().toISOString(),
    updatedBy: "Event Admin",
  };
}

export const usersApi = {
  // 1. Users
  getUsers: async (params?: UserListParams): Promise<UserListResponse> => {
    const queryParams: Record<string, unknown> = {
      page: params?.page || 1,
      pageSize: params?.pageSize || 20,
    };
    if (params?.search) queryParams.search = params.search;
    if (params?.roleId) queryParams.roleId = params.roleId;
    if (params?.status === "active") queryParams.isActive = true;
    if (params?.status === "inactive") queryParams.isActive = false;

    const [usersRes, summaryRes] = await Promise.all([
      axiosInstance.get<
        | BackendUserResponseDto[]
        | { data: BackendUserResponseDto[]; total?: number }
      >(ENDPOINTS.USERS.LIST, { params: queryParams }),
      axiosInstance.get<BackendUserSummaryDto>(ENDPOINTS.USERS.SUMMARY),
    ]);

    const rawList = Array.isArray(usersRes.data)
      ? usersRes.data
      : usersRes.data.data || [];

    const total = Array.isArray(usersRes.data)
      ? summaryRes.data.totalUsers
      : ((usersRes.data as { total?: number }).total ??
        summaryRes.data.totalUsers);

    const items = rawList.map(mapBackendUserToUser);

    const stats: UserListStats = {
      total: summaryRes.data.totalUsers,
      active: summaryRes.data.activeUsers,
      inactive: summaryRes.data.inactiveUsers,
      activeRoleCount: summaryRes.data.activePercentage,
    };

    return {
      items,
      total,
      stats,
    };
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await axiosInstance.get<BackendUserResponseDto[]>(
      ENDPOINTS.USERS.LIST,
    );
    const users = Array.isArray(response.data)
      ? response.data
      : (response.data as { data: BackendUserResponseDto[] }).data || [];

    const found = users.find((u) => u.id === id);
    if (!found) {
      throw new Error(`User with ID ${id} was not found.`);
    }
    return mapBackendUserToUser(found);
  },

  createUser: async (payload: CreateUserPayload): Promise<User> => {
    const response = await axiosInstance.post<BackendUserResponseDto>(
      ENDPOINTS.USERS.CREATE,
      {
        name: payload.name,
        email: payload.email,
        contactNumber: payload.contact,
        roleId: payload.roleId,
        sendEmail: true,
      },
    );
    return mapBackendUserToUser(response.data);
  },

  updateUser: async (id: string, payload: UpdateUserPayload): Promise<User> => {
    const response = await axiosInstance.patch<BackendUserResponseDto>(
      ENDPOINTS.USERS.UPDATE(id),
      {
        name: payload.name,
        contactNumber: payload.contact,
        roleId: payload.roleId,
        isActive: payload.status ? payload.status === "active" : undefined,
      },
    );
    return mapBackendUserToUser(response.data);
  },

  setUserStatus: async (
    id: string,
    status: UserStatus,
    _notes?: string,
  ): Promise<User> => {
    const response = await axiosInstance.patch<BackendUserResponseDto>(
      ENDPOINTS.USERS.UPDATE(id),
      {
        isActive: status === "active",
      },
    );
    return mapBackendUserToUser(response.data);
  },

  sendPasswordReset: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.post<{
      emailed: boolean;
      temporaryPassword?: string;
    }>(ENDPOINTS.USERS.RESET_PASSWORD(id));

    return {
      success: response.data.emailed,
      message: response.data.emailed
        ? "Password reset email dispatched successfully."
        : "Failed to send reset email.",
    };
  },

  resendCredentials: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    return usersApi.sendPasswordReset(id);
  },

  // 2. Roles
  getRoles: async (params?: RoleListParams): Promise<RoleListResponse> => {
    let rawList: BackendRoleResponseDto[] = [];
    let summary: BackendRoleSummaryDto = {
      totalDefinedRoles: 0,
      superAdminTier: 0,
      delegatedStaffRoles: 0,
      activeOperatorsCount: 0,
    };

    try {
      const rolesRes = await axiosInstance.get<
        BackendRoleResponseDto[] | { data: BackendRoleResponseDto[] }
      >(ENDPOINTS.USERS.ROLES_LIST, {
        params: { search: params?.search },
      });
      rawList = Array.isArray(rolesRes.data)
        ? rolesRes.data
        : (rolesRes.data as { data: BackendRoleResponseDto[] })?.data || [];
    } catch (err) {
      console.error("Failed to load roles list:", err);
    }

    try {
      const summaryRes = await axiosInstance.get<BackendRoleSummaryDto>(
        ENDPOINTS.USERS.ROLES_SUMMARY,
      );
      summary = summaryRes.data;
    } catch {
      summary = {
        totalDefinedRoles: rawList.length,
        activeOperatorsCount: rawList.reduce(
          (sum, r) =>
            sum +
            (r.assignedUserCount ??
              r.assignedUsersCount ??
              r.assignedUsers?.length ??
              0),
          0,
        ),
        superAdminTier: rawList.filter(
          (r) => r.isSystem || r.name.toLowerCase().includes("admin"),
        ).length,
        delegatedStaffRoles: rawList.filter((r) => !r.isSystem).length,
      };
    }

    const items = rawList.map(mapBackendRoleToRole);

    const stats: RoleListStats = {
      total: summary.totalDefinedRoles || items.length,
      system: items.filter((r) => r.isSystem).length,
      custom: items.filter((r) => !r.isSystem).length,
      superadminTier: summary.superAdminTier,
      delegated:
        summary.delegatedStaffRoles || items.filter((r) => !r.isSystem).length,
      delegatedActiveOperators: summary.activeOperatorsCount,
      moduleCount: 5,
    };

    return {
      items,
      total: items.length,
      stats,
    };
  },

  getRoleById: async (id: string): Promise<Role> => {
    const response = await axiosInstance.get<BackendRoleResponseDto[]>(
      ENDPOINTS.USERS.ROLES_LIST,
    );
    const found = (response.data || []).find((r) => r.id === id);
    if (!found) {
      throw new Error(`Role with ID ${id} was not found.`);
    }
    return mapBackendRoleToRole(found);
  },

  createRole: async (payload: CreateRolePayload): Promise<Role> => {
    const flatPermissions = permissionsToFlatList(payload.permissions);
    const response = await axiosInstance.post<BackendRoleResponseDto>(
      ENDPOINTS.USERS.ROLES_CREATE,
      {
        name: payload.name,
        description: payload.description,
        permissions: flatPermissions,
      },
    );
    return mapBackendRoleToRole(response.data);
  },

  updateRole: async (id: string, payload: UpdateRolePayload): Promise<Role> => {
    const flatPermissions = permissionsToFlatList(payload.permissions);
    const response = await axiosInstance.patch<BackendRoleResponseDto>(
      ENDPOINTS.USERS.ROLES_UPDATE(id),
      {
        name: payload.name,
        description: payload.description,
        permissions: flatPermissions,
        isActive: payload.status ? payload.status === "active" : undefined,
      },
    );
    return mapBackendRoleToRole(response.data);
  },

  duplicateRole: async (id: string): Promise<Role> => {
    const original = await usersApi.getRoleById(id);
    return usersApi.createRole({
      name: `${original.name} (Copy)`,
      description: original.description,
      permissions: original.permissions,
    });
  },

  setRoleStatus: async (id: string, status: RoleStatus): Promise<Role> => {
    const response = await axiosInstance.patch<BackendRoleResponseDto>(
      ENDPOINTS.USERS.ROLES_UPDATE(id),
      {
        isActive: status === "active",
      },
    );
    return mapBackendRoleToRole(response.data);
  },

  deleteRole: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    await axiosInstance.delete(ENDPOINTS.USERS.ROLES_DELETE(id));
    return {
      success: true,
      message: "Role deleted successfully.",
    };
  },

  // 3. Current User Permissions
  getCurrentUserPermissions: async (): Promise<{
    user: User;
    role: Role;
    permissions: Record<ModuleKey, PermissionAction[]>;
  }> => {
    const response = await axiosInstance.get<{
      id: string;
      name: string;
      email: string;
      portal: string;
      role: string;
      permissions: string[];
    }>(ENDPOINTS.AUTH.ME);

    const me = response.data;
    const permissions = flatListToPermissions(me.permissions);

    const user: User = {
      id: me.id,
      name: me.name,
      email: me.email,
      contact: "—",
      roleId: "current-role",
      roleName: me.role || "Organization Administrator",
      status: "active",
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCurrentUser: true,
    };

    const role: Role = {
      id: "current-role",
      code: "ROLE-ADMIN",
      name: me.role || "Organization Administrator",
      description: "Full system administrative access",
      tier: "superadmin",
      isSystem: true,
      status: "active",
      permissions,
      assignedUserCount: 1,
      assignedUsersPreview: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: "System",
    };

    return {
      user,
      role,
      permissions,
    };
  },

  setActingUser: async (userId: string): Promise<User> => {
    return usersApi.getUserById(userId);
  },
};

export default usersApi;
