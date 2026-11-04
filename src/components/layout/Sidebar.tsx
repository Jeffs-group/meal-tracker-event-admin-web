import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Shield,
  UtensilsCrossed,
  X,
  LogOut,
  UserCheck,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";
import { usePermissions } from "@/hooks/usePermissions";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { authApi } from "@/api/auth.api";
import type { ModuleKey } from "@/types/users.types";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user: authUser } = useAuthStore();
  const { can, user: currentOperator } = usePermissions();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName =
    currentOperator?.name ||
    (authUser ? `${authUser.firstName} ${authUser.lastName}`.trim() : "") ||
    "Event Admin";

  const displayEmail =
    currentOperator?.email || authUser?.email || "admin@jeffsgroup.org";

  const userInitials =
    displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "EA";

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authApi.logout();
    } catch {
      // Fallback
    } finally {
      logout();
      setIsLoggingOut(false);
      setIsLogoutConfirmOpen(false);
      navigate(ROUTES.LOGIN);
    }
  };

  interface NavItem {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    to: string;
    module: ModuleKey;
  }

  const allNavItems: NavItem[] = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      to: ROUTES.DASHBOARD,
      module: "dashboard",
    },
    {
      label: "Registrations",
      icon: Users,
      to: ROUTES.REGISTRATIONS,
      module: "registrations",
    },
    {
      label: "Manage Teams",
      icon: Shield,
      to: ROUTES.MANAGE_TEAMS,
      module: "teams",
    },
    // Reports temporarily hidden from sidebar as requested
    {
      label: "User & Role Management",
      icon: UserCheck,
      to: ROUTES.USER_MANAGEMENT,
      module: "users",
    },
  ];

  // Gate navigation items according to current permissions
  const navItems = allNavItems.filter((item) => can(item.module, "view"));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#111111] text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#222222] px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#DEC067] to-[#C9A227] text-black shadow-xs font-bold">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white leading-tight">
                Jeffs Group
              </h2>
              <p className="text-[10px] uppercase tracking-wider text-[#DEC067] font-semibold">
                Meal Tracker
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white lg:hidden cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5 px-3 py-5 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Registrations Module
          </p>
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.to === ROUTES.MANAGE_TEAMS &&
                location.pathname.startsWith("/manage-teams")) ||
              (item.to === ROUTES.REGISTRATIONS &&
                location.pathname.startsWith("/registrations")) ||
              (item.to === ROUTES.REPORTS &&
                location.pathname.startsWith("/reports")) ||
              (item.to === ROUTES.USER_MANAGEMENT &&
                location.pathname.startsWith("/user-management"));

            return (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={onClose}
                className={cn(
                  "group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all",
                  isActive
                    ? "bg-[#C9A227] text-white font-semibold shadow-xs"
                    : "text-slate-400 hover:bg-[#1C1C1C] hover:text-slate-200",
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-200",
                    )}
                  />
                  <span>{item.label}</span>
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom User Info & Logout */}
        <div className="border-t border-[#222222] p-4 bg-[#0D0D0D]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#222222] text-[#DEC067] font-bold text-xs shrink-0">
                {userInitials}
              </div>
              <div className="overflow-hidden text-left">
                <p className="truncate text-xs font-semibold text-slate-200">
                  {displayName}
                </p>
                <p className="truncate text-[10px] font-mono text-slate-500">
                  {displayEmail}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsLogoutConfirmOpen(true)}
              title="Sign Out"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-[#222222] hover:text-rose-400 transition-colors cursor-pointer"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <ConfirmActionDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Sign Out of Event Admin"
        subtitle="Are you sure you want to end your current session? You will need to log in again to access the portal."
        confirmLabel={isLoggingOut ? "Signing out..." : "Sign Out"}
        cancelLabel="Stay Logged In"
        tone="danger"
        isSubmitting={isLoggingOut}
        icon={<LogOut className="h-5 w-5 text-rose-600" />}
      />
    </>
  );
};

export default Sidebar;
