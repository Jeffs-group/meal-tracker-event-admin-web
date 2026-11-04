import type { ModuleKey, PermissionAction } from "@/types/users.types";

/**
 * Pure reducer for Module Permissions Matrix checkbox toggles.
 * Rules:
 * 1. Create, Edit, and Manage require View. Checking any of them automatically checks View.
 * 2. Unchecking View clears Create, Edit, and Manage for that module.
 * 3. Checking Manage automatically checks Create and Edit (and View).
 * 4. Unchecking Create or Edit automatically clears Manage.
 */
export function togglePermissionAction(
  current: Record<ModuleKey, PermissionAction[]>,
  module: ModuleKey,
  action: PermissionAction,
  checked: boolean,
): Record<ModuleKey, PermissionAction[]> {
  const existingActions = new Set<PermissionAction>(current[module] || []);

  if (checked) {
    if (action === "view") {
      existingActions.add("view");
    } else if (action === "create" || action === "edit") {
      existingActions.add("view");
      existingActions.add(action);
    } else if (action === "manage") {
      existingActions.add("view");
      existingActions.add("create");
      existingActions.add("edit");
      existingActions.add("manage");
    }
  } else {
    if (action === "view") {
      // Unchecking View clears all permissions for this module
      existingActions.clear();
    } else if (action === "create" || action === "edit") {
      existingActions.delete(action);
      // Unchecking Create or Edit clears Manage
      existingActions.delete("manage");
    } else if (action === "manage") {
      existingActions.delete("manage");
    }
  }

  return {
    ...current,
    [module]: Array.from(existingActions),
  };
}

export function isPermissionChecked(
  permissions: Record<ModuleKey, PermissionAction[]>,
  module: ModuleKey,
  action: PermissionAction,
): boolean {
  return permissions[module]?.includes(action) ?? false;
}

export function hasAtLeastOnePermission(
  permissions: Record<ModuleKey, PermissionAction[]>,
): boolean {
  return Object.values(permissions).some((actions) => actions.length > 0);
}
