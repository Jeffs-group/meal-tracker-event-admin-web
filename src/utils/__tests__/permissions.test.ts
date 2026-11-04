import {
  togglePermissionAction,
  isPermissionChecked,
  hasAtLeastOnePermission,
} from "@/utils/permissionReducer";
import { getRoleScopeInfo } from "@/constants/permissions";
import { INITIAL_ROLES } from "@/api/mock/mockData";
import {
  mockUpdateUser,
  mockSetUserStatus,
  mockUpdateRole,
  mockDeleteRole,
  mockSetRoleStatus,
} from "@/api/mock/mockHandlers";
import type { ModuleKey, PermissionAction } from "@/types/users.types";

export async function runPermissionsUnitTests(): Promise<{
  passed: number;
  failed: number;
  results: { name: string; success: boolean; error?: string }[];
}> {
  const results: { name: string; success: boolean; error?: string }[] = [];

  function assert(condition: boolean, message: string) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // Suite 1: Permission Matrix Reducer
  try {
    const emptyMatrix: Record<ModuleKey, PermissionAction[]> = {
      dashboard: [],
      registrations: [],
      teams: [],
      reports: [],
      users: [],
    };

    // 1. Checking 'create' auto-checks 'view'
    const afterCreate = togglePermissionAction(
      emptyMatrix,
      "teams",
      "create",
      true,
    );
    assert(
      isPermissionChecked(afterCreate, "teams", "view") &&
        isPermissionChecked(afterCreate, "teams", "create"),
      "Checking 'create' must auto-check 'view'",
    );

    // 2. Checking 'manage' auto-checks 'view', 'create', and 'edit'
    const afterManage = togglePermissionAction(
      emptyMatrix,
      "registrations",
      "manage",
      true,
    );
    assert(
      isPermissionChecked(afterManage, "registrations", "view") &&
        isPermissionChecked(afterManage, "registrations", "create") &&
        isPermissionChecked(afterManage, "registrations", "edit") &&
        isPermissionChecked(afterManage, "registrations", "manage"),
      "Checking 'manage' must auto-check 'view', 'create', 'edit', and 'manage'",
    );

    // 3. Unchecking 'edit' when 'manage' is checked must clear 'manage'
    const afterUncheckEdit = togglePermissionAction(
      afterManage,
      "registrations",
      "edit",
      false,
    );
    assert(
      !isPermissionChecked(afterUncheckEdit, "registrations", "edit") &&
        !isPermissionChecked(afterUncheckEdit, "registrations", "manage") &&
        isPermissionChecked(afterUncheckEdit, "registrations", "view"),
      "Unchecking 'edit' must clear 'manage' while preserving 'view'",
    );

    // 4. Unchecking 'view' must clear all actions for that module
    const afterUncheckView = togglePermissionAction(
      afterManage,
      "registrations",
      "view",
      false,
    );
    assert(
      afterUncheckView.registrations.length === 0,
      "Unchecking 'view' must clear all permissions for that module",
    );

    // 5. hasAtLeastOnePermission
    assert(
      hasAtLeastOnePermission(afterCreate),
      "hasAtLeastOnePermission should be true",
    );
    assert(
      !hasAtLeastOnePermission(emptyMatrix),
      "hasAtLeastOnePermission should be false on empty",
    );

    results.push({
      name: "Permission Matrix Reducer & Cascades",
      success: true,
    });
  } catch (err) {
    results.push({
      name: "Permission Matrix Reducer & Cascades",
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Suite 2: Role Scope Summary & Vocabulary Generator
  try {
    const adminRole = INITIAL_ROLES.find((r) => r.code === "ROLE-001")!;
    const adminScope = getRoleScopeInfo(adminRole.permissions);
    assert(
      adminScope.scopeLabel === "All Modules (5/5)",
      `Expected 'All Modules (5/5)', got '${adminScope.scopeLabel}'`,
    );
    assert(
      adminScope.permissionSummaryText === "Full Authority",
      `Expected 'Full Authority', got '${adminScope.permissionSummaryText}'`,
    );

    const reportViewerRole = INITIAL_ROLES.find((r) => r.code === "ROLE-004")!;
    const reportScope = getRoleScopeInfo(reportViewerRole.permissions);
    assert(
      reportScope.scopeLabel === "2 Modules",
      `Expected '2 Modules', got '${reportScope.scopeLabel}'`,
    );
    assert(
      reportScope.permissionSummaryText === "Read-only access",
      `Expected 'Read-only access', got '${reportScope.permissionSummaryText}'`,
    );

    results.push({
      name: "Role Scope Summary & Vocabulary Compliance",
      success: true,
    });
  } catch (err) {
    results.push({
      name: "Role Scope Summary & Vocabulary Compliance",
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Suite 3: Self-Deactivation & Own Role-Change Guards
  try {
    // Current user Alex Morgan is usr-001
    let selfDeactError = false;
    try {
      await mockSetUserStatus("usr-001", "inactive");
    } catch {
      selfDeactError = true;
    }
    assert(selfDeactError, "Self-deactivation of current user must be blocked");

    let ownRoleError = false;
    try {
      await mockUpdateUser("usr-001", {
        name: "Alex Morgan",
        contact: "+91 98450 12345",
        roleId: "role-reg-manager",
      });
    } catch {
      ownRoleError = true;
    }
    assert(ownRoleError, "Changing own role must be blocked");

    results.push({
      name: "Self-Deactivation & Own Role-Change Guards",
      success: true,
    });
  } catch (err) {
    results.push({
      name: "Self-Deactivation & Own Role-Change Guards",
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Suite 4: Last Superadmin Protection Guard
  try {
    // usr-002 Priya Sharma is the second superadmin. Deactivate her first:
    await mockSetUserStatus("usr-002", "inactive");

    // Now usr-001 is the ONLY active superadmin. Deactivating or reassigning role should fail:
    let lastAdminBlocked = false;
    try {
      await mockSetUserStatus("usr-001", "inactive");
    } catch {
      lastAdminBlocked = true;
    }
    assert(
      lastAdminBlocked,
      "Deactivating the last active superadmin must be blocked",
    );

    // Reactivate usr-002 to preserve test clean state
    await mockSetUserStatus("usr-002", "active");

    results.push({ name: "Last Superadmin Protection Guard", success: true });
  } catch (err) {
    results.push({
      name: "Last Superadmin Protection Guard",
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Suite 5: Locked System Roles & Role Delete Invariants
  try {
    // 1. System role cannot be edited
    let systemEditBlocked = false;
    try {
      await mockUpdateRole("role-admin", {
        name: "New Admin",
        permissions: INITIAL_ROLES[0]!.permissions,
      });
    } catch {
      systemEditBlocked = true;
    }
    assert(systemEditBlocked, "Editing locked system role must be blocked");

    // 2. System role cannot be deleted
    let systemDeleteBlocked = false;
    try {
      await mockDeleteRole("role-admin");
    } catch {
      systemDeleteBlocked = true;
    }
    assert(systemDeleteBlocked, "Deleting locked system role must be blocked");

    // 3. Custom role with assigned users cannot be deleted
    let assignedDeleteBlocked = false;
    try {
      await mockDeleteRole("role-reg-manager");
    } catch {
      assignedDeleteBlocked = true;
    }
    assert(
      assignedDeleteBlocked,
      "Deleting role with assigned users must be blocked",
    );

    // 4. Custom role with assigned users cannot be deactivated
    let assignedDeactBlocked = false;
    try {
      await mockSetRoleStatus("role-reg-manager", "inactive");
    } catch {
      assignedDeactBlocked = true;
    }
    assert(
      assignedDeactBlocked,
      "Deactivating role with assigned active users must be blocked",
    );

    results.push({
      name: "Locked System Roles & Assignment Integrity Guards",
      success: true,
    });
  } catch (err) {
    results.push({
      name: "Locked System Roles & Assignment Integrity Guards",
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return { passed, failed, results };
}
