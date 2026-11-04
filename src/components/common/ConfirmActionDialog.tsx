import React, { useRef } from "react";
import { DialogShell } from "./DialogShell";
import { Button } from "@/components/ui/Button";
import { Check, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";

export type ConfirmTone = "danger" | "neutral" | "success";

export interface ConfirmActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: ConfirmTone;
  confirmLabel?: string;
  confirmIcon?: React.ReactNode;
  cancelLabel?: string;
  isSubmitting?: boolean;
  confirmDisabled?: boolean;
  children?: React.ReactNode;
}

export const ConfirmActionDialog: React.FC<ConfirmActionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  icon,
  tone = "neutral",
  confirmLabel = "Confirm",
  confirmIcon,
  cancelLabel = "Cancel",
  isSubmitting = false,
  confirmDisabled = false,
  children,
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  const defaultIcon =
    icon ||
    (tone === "danger" ? (
      <AlertCircle className="h-5 w-5 text-rose-600" />
    ) : tone === "success" ? (
      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
    ) : (
      <AlertTriangle className="h-5 w-5 text-amber-600" />
    ));

  const confirmBtnClasses = cn(
    "h-9 px-4 text-xs font-semibold rounded-xl text-white shadow-xs transition-colors",
    tone === "danger" && "bg-rose-600 hover:bg-rose-700",
    tone === "success" && "bg-emerald-600 hover:bg-emerald-700",
    tone === "neutral" && "bg-[#C9A227] hover:bg-[#B8901E]",
  );

  return (
    <DialogShell
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={defaultIcon}
      size="sm"
      role="alertdialog"
      isSubmitting={isSubmitting}
      initialFocusRef={cancelButtonRef}
      footer={
        <div className="flex w-full items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            ref={cancelButtonRef}
            onClick={onClose}
            disabled={isSubmitting}
            className="h-9 px-4 text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 rounded-xl"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onConfirm}
            isLoading={isSubmitting}
            disabled={confirmDisabled || isSubmitting}
            className={confirmBtnClasses}
            leftIcon={confirmIcon || <Check className="h-4 w-4" />}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {children}
    </DialogShell>
  );
};

export default ConfirmActionDialog;
