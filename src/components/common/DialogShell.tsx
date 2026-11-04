import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

export type DialogSize = "sm" | "md" | "lg";

export interface DialogShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: DialogSize;
  isSubmitting?: boolean;
  role?: "dialog" | "alertdialog";
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

const sizeClasses: Record<DialogSize, string> = {
  sm: "sm:max-w-[480px]",
  md: "sm:max-w-[560px]",
  lg: "sm:max-w-[720px]",
};

export const DialogShell: React.FC<DialogShellProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = "md",
  isSubmitting = false,
  role = "dialog",
  ariaLabelledBy = "dialog-title",
  ariaDescribedBy = "dialog-subtitle",
  initialFocusRef,
  className,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Store trigger element & lock scroll
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current =
        document.activeElement as HTMLElement | null;
      document.body.style.overflow = "hidden";

      // Initial focus
      const timer = setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else if (dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
          if (focusable.length > 0) {
            focusable[0]?.focus();
          }
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "unset";
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, initialFocusRef]);

  // Handle ESC and Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;

        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      aria-modal="true"
      role={role}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={subtitle ? ariaDescribedBy : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        aria-hidden="true"
      />

      {/* Dialog Surface: Full-width bottom sheet on mobile, rounded card on sm+ */}
      <div
        ref={dialogRef}
        className={cn(
          "relative z-10 flex flex-col w-full bg-white shadow-2xl transition-all",
          "rounded-t-2xl sm:rounded-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden",
          sizeClasses[size],
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 sm:px-6 py-4 bg-white shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            {icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAF4E6] text-[#9B7415] border border-[#ECD59A] shadow-2xs">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h2
                id={ariaLabelledBy}
                className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-snug truncate"
              >
                {title}
              </h2>
              {subtitle && (
                <p
                  id={ariaDescribedBy}
                  className="mt-0.5 text-xs text-slate-500 font-medium leading-relaxed"
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs sm:text-sm text-slate-700">
          {children}
        </div>

        {/* Sticky Divider Footer on mobile, full width */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 px-5 sm:px-6 py-3.5 bg-slate-50/70 shrink-0 pb-safe sm:pb-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default DialogShell;
