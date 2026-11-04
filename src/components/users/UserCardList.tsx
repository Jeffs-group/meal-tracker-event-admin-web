import React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { StatusPill } from "@/components/ui/StatusPill";
import { UserRowMenu } from "./UserRowMenu";
import type { User } from "@/types/users.types";
import { Mail, Phone } from "lucide-react";

export interface UserCardListProps {
  users: User[];
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
  onResendCredentials: (user: User) => void;
  onToggleStatus: (user: User) => void;
}

export const UserCardList: React.FC<UserCardListProps> = ({
  users,
  onEdit,
  onResetPassword,
  onResendCredentials,
  onToggleStatus,
}) => {
  return (
    <div className="space-y-3 md:hidden">
      {users.map((user) => {
        const handle = `@${user.email.split("@")[0] || ""}`;

        return (
          <div
            key={user.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
          >
            {/* Header: Avatar, Name, Handle, Status & Menu */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={user.name} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {user.name}
                    </span>
                    {user.isCurrentUser && (
                      <span className="rounded-md bg-[#FAF4E6] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#644813] border border-[#ECD59A]">
                        You
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-slate-400 truncate">
                    {handle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <StatusPill
                  status={user.status.toUpperCase() as "ACTIVE" | "INACTIVE"}
                  size="sm"
                />
                <UserRowMenu
                  user={user}
                  onEdit={onEdit}
                  onResetPassword={onResetPassword}
                  onResendCredentials={onResendCredentials}
                  onToggleStatus={onToggleStatus}
                />
              </div>
            </div>

            {/* Details: Role, Email, Phone */}
            <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Assigned Role
                </span>
                <span className="font-semibold text-slate-800">
                  {user.roleName}{" "}
                  {user.roleCode && (
                    <span className="font-mono text-slate-400 font-normal">
                      ({user.roleCode})
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-600 truncate">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>

              <div className="flex items-center gap-2 font-mono text-slate-600">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{user.contact}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserCardList;
