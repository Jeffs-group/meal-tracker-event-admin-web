import React from "react";
import { UtensilsCrossed, ShieldCheck, HelpCircle } from "lucide-react";
import { cn } from "@/utils/cn";

export interface InfoTilesProps {
  className?: string;
}

export const InfoTiles: React.FC<InfoTilesProps> = ({ className }) => {
  const tiles = [
    {
      title: "Fresh Gourmet Catering",
      description:
        "Standardized tournament meals prepared daily by executive culinary teams.",
      icon: <UtensilsCrossed className="h-5 w-5 text-[#C9A227]" />,
      badge: "Culinary Standard",
    },
    {
      title: "Prompt Verification",
      description:
        "Fast accreditation review and digital pass generation by Event Administrators.",
      icon: <ShieldCheck className="h-5 w-5 text-emerald-600" />,
      badge: "Secure Access",
    },
    {
      title: "Dedicated Desk",
      description:
        "Dedicated tournament catering liaison desk at every stadium entrance gate.",
      icon: <HelpCircle className="h-5 w-5 text-blue-600" />,
      badge: "On-Site Support",
    },
  ];

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      {tiles.map((tile) => (
        <div
          key={tile.title}
          className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-slate-300"
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
              {tile.icon}
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider font-mono">
              {tile.badge}
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
            {tile.title}
          </h4>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            {tile.description}
          </p>
        </div>
      ))}
    </div>
  );
};

export default InfoTiles;
