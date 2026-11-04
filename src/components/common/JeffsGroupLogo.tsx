import React from "react";
import { cn } from "@/utils/cn";

export interface JeffsGroupLogoProps {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
}

/**
 * Official Jeffs Group of Companies brand emblem and typography.
 * Matches Figma node 66-479 specifications.
 */
export const JeffsGroupLogo: React.FC<JeffsGroupLogoProps> = ({
  className,
  iconClassName = "h-8 w-8",
  showText = true,
}) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Interlocking Monogram Emblem */}
      <svg
        className={cn("text-[#C9A227] shrink-0", iconClassName)}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Left J stem & bottom loop */}
        <path
          d="M15 10V27C15 31.418 11.418 35 7 35C4.5 35 2.5 33.2 2 31"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Right J stem & bottom loop */}
        <path
          d="M29 10V27C29 31.418 32.582 35 37 35C39.5 35 41.5 33.2 42 31"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Central connecting cross-bridge */}
        <path
          d="M15 22H29"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Top serif anchors */}
        <path
          d="M11 10H19"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M25 10H33"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>

      {showText && (
        <div className="flex flex-col text-left select-none">
          <span className="font-extrabold text-[15px] tracking-[0.06em] text-[#0B1220] leading-tight font-sans">
            JEFFS GROUP
          </span>
          <span className="text-[9px] font-bold tracking-[0.24em] text-slate-500 uppercase leading-none mt-1">
            OF COMPANIES
          </span>
        </div>
      )}
    </div>
  );
};

export default JeffsGroupLogo;
