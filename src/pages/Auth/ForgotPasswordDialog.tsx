import React, { useState } from "react";
import { DialogShell } from "@/components/common/DialogShell";
import { Mail, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/api/auth.api";

export interface ForgotPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({
  isOpen,
  onClose,
  defaultEmail = "",
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await authApi.forgotPassword({ email });
      setIsSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to request password reset.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setError(null);
    onClose();
  };

  return (
    <DialogShell
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      title="Reset Your Password"
      subtitle="Enter your registered email address to receive password recovery instructions."
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            className="text-slate-600 hover:text-slate-900"
          >
            {isSuccess ? "Close" : "Cancel"}
          </Button>

          {!isSuccess ? (
            <Button
              type="submit"
              form="forgot-password-form"
              variant="primary"
              isLoading={isSubmitting}
              className="bg-[#C9A227] hover:bg-[#B58E1E] text-white"
            >
              <span>Send Reset Instructions</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              onClick={handleClose}
              className="bg-[#C9A227] hover:bg-[#B58E1E] text-white"
            >
              Done
            </Button>
          )}
        </div>
      }
    >
      {isSuccess ? (
        <div className="py-4 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">
            Reset Instructions Sent
          </h4>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            We have sent password recovery instructions to{" "}
            <span className="font-semibold text-slate-900">{email}</span>.
            Please check your inbox and spam folder.
          </p>
        </div>
      ) : (
        <form
          id="forgot-password-form"
          onSubmit={handleSubmit}
          className="space-y-4 py-2"
        >
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="forgot-email"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. alex.morgan@jeffsgroup.org"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#C9A227] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/20"
                autoFocus
              />
            </div>
          </div>

          <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold mb-0.5">
              Note for Tournament Operators:
            </p>
            <p className="text-amber-800">
              If your account is managed via organizational single sign-on,
              please reach out to your IT administrator directly.
            </p>
          </div>
        </form>
      )}
    </DialogShell>
  );
};

export default ForgotPasswordDialog;
