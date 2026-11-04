import React from "react";
import { Leaf, Drumstick } from "lucide-react";
import { cn } from "@/utils/cn";
import type { MealPreference } from "@/types/publicRegistration.types";

export interface SegmentedRadioProps {
  value: MealPreference;
  onChange: (val: MealPreference) => void;
  label?: string;
  error?: string;
  required?: boolean;
}

export const SegmentedRadio: React.FC<SegmentedRadioProps> = ({
  value,
  onChange,
  label = "Meal Preference",
  error,
  required = true,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}{" "}
          {required && (
            <span className="text-rose-500 font-bold" aria-hidden="true">
              *
            </span>
          )}
        </label>
        <span className="text-[11px] font-medium text-slate-400">
          Tournament Dining Pass
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-2 gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-1.5 shadow-2xs"
      >
        {/* Vegetarian Option */}
        <button
          type="button"
          role="radio"
          aria-checked={value === "VEG"}
          onClick={() => onChange("VEG")}
          className={cn(
            "flex items-center justify-center gap-2.5 rounded-lg py-2.5 px-3 text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none",
            value === "VEG"
              ? "bg-white text-emerald-800 shadow-xs border border-emerald-200/80 ring-1 ring-emerald-500/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60",
          )}
        >
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-xs shrink-0 transition-colors",
              value === "VEG"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-500",
            )}
          >
            <Leaf className="h-3.5 w-3.5" />
          </div>
          <div className="text-left">
            <span className="block font-bold leading-tight">Vegetarian</span>
            <span className="block text-[10px] text-slate-400 font-normal">
              Pure Veg Catering
            </span>
          </div>
        </button>

        {/* Non-Vegetarian Option */}
        <button
          type="button"
          role="radio"
          aria-checked={value === "NON_VEG"}
          onClick={() => onChange("NON_VEG")}
          className={cn(
            "flex items-center justify-center gap-2.5 rounded-lg py-2.5 px-3 text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none",
            value === "NON_VEG"
              ? "bg-white text-[#9B7415] shadow-xs border border-[#ECD59A] ring-1 ring-[#C9A227]/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60",
          )}
        >
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-xs shrink-0 transition-colors",
              value === "NON_VEG"
                ? "bg-[#FAF4E6] text-[#9B7415]"
                : "bg-slate-200 text-slate-500",
            )}
          >
            <Drumstick className="h-3.5 w-3.5" />
          </div>
          <div className="text-left">
            <span className="block font-bold leading-tight">Non-Veg</span>
            <span className="block text-[10px] text-slate-400 font-normal">
              Standard / Halal
            </span>
          </div>
        </button>
      </div>

      {error && (
        <p className="mt-1 text-xs font-semibold text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default SegmentedRadio;
