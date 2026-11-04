import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { TeamsTab } from "./tabs/TeamsTab";
import { StaffsTab } from "./tabs/StaffsTab";
import { OrganizersTab } from "./tabs/OrganizersTab";
import { useTableFilters } from "@/hooks/useTableFilters";
import { useTeams, useStaffs, useOrganizers } from "@/hooks/useRegistrations";
import { Users, Briefcase, Award, Share2 } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { ShareRegistrationModal } from "@/components/common/ShareRegistrationModal";
import { registrationsApi } from "@/api/registrations.api";
import { teamsApi } from "@/api/teams.api";
import {
  ExportDropdown,
  type ExportFileFormat,
} from "@/components/common/ExportDropdown";
import {
  exportReportToExcel,
  exportReportToPdf,
  triggerBrowserDownload,
  type ExportColumn,
} from "@/utils/exportReport";
import type {
  StaffRegistrationRow,
  OrganizerRegistrationRow,
} from "@/types/registration.types";

export const RegistrationsPage: React.FC = () => {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { tab, setTab } = useTableFilters({ tab: "teams" });
  const { can } = usePermissions();
  const canView = can("registrations", "view");

  // Get total counts for tab badges
  const { data: teamsData } = useTeams({ pageSize: 1 });
  const { data: staffsData } = useStaffs({ pageSize: 1 });
  const { data: organizersData } = useOrganizers({ pageSize: 1 });

  const tabs: TabItem[] = [
    {
      id: "teams",
      label: "Teams",
      count: teamsData?.pagination.total ?? 5,
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: "staffs",
      label: "Staffs",
      count: staffsData?.result.pagination.total ?? 5,
      icon: <Briefcase className="h-4 w-4" />,
    },
    {
      id: "organizers",
      label: "Organizers",
      count: organizersData?.result.pagination.total ?? 4,
      icon: <Award className="h-4 w-4" />,
    },
  ];

  const handleExportCurrentTab = async (format: ExportFileFormat) => {
    try {
      setIsExporting(true);

      if (tab === "teams") {
        const blob = await teamsApi.exportRoster({ format });
        const ext = format === "xlsx" ? "xlsx" : format === "pdf" ? "pdf" : "csv";
        triggerBrowserDownload(blob, `Teams_Roster.${ext}`);
        return;
      }

      if (tab === "staffs") {
        if (format === "csv") {
          const blob = await registrationsApi.exportRegistrationsCsv({ type: "STAFF" });
          triggerBrowserDownload(blob, "Staff_Registrations_Roster.csv");
          return;
        }
        const { result } = await registrationsApi.getStaffs({ pageSize: 1000 });
        const staffCols: ExportColumn<StaffRegistrationRow>[] = [
          { header: "ID", key: "id", accessor: (r) => r.registrationId },
          { header: "Name", key: "name", accessor: (r) => r.name },
          { header: "Department", key: "department", accessor: (r) => r.department },
          { header: "Contact", key: "contact", accessor: (r) => r.contact },
          { header: "Email", key: "email", accessor: (r) => r.email },
          { header: "Status", key: "status", accessor: (r) => r.status },
          { header: "Meal Access", key: "mealEligible", accessor: (r) => (r.mealEligible ? "Active" : "Inactive") },
        ];
        if (format === "xlsx") {
          await exportReportToExcel("staff-roster", "Staff Roster", result.data, staffCols, { tab: "staffs" });
        } else {
          exportReportToPdf("staff-roster", "Staff Registrations Roster", result.data, staffCols);
        }
        return;
      }

      // Organizers
      if (format === "csv") {
        const blob = await registrationsApi.exportRegistrationsCsv({ type: "ORGANIZER" });
        triggerBrowserDownload(blob, "Organizer_Registrations_Roster.csv");
        return;
      }
      const { result } = await registrationsApi.getOrganizers({ pageSize: 1000 });
      const orgCols: ExportColumn<OrganizerRegistrationRow>[] = [
        { header: "ID", key: "id", accessor: (r) => r.registrationId },
        { header: "Name", key: "name", accessor: (r) => r.name },
        { header: "Organization", key: "organization", accessor: (r) => r.organization },
        { header: "Contact", key: "contact", accessor: (r) => r.contact },
        { header: "Email", key: "email", accessor: (r) => r.email },
        { header: "Status", key: "status", accessor: (r) => r.status },
        { header: "Meal Access", key: "mealEligible", accessor: (r) => (r.mealEligible ? "Active" : "Inactive") },
      ];
      if (format === "xlsx") {
        await exportReportToExcel("organizers-roster", "Organizers Roster", result.data, orgCols, { tab: "organizers" });
      } else {
        exportReportToPdf("organizers-roster", "Organizers Registrations Roster", result.data, orgCols);
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Registrations & Access Allocation"
        description="Review tournament franchise delegations, operational staff members, and organizer credentials."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Registrations" },
        ]}
        actions={
          canView ? (
            <div className="flex items-center gap-2.5">
              {tab === "teams" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsShareOpen(true)}
                  leftIcon={<Share2 className="h-4 w-4 text-[#C9A227]" />}
                >
                  Registration Link
                </Button>
              )}
              <ExportDropdown
                label="Export Roster"
                onExport={handleExportCurrentTab}
                isExporting={isExporting}
                size="sm"
                variant="outline"
              />
            </div>
          ) : undefined
        }
      />

      {/* Tabs Navigation */}
      <div className="mb-6">
        <Tabs tabs={tabs} activeTab={tab} onChange={setTab} />
      </div>

      {/* Tab Panels */}
      <div>
        {tab === "teams" && <TeamsTab />}
        {tab === "staffs" && <StaffsTab />}
        {tab === "organizers" && <OrganizersTab />}
      </div>

      {/* Share Registration Link & QR Modal */}
      <ShareRegistrationModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
};

export default RegistrationsPage;
