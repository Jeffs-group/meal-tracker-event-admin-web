import React, { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  CheckCircle2,
  Copy,
  Check,
  User,
  Shield,
  Phone,
  Mail,
  UtensilsCrossed,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { maskEmail } from "@/validations/publicRegistration.validation";
import type {
  PublicRegistrationResult,
  PublicRegistrationPayload,
} from "@/types/publicRegistration.types";

export const RegisterSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const state = location.state as {
    result?: PublicRegistrationResult;
    payload?: PublicRegistrationPayload;
  } | null;

  // Protect receipt page: if visited directly without state, redirect to registration form
  if (!state?.result || !state?.payload) {
    return <Navigate to={ROUTES.REGISTER} replace />;
  }

  const { result, payload } = state;

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(result.applicationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleRegisterAnother = () => {
    navigate(ROUTES.REGISTER, { replace: true });
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-4 sm:py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-card text-center relative overflow-hidden">
        {/* Accent Bar at top */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600" />

        {/* Big Success Check Circle */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 shadow-sm mb-5">
          <CheckCircle2 className="h-9 w-9 text-emerald-600 stroke-[2.2]" />
        </div>

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>Application Submitted</span>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Thank You, {payload.fullName.split(" ")[0]}!
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          Your meal registration has been received and logged under{" "}
          <span className="font-semibold text-slate-700">Pending Review</span>.
          Official credentials and digital meal passes will be generated upon
          admin verification.
        </p>

        {/* Monospace Application ID Pill */}
        <div className="my-6 inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Application ID:
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm sm:text-base font-bold text-slate-900 tracking-wide">
              {result.applicationId}
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              aria-label="Copy Application ID"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 text-[11px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-[11px]">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Receipt Details Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 text-left text-xs mb-6 divide-y divide-slate-200/80">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2 text-slate-600">
              <User className="h-4 w-4 text-slate-400" />
              <span className="font-medium">Full Name</span>
            </div>
            <span className="font-bold text-slate-900">{payload.fullName}</span>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2 text-slate-600">
              <Shield className="h-4 w-4 text-[#C9A227]" />
              <span className="font-medium">Role & League</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-900">
                {payload.registrantType}
              </span>
              <span className="text-slate-400 mx-1.5">•</span>
              <span className="font-semibold text-[#9B7415]">
                {payload.league}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="h-4 w-4 text-slate-400" />
              <span className="font-medium">Contact Phone</span>
            </div>
            <span className="font-mono font-semibold text-slate-900">
              {payload.contactNumber}
            </span>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="font-medium">Registered Email</span>
            </div>
            <span className="font-mono text-slate-700">
              {maskEmail(payload.emailAddress)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-2 text-slate-600">
              <UtensilsCrossed className="h-4 w-4 text-slate-400" />
              <span className="font-medium">Meal Preference</span>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                payload.mealPreference === "VEG"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {payload.mealPreference === "VEG" ? "Vegetarian" : "Non-Veg"}
            </span>
          </div>
        </div>

        {/* SLA Notice Box */}
        <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-left text-xs text-sky-900 leading-relaxed mb-8">
          <p className="font-medium">
            <strong className="font-bold text-sky-950">
              Verification Notice:
            </strong>{" "}
            The tournament administrative committee will review your photograph
            and roster assignment. Once approved, a meal pass with your personal
            tournament QR code will be dispatched to your registered email.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleRegisterAnother}
            className="inline-flex items-center gap-2 rounded-xl bg-[#C9A227] hover:bg-[#B58E1E] active:bg-[#9E7B15] px-6 py-3 text-sm font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            <span>Register Another Person</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterSuccessPage;
