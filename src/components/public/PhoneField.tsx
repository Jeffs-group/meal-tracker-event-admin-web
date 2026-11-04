import React, { forwardRef } from "react";
import { Phone } from "lucide-react";
import { cn } from "@/utils/cn";

export interface PhoneFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
}

/**
 * India Flag SVG Component (vector, no broken emojis)
 */
export const IndiaFlagSvg: React.FC<{ className?: string }> = ({
  className = "h-3.5 w-5",
}) => (
  <svg
    className={cn("rounded-xs shadow-2xs overflow-hidden shrink-0", className)}
    viewBox="0 0 30 20"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Saffron band */}
    <rect width="30" height="6.67" fill="#FF9933" />
    {/* White band */}
    <rect y="6.67" width="30" height="6.67" fill="#FFFFFF" />
    {/* Green band */}
    <rect y="13.34" width="30" height="6.66" fill="#138808" />
    {/* Ashoka Chakra */}
    <circle
      cx="15"
      cy="10"
      r="2.5"
      fill="none"
      stroke="#000080"
      strokeWidth="0.5"
    />
    <circle cx="15" cy="10" r="0.6" fill="#000080" />
  </svg>
);

export const PhoneField = forwardRef<HTMLInputElement, PhoneFieldProps>(
  (
    {
      value,
      onChange,
      label = "Contact Number",
      error,
      required = true,
      id = "contactNumber",
      disabled,
      ...props
    },
    ref,
  ) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Allow only digits and spaces/dashes during typing
      const raw = e.target.value;
      // Strip everything except digits
      const digitsOnly = raw.replace(/\D/g, "");
      // Limit to 10 digits
      const truncated = digitsOnly.slice(0, 10);
      onChange(truncated);
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            {label}{" "}
            {required && (
              <span className="text-rose-500 font-bold" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex rounded-xl border bg-white shadow-2xs transition-all focus-within:ring-2 focus-within:ring-[#C9A227]/20 focus-within:border-[#C9A227]">
          {/* Leading Icon & Flag +91 Prefix */}
          <div className="flex items-center gap-2 pl-3 pr-2.5 border-r border-slate-200 bg-slate-50/80 rounded-l-xl text-xs font-semibold text-slate-700 select-none shrink-0">
            <Phone className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <IndiaFlagSvg />
            <span className="font-mono text-slate-800 tracking-wide">+91</span>
          </div>

          {/* 10-digit input */}
          <input
            {...props}
            ref={ref}
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            disabled={disabled}
            value={value}
            onChange={handleInputChange}
            placeholder="98765 43210"
            maxLength={10}
            className={cn(
              "w-full rounded-r-xl bg-transparent py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 font-mono tracking-wide",
              error ? "border-rose-300" : "border-transparent",
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
          />
        </div>

        {error && (
          <p
            id={`${id}-error`}
            className="mt-1 text-xs font-semibold text-rose-600"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

PhoneField.displayName = "PhoneField";
export default PhoneField;
