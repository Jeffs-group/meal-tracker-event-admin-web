import React from "react";
import { Info } from "lucide-react";
import { cn } from "@/utils/cn";

export interface NoticeBoxProps {
  slaText?: string;
  className?: string;
}

export const NoticeBox: React.FC<NoticeBoxProps> = ({
  slaText = "Registrations are reviewed by the Event Admin. Official accreditation badge and meal token passcodes will be issued via email upon verification approval.",
  className,
}) => {
  return (
    <div
      role="region"
      aria-label="Important Registration Notice"
      className={cn(
        "rounded-xl border border-blue-200/90 bg-blue-50/70 p-4 text-xs text-blue-900 leading-relaxed shadow-2xs",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-700 shrink-0 mt-0.5">
          <Info className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-xs uppercase tracking-wider text-blue-950 mb-1">
            Important Notice
          </h4>
          <p className="text-blue-900/90 leading-relaxed">{slaText}</p>
          <p className="mt-1.5 text-[11px] text-blue-700 font-medium">
            Note: Meal eligibility tokens will remain withheld until
            administrative verification is complete.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoticeBox;
