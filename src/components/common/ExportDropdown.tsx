import React, { useState, useRef, useEffect } from "react";
import {
  Download,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  File,
  Loader2,
} from "lucide-react";
import { cn } from "@/utils/cn";

export type ExportFileFormat = "csv" | "pdf" | "xlsx";

export interface ExportDropdownProps {
  onExport: (format: ExportFileFormat) => Promise<void> | void;
  isExporting?: boolean;
  disabled?: boolean;
  label?: string;
  size?: "xs" | "sm" | "md";
  variant?: "outline" | "primary" | "dark" | "ghost";
  className?: string;
  align?: "left" | "right";
  direction?: "up" | "down";
  totalRecords?: number;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  onExport,
  isExporting = false,
  disabled = false,
  label = "Export",
  size = "sm",
  variant = "outline",
  className,
  align = "right",
  direction = "down",
  totalRecords,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDisabled = disabled || isExporting || totalRecords === 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelect = (format: ExportFileFormat) => {
    setIsOpen(false);
    onExport(format);
  };

  const sizeClasses = {
    xs: "h-[28px] px-2.5 text-[11px] gap-1 rounded-md",
    sm: "h-[32px] px-3 text-xs gap-1.5 rounded-lg",
    md: "h-[38px] px-4 text-xs gap-2 rounded-lg",
  };

  const variantClasses = {
    outline:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 shadow-2xs",
    primary:
      "bg-[#C9A227] text-white hover:bg-[#B8901E] active:bg-[#9B7415] border border-transparent shadow-xs",
    dark: "bg-[#111111] text-white hover:bg-[#222222] border border-[#282828] active:scale-[0.98] shadow-xs",
    ghost:
      "text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 border border-transparent",
  };

  return (
    <div className={cn("relative inline-block text-left", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none",
          sizeClasses[size],
          variantClasses[variant],
        )}
        title={totalRecords === 0 ? "No records to export" : `Export ${label}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {isExporting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        <span>{isExporting ? "Exporting..." : label}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 opacity-60 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && !isDisabled && (
        <div
          className={cn(
            "absolute z-50 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95",
            direction === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {/* Option 1: CSV */}
          <button
            type="button"
            onClick={() => handleSelect("csv")}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer text-left"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 leading-tight">
                Export CSV (.csv)
              </p>
              <p className="text-[10px] text-slate-400">
                UTF-8 Universal Format
              </p>
            </div>
          </button>

          {/* Option 2: PDF */}
          <button
            type="button"
            onClick={() => handleSelect("pdf")}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer text-left mt-0.5"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-50 text-rose-600 border border-rose-100">
              <File className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 leading-tight">
                Export PDF (.pdf)
              </p>
              <p className="text-[10px] text-slate-400">
                Printable Formatted Document
              </p>
            </div>
          </button>

          {/* Option 3: Excel */}
          <button
            type="button"
            onClick={() => handleSelect("xlsx")}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer text-left mt-0.5"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 leading-tight">
                Export Excel (.xlsx)
              </p>
              <p className="text-[10px] text-slate-400">
                Styled Spreadsheet Workbook
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;
