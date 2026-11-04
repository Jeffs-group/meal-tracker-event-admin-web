import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { TeamHeader } from "@/components/teams/TeamHeader";
import { MemberTypeTabs } from "@/components/teams/MemberTypeTabs";
import { TeamMembersTable } from "@/components/teams/TeamMembersTable";
import { StatCard } from "@/components/ui/StatCard";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { BatchActionsMenu } from "@/components/registrations/BatchActionsMenu";
import { RegistrantReviewModal } from "@/components/registrations/RegistrantReviewModal";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";
import {
  useTeamDetail,
  useTeamMembers,
  useToggleTeamStatus,
} from "@/hooks/useTeamMembers";
import { useTableFilters } from "@/hooks/useTableFilters";
import { STATUS_FILTER_OPTIONS } from "@/constants/status";
import { teamsApi } from "@/api/teams.api";
import { registrationsApi } from "@/api/registrations.api";
import { ShareRegistrationModal } from "@/components/common/ShareRegistrationModal";
import {
  ExportDropdown,
  type ExportFileFormat,
} from "@/components/common/ExportDropdown";
import {
  exportReportToCsv,
  exportReportToExcel,
  exportReportToPdf,
  triggerBrowserDownload,
  type ExportColumn,
} from "@/utils/exportReport";
import type { TeamMemberRow } from "@/types/team.types";
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
  RotateCcw,
  Share2,
} from "lucide-react";

export const TeamMembersPage: React.FC = () => {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const { teamId = "chennai-kings" } = useParams<{ teamId: string }>();
  const navigate = useNavigate();

  const filters = useTableFilters({ pageSize: 10, memberType: "ALL" });
  const {
    data: team,
    isLoading: teamLoading,
    isError: teamError,
    refetch: refetchTeam,
  } = useTeamDetail(teamId);
  const { data: membersResult, isLoading: membersLoading } = useTeamMembers(
    teamId,
    filters.queryParams,
  );
  const toggleTeamMutation = useToggleTeamStatus();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const membersList = membersResult?.data ?? [];

  const handleSelectRow = (id: string, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, id] : prev.filter((item) => item !== id),
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedIds(selected ? membersList.map((m) => m.id) : []);
  };

  const handleExportRoster = async (format: ExportFileFormat) => {
    try {
      setIsExporting(true);
      const teamSlug = team?.name ? team.name.replace(/\s+/g, "_") : "Team";
      let blob: Blob | null = null;

      try {
        if (format === "csv") {
          blob = await registrationsApi.exportRegistrationsCsv({
            teamId,
            type: "TEAM",
            search: filters.search,
            status: filters.status !== "ALL" ? filters.status : undefined,
            memberType:
              filters.memberType !== "ALL" ? filters.memberType : undefined,
          });
        } else {
          blob = await teamsApi.exportTeamRoster(teamId, {
            search: filters.search,
            status: filters.status,
            memberType: filters.memberType,
            format,
          });
        }
      } catch {
        blob = null;
      }

      if (blob) {
        const ext = format === "xlsx" ? "xlsx" : format === "pdf" ? "pdf" : "csv";
        triggerBrowserDownload(blob, `${teamSlug}_Roster.${ext}`);
        return;
      }

      // Fallback to client-side report generation
      const columns: ExportColumn<TeamMemberRow>[] = [
        {
          header: "Registration ID",
          key: "registrationId",
          accessor: (r) => r.registrationId,
        },
        { header: "Name", key: "name", accessor: (r) => r.name },
        {
          header: "Member Type",
          key: "memberType",
          accessor: (r) => r.memberType,
        },
        { header: "Contact", key: "contact", accessor: (r) => r.contact },
        { header: "Email", key: "email", accessor: (r) => r.email },
        { header: "Status", key: "status", accessor: (r) => r.status },
        {
          header: "Meal Access",
          key: "mealEligible",
          accessor: (r) => (r.mealEligible ? "Active" : "Inactive"),
        },
      ];

      const rows = membersList.filter((m) =>
        selectedIds.length > 0 ? selectedIds.includes(m.id) : true,
      );

      if (format === "csv") {
        exportReportToCsv(teamSlug.toLowerCase(), rows, columns);
      } else if (format === "xlsx") {
        await exportReportToExcel(
          teamSlug.toLowerCase(),
          `${team?.name || "Team"} Roster`,
          rows,
          columns,
          {
            team: team?.name,
            league: team?.league,
            memberType: filters.memberType,
            status: filters.status,
          },
        );
      } else if (format === "pdf") {
        exportReportToPdf(
          teamSlug.toLowerCase(),
          `${team?.name || "Team"} Roster Dossier`,
          rows,
          columns,
        );
      }
    } catch (err: unknown) {
      console.error("Export roster failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (teamError) {
    return (
      <div className="py-12">
        <ErrorDisplay
          title="Team Not Found"
          message="The requested franchise team roster could not be loaded."
          onRetry={() => refetchTeam()}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={team?.name || "Team Member Management"}
        description="Roster accreditation, accreditation badges, and dining hall QR codes for team delegation."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Registrations", href: "/registrations?tab=teams" },
          { label: team?.name || "Team Members" },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            {team && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsShareOpen(true)}
                leftIcon={<Share2 className="h-4 w-4 text-[#C9A227]" />}
              >
                Team Registration Link
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/registrations?tab=teams")}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Teams
            </Button>
          </div>
        }
      />

      {/* Team Header Card */}
      {team && (
        <TeamHeader
          team={team}
          onToggleStatus={() => toggleTeamMutation.mutate(team.id)}
          isToggling={toggleTeamMutation.isPending}
        />
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Registrations"
          value={team?.stats.total ?? 0}
          progress={{
            value: team ? (team.stats.total / team.stats.maxCap) * 100 : 0,
            color: "gold",
          }}
          subtitle={`Max Roster Cap: ${team?.stats.maxCap ?? 30} slots`}
          icon={<Users className="h-5 w-5 text-slate-400" />}
        />

        <StatCard
          title="Approved (Meal-Eligible)"
          value={team?.stats.approved ?? 0}
          progress={{
            value: team?.stats.approvedPercentage ?? 0,
            color: "emerald",
          }}
          subtitle={`${team?.stats.approvedPercentage ?? 0}% of delegation`}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
        />

        <StatCard
          title="Pending Approvals"
          value={team?.stats.pending ?? 0}
          badgeText="Requires Action"
          badgeVariant="warning"
          subtitle="Awaiting administrative check"
          icon={<Clock className="h-5 w-5 text-amber-500" />}
        />

        <StatCard
          title="Rejected / Ineligible"
          value={team?.stats.rejected ?? 0}
          progress={{
            value: team?.stats.rejectedPercentage ?? 0,
            color: "rose",
          }}
          subtitle={`${team?.stats.rejectedPercentage ?? 0}% disqualified`}
          icon={<XCircle className="h-5 w-5 text-rose-500" />}
        />
      </div>

      {/* Member Type Tabs Filter */}
      {team && (
        <div className="mb-4">
          <MemberTypeTabs
            activeType={filters.memberType}
            onChange={filters.setMemberType}
            counts={team.memberCountsByType}
          />
        </div>
      )}

      {/* Filter and Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs mb-4">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <SearchInput
            value={filters.rawSearch}
            onChange={filters.setSearch}
            placeholder="Search name, ID, contact..."
          />
          <Select
            options={STATUS_FILTER_OPTIONS}
            value={filters.status}
            onChange={(e) => filters.setStatus(e.target.value)}
          />
          <Select
            options={[
              { value: "submittedAt", label: "Latest Submission" },
              { value: "name", label: "Name Alphabetical" },
            ]}
            value={filters.sortBy}
            onChange={(e) => filters.setSortBy(e.target.value)}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={filters.resetFilters}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            Reset
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <ExportDropdown
            label="Export Roster"
            onExport={handleExportRoster}
            isExporting={isExporting}
            totalRecords={membersList.length}
          />
        </div>
      </div>

      {/* Team Members Table */}
      <TeamMembersTable
        data={membersList}
        isLoading={membersLoading || teamLoading}
        selectedIds={selectedIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        onViewDetails={(id) => setReviewId(id)}
      />

      {/* Pagination */}
      {membersResult && (
        <Pagination
          currentPage={membersResult.pagination.page}
          totalPages={membersResult.pagination.totalPages}
          totalItems={membersResult.pagination.total}
          pageSize={membersResult.pagination.pageSize}
          onPageChange={filters.setPage}
          onPageSizeChange={filters.setPageSize}
        />
      )}

      {/* Floating Batch Actions Bar */}
      <BatchActionsMenu
        selectedCount={selectedIds.length}
        onExportSelected={handleExportRoster}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Registrant Review Modal */}
      <RegistrantReviewModal
        registrantId={reviewId}
        isOpen={!!reviewId}
        onClose={() => setReviewId(null)}
      />

      {/* Share Registration Link & QR Modal */}
      {team && (
        <ShareRegistrationModal
          isOpen={isShareOpen}
          team={{
            id: team.id,
            name: team.name,
            code: team.code,
            league: team.league,
          }}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </div>
  );
};

export default TeamMembersPage;
