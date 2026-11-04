import React from "react";
import { Link } from "react-router-dom";
import type { RoleUserPreview } from "@/types/users.types";

export interface AvatarStackProps {
  roleId: string;
  roleName: string;
  totalCount: number;
  usersPreview: RoleUserPreview[];
}

export const AvatarStack: React.FC<AvatarStackProps> = ({
  roleId,
  roleName,
  totalCount,
  usersPreview,
}) => {
  const visible = usersPreview.slice(0, 3);
  const overflow = totalCount - visible.length;

  return (
    <Link
      to={`/user-management?tab=users&roleId=${roleId}`}
      className="group inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity"
      title={`Filter users by ${roleName} (${totalCount} users)`}
    >
      <div className="flex -space-x-2 overflow-hidden py-0.5">
        {visible.map((u, i) => (
          <div
            key={u.id || i}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 font-mono text-[10px] font-bold text-slate-700 ring-2 ring-white border border-slate-200 shrink-0"
            title={u.name}
          >
            {u.initials}
          </div>
        ))}
        {overflow > 0 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 font-mono text-[10px] font-bold text-slate-600 ring-2 ring-white border border-slate-300 shrink-0">
            +{overflow}
          </div>
        )}
      </div>

      <span className="text-xs font-semibold text-slate-800 group-hover:text-[#9B7415] group-hover:underline">
        {totalCount} {totalCount === 1 ? "user" : "users"}
      </span>

      {/* Visually hidden screen reader list */}
      <span className="sr-only">
        Assigned to: {usersPreview.map((u) => u.name).join(", ")}
      </span>
    </Link>
  );
};

export default AvatarStack;
