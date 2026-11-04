import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/users.api";
import { MODULES, PERMISSION_ACTIONS } from "@/constants/permissions";
import type {
  ModuleKey,
  PermissionAction,
  Role,
  User,
} from "@/types/users.types";

export const PERMISSION_QUERY_KEY = ["currentUserPermissions"] as const;

export function usePermissions() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: PERMISSION_QUERY_KEY,
    queryFn: () => usersApi.getCurrentUserPermissions(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const user: User | null = data?.user ?? null;
  const role: Role | null = data?.role ?? null;
  const permissions = data?.permissions ?? null;

  const isSuperadmin = role?.tier === "superadmin";

  const can = (
    module: ModuleKey | string,
    action: PermissionAction | string,
  ): boolean => {
    // While loading or before first fetch, default to permissive for admin
    if (!role || !permissions) {
      return true;
    }

    if (isSuperadmin) {
      return true;
    }

    const modKey = module as ModuleKey;
    const actKey = action as PermissionAction;

    return permissions[modKey]?.includes(actKey) ?? false;
  };

  const getMissingPermissionTooltip = (
    module: ModuleKey | string,
    action: PermissionAction | string,
  ): string => {
    const modConfig = MODULES.find((m) => m.key === module);
    const actConfig = PERMISSION_ACTIONS.find((a) => a.action === action);
    const modLabel = modConfig ? modConfig.label : module;
    const actLabel = actConfig ? actConfig.label : action;
    return `Requires ${actLabel} access on ${modLabel}`;
  };

  return {
    can,
    user,
    role,
    isSuperadmin,
    tier: role?.tier ?? "superadmin",
    tierLabel:
      role?.tier === "superadmin"
        ? "Organization Admin"
        : (role?.name ?? "Organization Operator"),
    isLoading,
    refetchPermissions: refetch,
    getMissingPermissionTooltip,
  };
}

export default usePermissions;
