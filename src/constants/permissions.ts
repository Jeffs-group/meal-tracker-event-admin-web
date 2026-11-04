import React from "react";
import {
  LayoutDashboard,
  Users,
  Shield,
  UserCheck,
  BarChart3,
} from "lucide-react";
import type {
  ModuleKey,
  PermissionAction,
  Role,
  RoleScopeInfo,
} from "@/types/users.types";

export interface ModuleConfigItem {
  key: ModuleKey;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
}

export const MODULES: ModuleConfigItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    description:
      "Operational telemetry, registration graphs, and activity overview",
    icon: LayoutDashboard,
    route: "/dashboard",
  },
  {
    key: "registrations",
    label: "Registrations",
    description:
      "Team rosters, staff accreditations, and attendee review queues",
    icon: Users,
    route: "/registrations",
  },
  {
    key: "teams",
    label: "Manage Teams",
    description:
      "Franchise directories, league assignments, and franchise status",
    icon: Shield,
    route: "/manage-teams",
  },
  {
    key: "reports",
    label: "Reports",
    description:
      "Aggregated exports, compliance auditing, and dining manifests",
    icon: BarChart3,
    route: "/reports",
  },
  {
    key: "users",
    label: "User Management",
    description:
      "Portal operator accounts, custom roles, and security policies",
    icon: UserCheck,
    route: "/user-management",
  },
];

export const PERMISSION_ACTIONS: {
  action: PermissionAction;
  label: string;
  description: string;
  tooltip: string;
}[] = [
  {
    action: "view",
    label: "View",
    description:
      "Access and inspect module pages, view records, and export lists",
    tooltip:
      "Permits reading records, browsing listings, and generating CSV/Excel exports.",
  },
  {
    action: "create",
    label: "Create",
    description: "Submit applications, add records, and register new entities",
    tooltip:
      "Permits creating new teams, adding manual registrations, and provisioning records.",
  },
  {
    action: "edit",
    label: "Edit",
    description:
      "Modify existing records, execute verification, approve or reject",
    tooltip:
      "Permits updating profiles, approving or rejecting applications, and saving modifications.",
  },
  {
    action: "manage",
    label: "Manage",
    description:
      "Destructive and administrative actions (revoke pass, deactivate, reset passwords)",
    tooltip:
      "Permits administrative privileges, deactivating accounts or teams, revoking meal credentials, and resetting security credentials.",
  },
];

export const TOTAL_MODULES_COUNT = MODULES.length; // 5

/**
 * Computes the human-readable scope pill and muted summary line for a role
 */
export function getRoleScopeInfo(
  permissions: Role["permissions"] | Record<ModuleKey, PermissionAction[]>,
): RoleScopeInfo {
  const coveredModules: ModuleConfigItem[] = [];
  const actionCounts: Record<PermissionAction, number> = {
    view: 0,
    create: 0,
    edit: 0,
    manage: 0,
  };

  MODULES.forEach((mod) => {
    const actions = permissions[mod.key] || [];
    if (actions.length > 0) {
      coveredModules.push(mod);
      actions.forEach((act) => {
        actionCounts[act]++;
      });
    }
  });

  const coveredCount = coveredModules.length;

  let scopeLabel = `${coveredCount} ${coveredCount === 1 ? "Module" : "Modules"}`;
  if (coveredCount === TOTAL_MODULES_COUNT) {
    scopeLabel = `All Modules (${TOTAL_MODULES_COUNT}/${TOTAL_MODULES_COUNT})`;
  } else if (coveredCount === 0) {
    scopeLabel = "No Modules Assigned";
  }

  // Module names text
  let moduleListText = "No modules accessible";
  if (coveredCount > 0) {
    if (coveredCount <= 3) {
      moduleListText = coveredModules.map((m) => m.label).join(", ");
    } else {
      const top3 = coveredModules
        .slice(0, 3)
        .map((m) => m.label)
        .join(", ");
      moduleListText = `${top3} +${coveredCount - 3} more`;
    }
  }

  // Summary vocabulary: view / create / edit / manage / full authority
  let permissionSummaryText = "Custom Permissions";
  if (
    coveredCount === TOTAL_MODULES_COUNT &&
    actionCounts.manage === TOTAL_MODULES_COUNT
  ) {
    permissionSummaryText = "Full Authority";
  } else if (actionCounts.manage > 0) {
    permissionSummaryText = "View, Edit & Administrative Manage";
  } else if (actionCounts.create > 0 && actionCounts.edit > 0) {
    permissionSummaryText = "View, Create & Edit";
  } else if (actionCounts.edit > 0) {
    permissionSummaryText = "View & Edit";
  } else if (actionCounts.create > 0) {
    permissionSummaryText = "View & Create";
  } else if (actionCounts.view > 0) {
    permissionSummaryText = "Read-only access";
  }

  return {
    totalModules: TOTAL_MODULES_COUNT,
    coveredModulesCount: coveredCount,
    scopeLabel,
    moduleListText,
    permissionSummaryText,
  };
}
