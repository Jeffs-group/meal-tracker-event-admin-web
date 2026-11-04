import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  MoreVertical,
  Pencil,
  Key,
  Mail,
  UserX,
  UserCheck,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import type { User } from "@/types/users.types";
import { cn } from "@/utils/cn";

export interface UserRowMenuProps {
  user: User;
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
  onResendCredentials: (user: User) => void;
  onToggleStatus: (user: User) => void;
}

export const UserRowMenu: React.FC<UserRowMenuProps> = ({
  user,
  onEdit,
  onResetPassword,
  onResendCredentials,
  onToggleStatus,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    openUpwards: boolean;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { can } = usePermissions();

  const canEdit = can("users", "edit");
  const canManage = can("users", "manage");

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeight = 160;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < menuHeight + 10 && rect.top > menuHeight;
    const menuWidth = 192; // w-48 = 192px

    setCoords({
      top: openUpwards ? Math.max(8, rect.top - menuHeight) : rect.bottom + 4,
      left: Math.max(8, rect.right - menuWidth),
      openUpwards,
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    const handleScrollOrResize = () => setIsOpen(false);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const isDeactivatingSelf = user.isCurrentUser && user.status === "active";

  return (
    <div className="flex items-center justify-end gap-1" ref={menuRef}>
      {/* Quick Edit Pencil */}
      <button
        type="button"
        onClick={() => onEdit(user)}
        disabled={!canEdit}
        title={
          !canEdit ? "Requires Edit access on User Management" : "Edit User"
        }
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label={`Edit ${user.name}`}
      >
        <Pencil className="h-4 w-4" />
      </button>

      {/* Quick Password Reset */}
      <button
        type="button"
        onClick={() => onResetPassword(user)}
        disabled={!canManage}
        title={
          !canManage
            ? "Requires Manage access on User Management"
            : "Send Password Reset Link"
        }
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#9B7415] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label={`Send password reset link to ${user.name}`}
      >
        <Key className="h-4 w-4" />
      </button>

      {/* Kebab Dropdown */}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-label={`User actions for ${user.name}`}
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {isOpen &&
          coords &&
          createPortal(
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                zIndex: 9999,
              }}
              className={cn(
                "w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-2xl shadow-black/10 text-xs animate-in fade-in-50 zoom-in-95",
                coords.openUpwards ? "origin-bottom-right" : "origin-top-right",
              )}
            >
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => {
                  setIsOpen(false);
                  onEdit(user);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5 text-slate-400" />
                <span>Edit User</span>
              </button>

              <button
                type="button"
                disabled={!canManage}
                onClick={() => {
                  setIsOpen(false);
                  onResetPassword(user);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Key className="h-3.5 w-3.5 text-slate-400" />
                <span>Reset Password</span>
              </button>

              {user.mustChangePassword && (
                <button
                  type="button"
                  disabled={!canManage}
                  onClick={() => {
                    setIsOpen(false);
                    onResendCredentials(user);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>Resend Credentials</span>
                </button>
              )}

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                disabled={!canManage || isDeactivatingSelf}
                title={
                  isDeactivatingSelf
                    ? "You cannot deactivate your own account"
                    : undefined
                }
                onClick={() => {
                  setIsOpen(false);
                  onToggleStatus(user);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 transition-colors cursor-pointer",
                  user.status === "active"
                    ? "text-rose-600 hover:bg-rose-50"
                    : "text-emerald-700 hover:bg-emerald-50",
                  (!canManage || isDeactivatingSelf) &&
                    "opacity-40 cursor-not-allowed hover:bg-transparent",
                )}
              >
                {user.status === "active" ? (
                  <>
                    <UserX className="h-3.5 w-3.5 text-rose-500" />
                    <span>Deactivate User</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Activate User</span>
                  </>
                )}
              </button>
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
};

export default UserRowMenu;
