import React, { useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import { JeffsGroupLogo } from "@/components/common/JeffsGroupLogo";
import { ROUTES } from "@/constants/routes";

export interface PublicLayoutProps {
  children?: React.ReactNode;
  title?: string;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  title = "Tournament Meal Registration | Jeffs Group",
}) => {
  // Enforce noindex meta tag and document title
  useEffect(() => {
    document.title = title;

    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.setAttribute("name", "robots");
      metaRobots.setAttribute("content", "noindex, nofollow");
      document.head.appendChild(metaRobots);
    } else {
      metaRobots.setAttribute("content", "noindex, nofollow");
    }
  }, [title]);

  return (
    <div className="min-h-screen w-full bg-[#F8F9FB] flex flex-col font-sans text-slate-900 selection:bg-[#FAF4E6] selection:text-[#9B7415]">
      {/* Top Public Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/95 px-4 sm:px-8 py-3.5 backdrop-blur-xs">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link to={ROUTES.REGISTER} className="flex items-center gap-3">
            <JeffsGroupLogo iconClassName="h-8 w-8 text-[#C9A227]" />
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Accreditation Portal</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">{children || <Outlet />}</div>
      </main>
    </div>
  );
};

export default PublicLayout;

