import React from "react";
import { StatusPill } from "@/components/ui/StatusPill";
import { AvatarStack } from "./AvatarStack";
import { RoleScopeSummary } from "./RoleScopeSummary";
import { RoleRowMenu } from "./RoleRowMenu";
import type { Role } from "@/types/users.types";
import { Lock, Shield } from "lucide-react";

export interface RoleCardListProps {
  roles: Role[];
  onEdit: (role: Role) => void;
  onDuplicate: (role: Role) => void;
  onToggleStatus: (role: Role) => void;
  onDelete: (role: Role) => void;
}

export const RoleCardList: React.FC<RoleCardListProps> = ({
  roles,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
}) => {
  return (
    <div className="space-y-3 md:hidden">
      {roles.map((role) => {
        return (
          <div
            key={role.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
          >
            {/* Header: Name, Code, Status, Menu */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FAF4E6] text-[#9B7415] border border-[#ECD59A]">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {role.name}
                    </span>
                    {role.isSystem && (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                        <Lock className="h-2.5 w-2.5" />
                        System
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-slate-400">
                    {role.code}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <StatusPill
                  status={role.status.toUpperCase() as "ACTIVE" | "INACTIVE"}
                  size="sm"
                />
                <RoleRowMenu
                  role={role}
                  onEdit={onEdit}
                  onDuplicate={onDuplicate}
                  onToggleStatus={onToggleStatus}
                  onDelete={onDelete}
                />
              </div>
            </div>

            {/* Description */}
            {role.description && (
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {role.description}
              </p>
            )}

            {/* Scope & Users */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Scope
                </span>
                <RoleScopeSummary
                  permissions={role.permissions}
                  isSuperadmin={role.tier === "superadmin"}
                />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Assigned Users
                </span>
                <AvatarStack
                  roleId={role.id}
                  roleName={role.name}
                  totalCount={role.assignedUserCount}
                  usersPreview={role.assignedUsersPreview}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RoleCardList;
