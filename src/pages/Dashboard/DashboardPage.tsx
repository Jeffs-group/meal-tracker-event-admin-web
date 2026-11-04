import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { ExportDropdown } from "@/components/common/ExportDropdown";
import {
  RegistrationDonut,
  BreakdownBars,
  RecentRegistrationsTable,
  TeamOverviewTable,
} from "@/components/dashboard";
import { RegistrantReviewModal } from "@/components/registrations/RegistrantReviewModal";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";
import { useDashboard } from "@/hooks/useDashboard";
import { dashboardApi } from "@/api/dashboard.api";
import {
  exportReportToExcel,
  exportReportToPdf,
  triggerBrowserDownload,
  type ExportColumn,
} from "@/utils/exportReport";
import type { TeamOverviewItem } from "@/types/dashboard.types";
import {
  Users,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  RotateCcw,
} from "lucide-react";

function getTodayIST(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export const DashboardPage: React.FC = () => {
  const todayIST = getTodayIST();
  const [selectedDate, setSelectedDate] = useState<string>(todayIST);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [reviewId, setReviewId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useDashboard(selectedDate);

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    try {
      setIsExporting(true);
      if (format === "csv") {
        const blob = await dashboardApi.exportCsv(selectedDate);
        triggerBrowserDownload(
          blob,
          `event-dashboard-${selectedDate || "today"}.csv`,
        );
      } else {
        const cols: ExportColumn<TeamOverviewItem>[] = [
          { header: "Team Code", key: "code", accessor: (t) => t.code },
          { header: "Team Name", key: "name", accessor: (t) => t.name },
          { header: "League", key: "league", accessor: (t) => t.league },
          {
            header: "Total Registrations",
            key: "totalRegistrations",
            accessor: (t) => t.totalRegistrations,
          },
          {
            header: "Approved",
            key: "approvedCount",
            accessor: (t) => t.approvedCount,
          },
          {
            header: "Pending",
            key: "pendingCount",
            accessor: (t) => t.pendingCount,
          },
          {
            header: "Rejected",
            key: "rejectedCount",
            accessor: (t) => t.rejectedCount,
          },
          { header: "Status", key: "status", accessor: (t) => t.status },
        ];
        const rows = data?.teamOverview || [];
        const filters = {
          "Selected Date": selectedDate,
          "Total Registrations": data?.stats.totalRegistrations.count ?? 0,
          "Approved Registrations": data?.stats.approvedRegistrations.count ?? 0,
          "Pending Approvals": data?.stats.pendingApprovals.count ?? 0,
          "Active Teams": data?.stats.activeTeams.count ?? 0,
        };

        if (format === "xlsx") {
          await exportReportToExcel(
            `dashboard_${selectedDate}`,
            "Dashboard Summary",
            rows,
            cols,
            filters,
          );
        } else {
          exportReportToPdf(
            `dashboard_${selectedDate}`,
            `Meal Tracker Dashboard - ${selectedDate}`,
            rows,
            cols,
            filters,
          );
        }
      }
    } catch (err) {
      console.error("Failed to export dashboard data:", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (isError) {
    return (
      <div className="py-12">
        <ErrorDisplay
          title="Failed to Load Dashboard Metrics"
          message={
            error instanceof Error
              ? error.message
              : "An error occurred while fetching registration metrics."
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const isToday = selectedDate === todayIST;

  return (
    <div>
      <PageHeader
        title="Meal Tracker Dashboard"
        description="Comprehensive real-time overview of tournament registrations, approvals, and meal eligibility allocations."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Dashboard" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Selector */}
            <div className="relative flex items-center">
              <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-[34px] rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-400 focus:border-[#C9A227] focus:outline-none focus:ring-1 focus:ring-[#C9A227] cursor-pointer"
                aria-label="Filter dashboard by date"
              />
            </div>

            {/* Quick Today Button */}
            {!isToday && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(todayIST)}
                className="text-xs text-[#9B7415] hover:bg-[#FAF4E6]"
              >
                Reset to Today
              </Button>
            )}

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              leftIcon={
                <RotateCcw
                  className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-[#C9A227]" : "text-slate-500"}`}
                />
              }
            >
              Refresh
            </Button>

            {/* Export Dropdown */}
            <ExportDropdown
              label="Export"
              onExport={handleExport}
              isExporting={isExporting}
            />
          </div>
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Registrations"
          value={
            isLoading ? "..." : (data?.stats.totalRegistrations.count ?? 0)
          }
          trend={
            data?.stats.totalRegistrations
              ? {
                  value: `+${data.stats.totalRegistrations.trendPercentage}%`,
                  isPositive: true,
                }
              : undefined
          }
          subtitle="All rosters across active leagues"
          icon={<Users className="h-5 w-5" />}
        />

        <StatCard
          title="Pending Approvals"
          value={isLoading ? "..." : (data?.stats.pendingApprovals.count ?? 0)}
          badgeText="Requires Action"
          badgeVariant="warning"
          subtitle="Awaiting administrative verification"
          icon={<Clock className="h-5 w-5 text-amber-500" />}
        />

        <StatCard
          title="Approved Registrations"
          value={
            isLoading ? "..." : (data?.stats.approvedRegistrations.count ?? 0)
          }
          badgeText={`${data?.stats.approvedRegistrations.ratioPercentage ?? 0}% Ratio`}
          badgeVariant="success"
          subtitle="QR codes & meal access generated"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
        />

        <StatCard
          title="Active Teams"
          value={
            isLoading
              ? "..."
              : `${data?.stats.activeTeams.count ?? 0} / ${data?.stats.activeTeams.totalTeams ?? 0}`
          }
          badgeText={
            data?.stats.activeTeams.mealActivatedTeams !== undefined
              ? `${data.stats.activeTeams.mealActivatedTeams} Meal-Active`
              : `${data?.stats.activeTeams.verifiedPercentage ?? 100}% Verified`
          }
          badgeVariant="neutral"
          subtitle={`${data?.stats.activeTeams.verifiedPercentage ?? 100}% verified rosters active`}
          icon={<ShieldCheck className="h-5 w-5 text-[#C9A227]" />}
        />
      </div>

      {/* Visual Analytics Grid: Donut + Breakdown Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-stretch">
        {/* Registration Overview Donut Chart */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between min-h-[380px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Registration Overview
              </h3>
              <p className="text-xs text-slate-500">
                Distribution by verification status
              </p>
            </div>
            {data?.date && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 font-mono">
                {data.date}
              </span>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-between">
            {isLoading || !data ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                Loading chart distribution...
              </div>
            ) : (
              <RegistrationDonut data={data.overview} />
            )}
          </div>
        </div>

        {/* Registration Breakdown Progress Bars & Rates */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between min-h-[380px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Capacity & Intake Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Roster quota utilization and daily meal tracking metrics
              </p>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-between">
            {isLoading || !data ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                Loading capacity breakdown...
              </div>
            ) : (
              <BreakdownBars data={data.breakdown} />
            )}
          </div>
        </div>
      </div>

      {/* Tables Section: Recent Registrations & Team Overview */}
      <div className="space-y-6">
        {data && (
          <RecentRegistrationsTable
            items={data.recentRegistrations}
            onReviewRegistrant={(id) => setReviewId(id)}
          />
        )}

        {data && <TeamOverviewTable teams={data.teamOverview} />}
      </div>

      {/* Registrant Review Modal */}
      <RegistrantReviewModal
        registrantId={reviewId}
        isOpen={!!reviewId}
        onClose={() => setReviewId(null)}
      />
    </div>
  );
};

export default DashboardPage;

