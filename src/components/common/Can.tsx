import React from "react";
import { usePermissions } from "@/hooks/usePermissions";
import type { ModuleKey, PermissionAction } from "@/types/users.types";

export interface CanProps {
  module: ModuleKey | string;
  action: PermissionAction | string;
  children: React.ReactNode;
  fallback?: "hide" | "disable";
  tooltip?: string;
}

export const Can: React.FC<CanProps> = ({
  module,
  action,
  children,
  fallback = "hide",
  tooltip,
}) => {
  const { can, getMissingPermissionTooltip } = usePermissions();

  const isAllowed = can(module, action);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback === "hide") {
    return null;
  }

  const tooltipMsg = tooltip || getMissingPermissionTooltip(module, action);

  // Fallback: disable
  if (React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<{
        disabled?: boolean;
        title?: string;
        className?: string;
        "aria-disabled"?: boolean;
      }>,
      {
        disabled: true,
        "aria-disabled": true,
        title: tooltipMsg,
      },
    );
  }

  return (
    <span
      className="inline-block cursor-not-allowed opacity-50"
      title={tooltipMsg}
      aria-disabled="true"
    >
      {children}
    </span>
  );
};

export default Can;
