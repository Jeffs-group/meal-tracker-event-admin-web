import React from "react";
import { Link } from "react-router-dom";
import { Clock, ShieldAlert, Mail, Home } from "lucide-react";
import { usePublicConfig } from "@/hooks/public/usePublicRegistration";
import { ROUTES } from "@/constants/routes";

export const RegisterClosedPage: React.FC = () => {
  const { data: config } = usePublicConfig();

  return (
    <div className="w-full max-w-xl mx-auto py-8 sm:py-16 text-center">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 shadow-card">
        {/* Clock / Closed Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 border-2 border-amber-200 text-amber-600 shadow-sm mb-5">
          <Clock className="h-8 w-8 text-amber-600" />
        </div>

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-800 mb-3">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
          <span>Registration Window Closed</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Meal Registration is Currently Closed
        </h1>

        {/* Description */}
        <p className="mt-3 text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          The public portal for{" "}
          {config?.seasonLabel || "KSPL & ISCL Leagues 2026"} is not accepting
          new registrations at this time.
        </p>

        {/* Schedule / Support Info */}
        <div className="my-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">
              Tournament Season:
            </span>
            <span className="font-mono font-medium text-slate-900">
              {config?.seasonLabel || "2026 Official Tournament"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">
              Official Support:
            </span>
            <a
              href="mailto:support@jeffsgroup.org"
              className="inline-flex items-center gap-1 text-[#C9A227] hover:underline font-medium"
            >
              <Mail className="h-3 w-3" />
              <span>support@jeffsgroup.org</span>
            </a>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-6">
          If you are an authorized team manager, franchise official, or
          tournament administrator needing roster adjustments, please contact
          the Event Operations Desk directly.
        </p>

        {/* Back Link */}
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-semibold text-slate-700 transition-colors"
        >
          <Home className="h-3.5 w-3.5 text-slate-400" />
          <span>Go to Staff & Admin Login</span>
        </Link>
      </div>
    </div>
  );
};

export default RegisterClosedPage;
