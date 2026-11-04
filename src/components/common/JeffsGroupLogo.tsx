import React from "react";
import { cn } from "@/utils/cn";

export interface JeffsGroupLogoProps {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
  theme?: "light" | "dark";
}

/**
 * Official Jeffs Group of Companies brand emblem and typography.
 */
export const JeffsGroupLogo: React.FC<JeffsGroupLogoProps> = ({
  className,
  iconClassName = "h-8 w-8",
  showText = true,
  theme = "light",
}) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Official Golden Crest Emblem */}
      <img
        src="/jeffs-group-emblem.png"
        alt="Jeffs Group of Companies"
        className={cn("object-contain shrink-0", iconClassName)}
      />

      {showText && (
        <div className="flex flex-col text-left select-none">
          <span
            className={cn(
              "font-extrabold text-[15px] tracking-[0.06em] leading-tight font-sans",
              theme === "dark" ? "text-white" : "text-[#0B1220]",
            )}
          >
            JEFFS GROUP
          </span>
          <span
            className={cn(
              "text-[9px] font-bold tracking-[0.24em] uppercase leading-none mt-1",
              theme === "dark" ? "text-[#DEC067]" : "text-slate-500",
            )}
          >
            OF COMPANIES
          </span>
        </div>
      )}
    </div>
  );
};

export default JeffsGroupLogo;
