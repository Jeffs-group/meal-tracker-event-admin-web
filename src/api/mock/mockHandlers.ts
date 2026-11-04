import {
  INITIAL_TEAMS,
  INITIAL_MEMBERS,
  INITIAL_STAFF,
  INITIAL_ORGANIZERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_ROLES,
  INITIAL_USERS,
  type RawTeam,
  type RawMember,
  type RawStaff,
  type RawOrganizer,
  type RawAuditEntry,
} from "./mockData";
import type {
  DashboardData,
  RecentRegistrationItem,
  TeamOverviewItem,
} from "@/types/dashboard.types";
import type {
  TeamRegistrationRow,
  StaffRegistrationRow,
  OrganizerRegistrationRow,
  RegistrantDetail,
  StaffStats,
} from "@/types/registration.types";
import type {
  TeamDetail,
  TeamMemberRow,
  Team,
  TeamListParams,
  TeamListResponse,
  CreateTeamPayload,
  UpdateTeamPayload,
  DeactivateTeamPayload,
  ReactivateTeamPayload,
} from "@/types/team.types";
import type { PaginatedResult, TableQueryParams } from "@/types/common.types";
import { calculatePercentage } from "@/utils/formatPercent";
import type {
  ReportKey,
  ReportFilters,
  ExportFormat,
  ReportsHubSummary,
  RegistrationReportRow,
  RegistrationReportSummary,
  TeamReportRow,
  TeamReportSummary,
  StaffOrganizerReportRow,
  StaffOrganizerReportSummary,
  MealEligibilityReportRow,
  MealEligibilityReportSummary,
} from "@/types/reports.types";
import { formatRegistrantId } from "@/utils/formatRegistrantId";
import {
  getMealEligibilityReason,
  MEAL_REASON_META,
} from "@/utils/mealEligibility";
import { COMPLIANCE_THRESHOLD } from "@/constants/reports";
import type {
  Role,
  User,
  UserListParams,
  UserListResponse,
  RoleListParams,
  RoleListResponse,
  CreateUserPayload,
  UpdateUserPayload,
  CreateRolePayload,
  UpdateRolePayload,
  ModuleKey,
  PermissionAction,
} from "@/types/users.types";
import { MODULES } from "@/constants/permissions";
import { DEFAULT_PUBLIC_CONFIG } from "@/constants/publicRegistration";
import type {
  PublicRegistrationConfig,
  PublicTeamOption,
  PublicRegistrationPayload,
  PublicRegistrationResult,
} from "@/types/publicRegistration.types";
import { maskEmail } from "@/validations/publicRegistration.validation";
import type { League } from "@/constants/leagues";

// Stateful in-memory stores
const teamsStore: RawTeam[] = [...INITIAL_TEAMS];
const membersStore: RawMember[] = [...INITIAL_MEMBERS];
const staffStore: RawStaff[] = [...INITIAL_STAFF];
const organizersStore: RawOrganizer[] = [...INITIAL_ORGANIZERS];
const auditLogsStore: RawAuditEntry[] = [...INITIAL_AUDIT_LOGS];
const rolesStore: Role[] = [...INITIAL_ROLES];
const usersStore: User[] = [...INITIAL_USERS];
let actingUserId = "usr-001"; // Default Alex Morgan (Superadmin)

const simulateDelay = (ms = 350) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 1. GET Dashboard Summary
 */
export async function mockGetDashboardSummary(): Promise<DashboardData> {
  await simulateDelay(350);

  // Compute all registrations across members + staff + organizers
  const allRegistrationsCount =
    membersStore.length + staffStore.length + organizersStore.length;

  const allApproved =
    membersStore.filter((m) => m.status === "APPROVED").length +
    staffStore.filter((s) => s.status === "APPROVED").length +
    organizersStore.filter((o) => o.status === "APPROVED").length;

  const allPending =
    membersStore.filter((m) => m.status === "PENDING").length +
    staffStore.filter((s) => s.status === "PENDING").length +
    organizersStore.filter((o) => o.status === "PENDING").length;

  const allRejected =
    membersStore.filter((m) => m.status === "REJECTED").length +
    staffStore.filter((s) => s.status === "REJECTED").length +
    organizersStore.filter((o) => o.status === "REJECTED").length;

  const activeTeamsCount = teamsStore.filter(
    (t) => t.status === "ACTIVE",
  ).length;
  const verifiedPercentage = calculatePercentage(
    activeTeamsCount,
    teamsStore.length,
  );

  // Donut chart percentages
  const approvedPercent = calculatePercentage(
    allApproved,
    allRegistrationsCount,
  );
  const pendingPercent = calculatePercentage(allPending, allRegistrationsCount);
  const rejectedPercent = calculatePercentage(
    allRejected,
    allRegistrationsCount,
  );

  // Breakdown metrics: tournament team quota (active teams vs league quota) & staff quota
  const tournamentTeamSlots = 24; // 12 KSPL + 12 ISCL league quota
  const activeTeamsQuota = activeTeamsCount > 0 ? activeTeamsCount : 18;
  const teamPercentage = calculatePercentage(
    activeTeamsQuota,
    tournamentTeamSlots,
  );
  const staffMaxCapTotal = 300; // Scaled tournament staff allocation quota accommodating full roster
  const staffRegistrationsCount =
    staffStore.length > 0 ? staffStore.length : 38;
  const staffPercentage = calculatePercentage(
    staffRegistrationsCount,
    staffMaxCapTotal,
  );

  // Recent 5 registrations sorted by submitted date desc
  const allRecent: RecentRegistrationItem[] = [
    ...membersStore.map((m) => ({
      id: m.id,
      registrationId: m.registrationId,
      registrantName: m.fullName,
      avatarUrl: m.avatarUrl,
      registrantType: m.registrantType,
      teamName:
        teamsStore.find((t) => t.id === m.teamId)?.name || "Independent",
      memberType: m.memberType,
      submittedAt: m.submittedAt,
      status: m.status,
    })),
    ...staffStore.map((s) => ({
      id: s.id,
      registrationId: s.registrationId,
      registrantName: s.fullName,
      avatarUrl: s.avatarUrl,
      registrantType: "STAFF" as const,
      teamName: "ISCL Operations",
      memberType: "STAFF" as const,
      submittedAt: s.submittedAt,
      status: s.status,
    })),
    ...organizersStore.map((o) => ({
      id: o.id,
      registrationId: o.registrationId,
      registrantName: o.fullName,
      avatarUrl: o.avatarUrl,
      registrantType: "ORGANIZER" as const,
      teamName: o.organization,
      memberType: "ORGANIZER" as const,
      submittedAt: o.submittedAt,
      status: o.status,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    )
    .slice(0, 5);

  // Team Overview Table
  const teamOverview: TeamOverviewItem[] = teamsStore.map((team) => {
    const teamMembers = membersStore.filter((m) => m.teamId === team.id);
    const approvedCount = teamMembers.filter(
      (m) => m.status === "APPROVED",
    ).length;
    const pendingCount = teamMembers.filter(
      (m) => m.status === "PENDING",
    ).length;
    const rejectedCount = teamMembers.filter(
      (m) => m.status === "REJECTED",
    ).length;

    return {
      id: team.id,
      teamId: team.id,
      name: team.name,
      code: team.code,
      league: team.league,
      totalRegistrations: teamMembers.length,
      approvedCount,
      pendingCount,
      rejectedCount,
      status: team.status,
    };
  });

  return {
    stats: {
      totalRegistrations: {
        count: allRegistrationsCount,
        trendPercentage: 12.4,
        isPositive: true,
      },
      pendingApprovals: {
        count: allPending,
        requiresActionText: "Requires Action",
      },
      approvedRegistrations: {
        count: allApproved,
        ratioPercentage: approvedPercent,
      },
      activeTeams: {
        count: activeTeamsCount,
        totalTeams: teamsStore.length,
        verifiedPercentage,
      },
    },
    overview: {
      approved: allApproved,
      approvedPercent,
      pending: allPending,
      pendingPercent,
      rejected: allRejected,
      rejectedPercent,
      total: allRegistrationsCount,
    },
    breakdown: {
      teamRegistrations: activeTeamsQuota,
      teamMaxCap: tournamentTeamSlots,
      teamPercentage,
      staffRegistrations: staffRegistrationsCount,
      staffMaxCap: staffMaxCapTotal,
      staffPercentage,
      dailyIntakeAvg: 14.8,
      verificationRate: approvedPercent,
    },
    recentRegistrations: allRecent,
    teamOverview,
  };
}

/**
 * 2. GET Teams list with computed counts
 */
export async function mockGetTeams(
  params: TableQueryParams = {},
): Promise<PaginatedResult<TeamRegistrationRow>> {
  await simulateDelay(350);

  const {
    search = "",
    league = "",
    status = "",
    page = 1,
    pageSize = 10,
  } = params;

  let filtered = teamsStore.map((team) => {
    const teamMembers = membersStore.filter((m) => m.teamId === team.id);
    return {
      id: team.id,
      teamId: team.id,
      name: team.name,
      code: team.code,
      league: team.league,
      totalRegistrations: teamMembers.length,
      approvedCount: teamMembers.filter((m) => m.status === "APPROVED").length,
      pendingCount: teamMembers.filter((m) => m.status === "PENDING").length,
      rejectedCount: teamMembers.filter((m) => m.status === "REJECTED").length,
      status: team.status,
      isMealActive: Boolean(
        (team as unknown as { isMealActive?: boolean }).isMealActive ??
          team.status === "ACTIVE",
      ),
    };
  });

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.league.toLowerCase().includes(q),
    );
  }

  if (league) {
    filtered = filtered.filter((t) => t.league === league);
  }

  if (status) {
    filtered = filtered.filter((t) => t.status === status);
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}

/**
 * 3. GET Staff list
 */
export async function mockGetStaffs(params: TableQueryParams = {}): Promise<{
  result: PaginatedResult<StaffRegistrationRow>;
  stats: StaffStats;
}> {
  await simulateDelay(350);

  const {
    search = "",
    status = "",
    role = "",
    page = 1,
    pageSize = 10,
  } = params;

  // Compute overall staff stats
  const total = staffStore.length;
  const approved = staffStore.filter((s) => s.status === "APPROVED").length;
  const pending = staffStore.filter((s) => s.status === "PENDING").length;
  const rejected = staffStore.filter((s) => s.status === "REJECTED").length;

  const stats: StaffStats = {
    total,
    approvedMealEligible: approved,
    pending,
    rejected,
    approvedPercent: calculatePercentage(approved, total),
    pendingPercent: calculatePercentage(pending, total),
    rejectedPercent: calculatePercentage(rejected, total),
  };

  let filtered = staffStore.map((s) => ({
    id: s.id,
    registrationId: s.registrationId,
    name: s.fullName,
    avatarUrl: s.avatarUrl,
    role: s.role,
    department: s.department,
    contact: s.contactNumber,
    email: s.emailAddress,
    submittedAt: s.submittedAt,
    status: s.status,
    // Business rule: meal eligible only if approved
    mealEligible: s.status === "APPROVED" && s.mealEligible,
  }));

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.registrationId.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.contact.toLowerCase().includes(q),
    );
  }

  if (status) {
    filtered = filtered.filter((s) => s.status === status);
  }

  if (role) {
    filtered = filtered.filter(
      (s) =>
        s.role.toLowerCase().includes(role.toLowerCase()) ||
        s.department.toLowerCase().includes(role.toLowerCase()),
    );
  }

  const filteredTotal = filtered.length;
  const totalPages = Math.ceil(filteredTotal / pageSize) || 1;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return {
    result: {
      data,
      pagination: {
        page,
        pageSize,
        total: filteredTotal,
        totalPages,
      },
    },
    stats,
  };
}

/**
 * 4. GET Organizers list
 */
export async function mockGetOrganizers(
  params: TableQueryParams = {},
): Promise<{
  result: PaginatedResult<OrganizerRegistrationRow>;
  stats: StaffStats;
}> {
  await simulateDelay(350);

  const {
    search = "",
    status = "",
    role = "",
    page = 1,
    pageSize = 10,
  } = params;

  const total = organizersStore.length;
  const approved = organizersStore.filter(
    (o) => o.status === "APPROVED",
  ).length;
  const pending = organizersStore.filter((o) => o.status === "PENDING").length;
  const rejected = organizersStore.filter(
    (o) => o.status === "REJECTED",
  ).length;

  const stats: StaffStats = {
    total,
    approvedMealEligible: approved,
    pending,
    rejected,
    approvedPercent: calculatePercentage(approved, total),
    pendingPercent: calculatePercentage(pending, total),
    rejectedPercent: calculatePercentage(rejected, total),
  };

  let filtered = organizersStore.map((o) => ({
    id: o.id,
    registrationId: o.registrationId,
    name: o.fullName,
    avatarUrl: o.avatarUrl,
    role: o.role,
    organization: o.organization,
    contact: o.contactNumber,
    email: o.emailAddress,
    submittedAt: o.submittedAt,
    status: o.status,
    mealEligible: o.status === "APPROVED" && o.mealEligible,
  }));

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.registrationId.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.contact.toLowerCase().includes(q),
    );
  }

  if (status) {
    filtered = filtered.filter((o) => o.status === status);
  }

  if (role) {
    filtered = filtered.filter(
      (o) =>
        o.role.toLowerCase().includes(role.toLowerCase()) ||
        o.organization.toLowerCase().includes(role.toLowerCase()),
    );
  }

  const filteredTotal = filtered.length;
  const totalPages = Math.ceil(filteredTotal / pageSize) || 1;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return {
    result: {
      data,
      pagination: {
        page,
        pageSize,
        total: filteredTotal,
        totalPages,
      },
    },
    stats,
  };
}

/**
 * 5. GET Team Detail
 */
export async function mockGetTeamDetail(teamId: string): Promise<TeamDetail> {
  await simulateDelay(300);

  const team = teamsStore.find((t) => t.id === teamId) || teamsStore[0]!;
  const members = membersStore.filter((m) => m.teamId === team.id);

  const total = members.length;
  const approved = members.filter((m) => m.status === "APPROVED").length;
  const pending = members.filter((m) => m.status === "PENDING").length;
  const rejected = members.filter((m) => m.status === "REJECTED").length;

  return {
    id: team.id,
    name: team.name,
    code: team.code,
    teamCode: team.teamCode,
    league: team.league,
    franchiseId: team.franchiseId,
    status: team.status,
    licensed: team.licensed,
    updatedAt: team.updatedAt,
    updatedBy: team.updatedBy,
    stats: {
      total,
      maxCap: team.maxCap,
      approved,
      approvedPercentage: calculatePercentage(approved, total),
      pending,
      rejected,
      rejectedPercentage: calculatePercentage(rejected, total),
    },
    memberCountsByType: {
      ALL: total,
      PLAYER: members.filter((m) => m.memberType === "PLAYER").length,
      OWNER: members.filter((m) => m.memberType === "OWNER").length,
      COACH: members.filter((m) => m.memberType === "COACH").length,
      OTHERS: members.filter((m) => m.memberType === "OTHERS").length,
    },
  };
}

/**
 * 6. GET Team Members list
 */
export async function mockGetTeamMembers(
  teamId: string,
  params: TableQueryParams = {},
): Promise<PaginatedResult<TeamMemberRow>> {
  await simulateDelay(350);

  const team = teamsStore.find((t) => t.id === teamId);
  const teamIsActive = team?.status === "ACTIVE";

  const {
    search = "",
    status = "",
    memberType = "ALL",
    sortBy = "submittedAt",
    sortOrder = "desc",
    page = 1,
    pageSize = 10,
  } = params;

  let members = membersStore.filter((m) => m.teamId === teamId);

  // Filter by member type tab
  if (memberType && memberType !== "ALL") {
    members = members.filter((m) => m.memberType === memberType);
  }

  // Filter by search
  if (search.trim()) {
    const q = search.toLowerCase().trim();
    members = members.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.registrationId.toLowerCase().includes(q) ||
        m.emailAddress.toLowerCase().includes(q) ||
        m.contactNumber.toLowerCase().includes(q),
    );
  }

  // Filter by status
  if (status) {
    members = members.filter((m) => m.status === status);
  }

  // Sorting
  if (sortBy === "submittedAt") {
    members.sort((a, b) => {
      const diff =
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      return sortOrder === "asc" ? -diff : diff;
    });
  } else if (sortBy === "name") {
    members.sort((a, b) =>
      sortOrder === "asc"
        ? a.fullName.localeCompare(b.fullName)
        : b.fullName.localeCompare(a.fullName),
    );
  }

  const total = members.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const start = (page - 1) * pageSize;
  const paginatedMembers = members.slice(start, start + pageSize);

  const data: TeamMemberRow[] = paginatedMembers.map((m) => ({
    id: m.id,
    registrationId: m.registrationId,
    name: m.fullName,
    avatarUrl: m.avatarUrl,
    memberType: m.memberType,
    contact: m.contactNumber,
    email: m.emailAddress,
    submittedAt: m.submittedAt,
    status: m.status,
    // BUSINESS RULE: Meal eligibility = registrant Approved AND team Active
    mealEligible: teamIsActive && m.status === "APPROVED",
  }));

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}

/**
 * 7. GET Registrant Detail (for Review Modal)
 */
export async function mockGetRegistrantDetail(
  id: string,
): Promise<RegistrantDetail> {
  await simulateDelay(300);

  // Check in members
  const member = membersStore.find(
    (m) => m.id === id || m.registrationId === id,
  );
  if (member) {
    const team = teamsStore.find((t) => t.id === member.teamId);
    const regNum = member.registrationId.replace(/[^0-9]/g, "") || "099";
    const appId =
      member.id === "mem-101"
        ? "#REG-CK-099"
        : member.id === "mem-105"
          ? "#REG-CK-097"
          : `#REG-CK-${regNum}`;
    const regId = member.registrationId.startsWith("CK-")
      ? member.registrationId
      : `CK-2026-${regNum.padStart(3, "0")}`;

    const defaultPasscode = "VCD-8842-ISCL";
    const passcode = member.verificationPasscode || defaultPasscode;

    const accreditation = {
      registrantId: regId,
      verificationPasscode: passcode,
      sentTime: member.passcodeSentTime || "Today 14:31 IST",
      qrValue: `${regId}|${passcode}`,
      isActive: member.status === "APPROVED",
    };

    const rejectionInfo =
      member.status === "REJECTED"
        ? {
            primaryCategory:
              member.rejectionCategory ||
              "Incompatible / Blurry Photo Identification",
            adminRemarks:
              member.adminRemarks ||
              member.rejectionReason ||
              "Uploaded portrait does not comply with official accreditation criteria (photo resolution < 600px and face partially obscured). Government ID name does not match submitted name.",
          }
        : undefined;

    return {
      id: member.id,
      applicationId: appId,
      registrantId: regId,
      fullName: member.fullName,
      roleTitle: member.roleTitle,
      registrantType: member.registrantType,
      teamName: team?.name || "Chennai Kings",
      teamId: team?.id,
      teamStatus: team?.status,
      status: member.status,
      rejectionReason: member.rejectionReason,
      rejectionInfo,
      submittedAt: member.submittedAt,
      verifiedAt:
        member.verifiedAt ||
        (member.status === "APPROVED" ? "03 Nov 2026, 14:30 IST" : undefined),
      verifiedBy:
        member.verifiedBy ||
        (member.status === "APPROVED" ? "Alex Morgan" : undefined),
      mealCodeGenerated: member.mealCodeGenerated,
      photo: member.photo,
      attributes: {
        franchiseAndDivision: member.division,
        registrantTypeLabel:
          member.memberType === "PLAYER"
            ? "Player"
            : `Team Member (${member.memberType})`,
        contactNumber: member.contactNumber,
        emailAddress: member.emailAddress,
        mealPreference: member.mealPreference,
        dateOfBirth: member.dateOfBirth,
      },
      accreditation,
    };
  }

  // Check in staff
  const staff = staffStore.find((s) => s.id === id || s.registrationId === id);
  if (staff) {
    const regNum = staff.registrationId.replace(/[^0-9]/g, "") || "101";
    const regId = `STF-2026-${regNum.padStart(3, "0")}`;
    const passcode = "VCD-8842-ISCL";
    return {
      id: staff.id,
      applicationId: `#REG-STF-${regNum}`,
      registrantId: regId,
      fullName: staff.fullName,
      roleTitle: staff.role,
      registrantType: "STAFF",
      teamName: "ISCL Operations Staff",
      teamStatus: "ACTIVE",
      status: staff.status,
      rejectionReason: staff.rejectionReason,
      rejectionInfo:
        staff.status === "REJECTED"
          ? {
              primaryCategory: "Incompatible / Blurry Photo Identification",
              adminRemarks:
                staff.rejectionReason ||
                "Application rejected during administrative verification.",
            }
          : undefined,
      submittedAt: staff.submittedAt,
      verifiedAt:
        staff.status === "APPROVED" ? "03 Nov 2026, 14:30 IST" : undefined,
      verifiedBy: staff.status === "APPROVED" ? "Alex Morgan" : undefined,
      photo: staff.photo,
      attributes: {
        franchiseAndDivision: `Staff / ${staff.department}`,
        registrantTypeLabel: "Operational Staff",
        contactNumber: staff.contactNumber,
        emailAddress: staff.emailAddress,
        mealPreference: staff.mealPreference,
        dateOfBirth: staff.dateOfBirth,
      },
      accreditation: {
        registrantId: regId,
        verificationPasscode: passcode,
        sentTime: "Today 14:31 IST",
        qrValue: `${regId}|${passcode}`,
        isActive: staff.status === "APPROVED",
      },
    };
  }

  // Check in organizers
  const organizer = organizersStore.find(
    (o) => o.id === id || o.registrationId === id,
  );
  if (organizer) {
    const regNum = organizer.registrationId.replace(/[^0-9]/g, "") || "201";
    const regId = `ORG-2026-${regNum.padStart(3, "0")}`;
    const passcode = "VCD-8842-ISCL";
    return {
      id: organizer.id,
      applicationId: `#REG-ORG-${regNum}`,
      registrantId: regId,
      fullName: organizer.fullName,
      roleTitle: organizer.role,
      registrantType: "ORGANIZER",
      teamName: organizer.organization,
      teamStatus: "ACTIVE",
      status: organizer.status,
      rejectionReason: organizer.rejectionReason,
      rejectionInfo:
        organizer.status === "REJECTED"
          ? {
              primaryCategory: "Incompatible / Blurry Photo Identification",
              adminRemarks:
                organizer.rejectionReason ||
                "Application rejected during administrative verification.",
            }
          : undefined,
      submittedAt: organizer.submittedAt,
      verifiedAt:
        organizer.status === "APPROVED" ? "03 Nov 2026, 14:30 IST" : undefined,
      verifiedBy: organizer.status === "APPROVED" ? "Alex Morgan" : undefined,
      photo: organizer.photo,
      attributes: {
        franchiseAndDivision: `Organizing Committee / ${organizer.organization}`,
        registrantTypeLabel: "Event Organizer",
        contactNumber: organizer.contactNumber,
        emailAddress: organizer.emailAddress,
        mealPreference: organizer.mealPreference,
        dateOfBirth: organizer.dateOfBirth,
      },
      accreditation: {
        registrantId: regId,
        verificationPasscode: passcode,
        sentTime: "Today 14:31 IST",
        qrValue: `${regId}|${passcode}`,
        isActive: organizer.status === "APPROVED",
      },
    };
  }

  // Fallback
  const defaultMember = membersStore[0]!;
  return mockGetRegistrantDetail(defaultMember.id);
}

/**
 * 8. APPROVE Registrant Mutation
 */
export async function mockApproveRegistrant(
  id: string,
): Promise<RegistrantDetail> {
  await simulateDelay(400);

  const member = membersStore.find(
    (m) => m.id === id || m.registrationId === id,
  );
  if (member) {
    member.status = "APPROVED";
    member.rejectionReason = undefined;
    member.mealCodeGenerated = `MEAL-QR-${member.registrationId}-${Math.floor(1000 + Math.random() * 9000)}`;
    return mockGetRegistrantDetail(member.id);
  }

  const staff = staffStore.find((s) => s.id === id || s.registrationId === id);
  if (staff) {
    staff.status = "APPROVED";
    staff.rejectionReason = undefined;
    staff.mealEligible = true;
    return mockGetRegistrantDetail(staff.id);
  }

  const organizer = organizersStore.find(
    (o) => o.id === id || o.registrationId === id,
  );
  if (organizer) {
    organizer.status = "APPROVED";
    organizer.rejectionReason = undefined;
    organizer.mealEligible = true;
    return mockGetRegistrantDetail(organizer.id);
  }

  throw new Error(`Registrant with id ${id} not found.`);
}

/**
 * 9. REJECT Registrant Mutation
 */
export async function mockRejectRegistrant(
  id: string,
  reason: string,
): Promise<RegistrantDetail> {
  await simulateDelay(400);

  const member = membersStore.find(
    (m) => m.id === id || m.registrationId === id,
  );
  if (member) {
    member.status = "REJECTED";
    member.rejectionReason =
      reason || "Application rejected during administrative verification.";
    member.mealCodeGenerated = undefined;
    return mockGetRegistrantDetail(member.id);
  }

  const staff = staffStore.find((s) => s.id === id || s.registrationId === id);
  if (staff) {
    staff.status = "REJECTED";
    staff.rejectionReason = reason;
    staff.mealEligible = false;
    return mockGetRegistrantDetail(staff.id);
  }

  const organizer = organizersStore.find(
    (o) => o.id === id || o.registrationId === id,
  );
  if (organizer) {
    organizer.status = "REJECTED";
    organizer.rejectionReason = reason;
    organizer.mealEligible = false;
    return mockGetRegistrantDetail(organizer.id);
  }

  throw new Error(`Registrant with id ${id} not found.`);
}

/**
 * 10. TOGGLE Team Active/Inactive Mutation
 */
export async function mockToggleTeamStatus(teamId: string): Promise<RawTeam> {
  await simulateDelay(350);

  const team = teamsStore.find((t) => t.id === teamId);
  if (!team) throw new Error(`Team ${teamId} not found`);

  team.status = team.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  return { ...team };
}

/**
 * 11. TOGGLE Staff/Organizer Meal Eligibility
 */
export async function mockToggleMealEligibility(id: string): Promise<boolean> {
  await simulateDelay(250);

  const staff = staffStore.find((s) => s.id === id || s.registrationId === id);
  if (staff) {
    if (staff.status !== "APPROVED") {
      throw new Error("Cannot enable meal eligibility for unapproved staff.");
    }
    staff.mealEligible = !staff.mealEligible;
    return staff.mealEligible;
  }

  const organizer = organizersStore.find(
    (o) => o.id === id || o.registrationId === id,
  );
  if (organizer) {
    if (organizer.status !== "APPROVED") {
      throw new Error(
        "Cannot enable meal eligibility for unapproved organizer.",
      );
    }
    organizer.mealEligible = !organizer.mealEligible;
    return organizer.mealEligible;
  }

  throw new Error(`Item ${id} not found.`);
}

/**
 * 12. REVOKE Approval / Deactivate Pass Mutation
 */
export async function mockRevokeApproval(
  id: string,
  reason: string = "Pass revoked by administrative override.",
): Promise<RegistrantDetail> {
  await simulateDelay(350);

  const member = membersStore.find(
    (m) => m.id === id || m.registrationId === id,
  );
  if (member) {
    member.status = "REJECTED";
    member.rejectionCategory = "Administrative Override / Deactivated";
    member.adminRemarks = reason;
    member.rejectionReason = reason;
    member.mealCodeGenerated = undefined;
    return mockGetRegistrantDetail(member.id);
  }

  const staff = staffStore.find((s) => s.id === id || s.registrationId === id);
  if (staff) {
    staff.status = "REJECTED";
    staff.rejectionReason = reason;
    staff.mealEligible = false;
    return mockGetRegistrantDetail(staff.id);
  }

  const organizer = organizersStore.find(
    (o) => o.id === id || o.registrationId === id,
  );
  if (organizer) {
    organizer.status = "REJECTED";
    organizer.rejectionReason = reason;
    organizer.mealEligible = false;
    return mockGetRegistrantDetail(organizer.id);
  }

  throw new Error(`Registrant with id ${id} not found.`);
}

/**
 * 13. RE-OPEN & Re-Verify Registrant Mutation
 */
export async function mockReopenVerification(
  id: string,
): Promise<RegistrantDetail> {
  await simulateDelay(350);

  const member = membersStore.find(
    (m) => m.id === id || m.registrationId === id,
  );
  if (member) {
    member.status = "PENDING";
    member.rejectionCategory = undefined;
    member.adminRemarks = undefined;
    member.rejectionReason = undefined;
    return mockGetRegistrantDetail(member.id);
  }

  const staff = staffStore.find((s) => s.id === id || s.registrationId === id);
  if (staff) {
    staff.status = "PENDING";
    staff.rejectionReason = undefined;
    return mockGetRegistrantDetail(staff.id);
  }

  const organizer = organizersStore.find(
    (o) => o.id === id || o.registrationId === id,
  );
  if (organizer) {
    organizer.status = "PENDING";
    organizer.rejectionReason = undefined;
    return mockGetRegistrantDetail(organizer.id);
  }

  throw new Error(`Registrant with id ${id} not found.`);
}

/**
 * 14. RESEND Passcode & Accreditation Email
 */
export async function mockResendPasscode(
  id: string,
): Promise<{ success: boolean; message: string }> {
  await simulateDelay(300);
  return {
    success: true,
    message: `Digital accreditation badge and meal token passcode resent successfully to registrant ${id}.`,
  };
}

// Helper: Initials for team tile (e.g. "Chennai Kings" -> "CK")
function getTeamInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0]! + parts[1][0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function mapRawToTeam(t: RawTeam): Team {
  return {
    id: t.id,
    teamCode: t.teamCode,
    name: t.name,
    league: t.league,
    status: t.status,
    licensed: t.licensed,
    registrationsTotal: t.registrationsTotal,
    approvedCount: t.approvedCount,
    pendingCount: t.pendingCount,
    rejectedCount: t.rejectedCount,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    updatedBy: t.updatedBy,
    initials: getTeamInitials(t.name),
  };
}

/**
 * 15. MANAGE TEAMS - List, Search, Filter, Sort, Paginate & Stats
 */
export async function mockGetManageTeams(
  params: TeamListParams = {},
): Promise<TeamListResponse> {
  await simulateDelay(350);

  const {
    page = 1,
    pageSize = 6,
    search = "",
    league = "ALL",
    status = "ALL",
    sort = "name_asc",
  } = params;

  let filtered = [...teamsStore];

  // Search by team name or canonical code
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.teamCode.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q),
    );
  }

  // Filter by League (KSPL / ISCL)
  if (league && league !== "ALL") {
    filtered = filtered.filter((t) => t.league === league);
  }

  // Filter by Status (ACTIVE / INACTIVE)
  if (status && status !== "ALL") {
    filtered = filtered.filter((t) => t.status === status);
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sort) {
      case "name_desc":
        return b.name.localeCompare(a.name);
      case "registrants_desc":
        return b.registrationsTotal - a.registrationsTotal;
      case "approved_desc":
        return b.approvedCount - a.approvedCount;
      case "updated_desc":
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      case "name_asc":
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  // Compute live stats across all teams in teamsStore
  const stats = {
    total: teamsStore.length,
    kspl: teamsStore.filter((t) => t.league === "KSPL").length,
    iscl: teamsStore.filter((t) => t.league === "ISCL").length,
    active: teamsStore.filter((t) => t.status === "ACTIVE").length,
    inactive: teamsStore.filter((t) => t.status === "INACTIVE").length,
  };

  return {
    items: paginated.map(mapRawToTeam),
    total,
    stats,
  };
}

/**
 * 16. CREATE Team Mutation
 */
export async function mockCreateTeam(
  payload: CreateTeamPayload,
): Promise<Team> {
  await simulateDelay(400);

  const trimmedName = payload.name.trim();

  // Validate uniqueness case-insensitively within target league
  const exists = teamsStore.some(
    (t) =>
      t.league === payload.league &&
      t.name.toLowerCase() === trimmedName.toLowerCase(),
  );

  if (exists) {
    throw new Error(
      `A team with this name already exists in ${payload.league}.`,
    );
  }

  // Generate canonical ID: TM-<LEAGUE>-###
  const leagueCount =
    teamsStore.filter((t) => t.league === payload.league).length + 1;
  const teamCode = `TM-${payload.league}-${String(leagueCount).padStart(3, "0")}`;
  const slug = trimmedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const id = `${slug}-${Date.now().toString().slice(-4)}`;

  const initials = getTeamInitials(trimmedName);
  const now = new Date();
  const dateStr = `${now.getDate()} ${now.toLocaleString("default", { month: "short" })} ${now.getFullYear()}`;

  const newTeam: RawTeam = {
    id,
    name: trimmedName,
    code: initials,
    teamCode,
    league: payload.league,
    franchiseId: `FRAN-${payload.league}-${initials}-${now.getFullYear()}`,
    status: "ACTIVE",
    licensed: true,
    maxCap: 30,
    registrationsTotal: 0,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    createdAt: now.toISOString(),
    updatedAt: `${dateStr} by Alex Morgan`,
    updatedBy: "Alex Morgan",
  };

  teamsStore.unshift(newTeam);

  auditLogsStore.unshift({
    id: `audit-${Date.now()}`,
    entityType: "TEAM",
    entityId: newTeam.id,
    action: "team_created",
    actor: "Alex Morgan",
    timestamp: now.toISOString(),
  });

  return mapRawToTeam(newTeam);
}

/**
 * 17. UPDATE Team Mutation
 */
export async function mockUpdateTeam(
  teamId: string,
  payload: UpdateTeamPayload,
): Promise<Team> {
  await simulateDelay(400);

  const team = teamsStore.find((t) => t.id === teamId);
  if (!team) {
    throw new Error(`Team with ID ${teamId} not found.`);
  }

  const trimmedName = payload.name.trim();

  // Validate uniqueness if name or league changed
  const exists = teamsStore.some(
    (t) =>
      t.id !== teamId &&
      t.league === payload.league &&
      t.name.toLowerCase() === trimmedName.toLowerCase(),
  );

  if (exists) {
    throw new Error(
      `A team with this name already exists in ${payload.league}.`,
    );
  }

  // NOTE: Team ID and teamCode are IMMUTABLE once created, even if the league changes!
  team.name = trimmedName;
  team.league = payload.league;
  team.code = getTeamInitials(trimmedName);

  const now = new Date();
  const dateStr = `${now.getDate()} ${now.toLocaleString("default", { month: "short" })} ${now.getFullYear()}`;
  team.updatedAt = `${dateStr} by Alex Morgan`;
  team.updatedBy = "Alex Morgan";

  auditLogsStore.unshift({
    id: `audit-${Date.now()}`,
    entityType: "TEAM",
    entityId: team.id,
    action: "team_updated",
    actor: "Alex Morgan",
    timestamp: now.toISOString(),
  });

  return mapRawToTeam(team);
}

/**
 * 18. DEACTIVATE Team Mutation
 */
export async function mockDeactivateTeam(
  teamId: string,
  payload: DeactivateTeamPayload,
): Promise<Team> {
  await simulateDelay(400);

  const team = teamsStore.find((t) => t.id === teamId);
  if (!team) {
    throw new Error(`Team with ID ${teamId} not found.`);
  }

  team.status = "INACTIVE";

  const now = new Date();
  const dateStr = `${now.getDate()} ${now.toLocaleString("default", { month: "short" })} ${now.getFullYear()}`;
  team.updatedAt = `${dateStr} by Alex Morgan`;
  team.updatedBy = "Alex Morgan";

  auditLogsStore.unshift({
    id: `audit-${Date.now()}`,
    entityType: "TEAM",
    entityId: team.id,
    action: "team_deactivated",
    actor: "Alex Morgan",
    reason: payload.reason,
    notes: payload.notes,
    timestamp: now.toISOString(),
  });

  return mapRawToTeam(team);
}

/**
 * 19. REACTIVATE Team Mutation
 */
export async function mockReactivateTeam(
  teamId: string,
  payload: ReactivateTeamPayload,
): Promise<Team> {
  await simulateDelay(400);

  const team = teamsStore.find((t) => t.id === teamId);
  if (!team) {
    throw new Error(`Team with ID ${teamId} not found.`);
  }

  team.status = "ACTIVE";

  const now = new Date();
  const dateStr = `${now.getDate()} ${now.toLocaleString("default", { month: "short" })} ${now.getFullYear()}`;
  team.updatedAt = `${dateStr} by Alex Morgan`;
  team.updatedBy = "Alex Morgan";

  auditLogsStore.unshift({
    id: `audit-${Date.now()}`,
    entityType: "TEAM",
    entityId: team.id,
    action: "team_reactivated",
    actor: "Alex Morgan",
    notes: payload.notes,
    timestamp: now.toISOString(),
  });

  return mapRawToTeam(team);
}

// ============================================================================
// REPORTS MODULE MOCK HANDLERS
// ============================================================================

/**
 * 20. GET Reports & Analytics Hub Summary
 */
export async function mockGetReportsHubSummary(): Promise<ReportsHubSummary> {
  await simulateDelay(300);

  const totalRegistrations =
    membersStore.length + staffStore.length + organizersStore.length;

  const ksplTeams = teamsStore.filter((t) => t.league === "KSPL");
  const isclTeams = teamsStore.filter((t) => t.league === "ISCL");
  const activeTeams = teamsStore.filter((t) => t.status === "ACTIVE");
  const inactiveTeams = teamsStore.filter((t) => t.status === "INACTIVE");

  const totalStaffOrg = staffStore.length + organizersStore.length;
  const approvedStaffOrg =
    staffStore.filter((s) => s.status === "APPROVED").length +
    organizersStore.filter((o) => o.status === "APPROVED").length;

  // Meal eligible count derived strictly via getMealEligibilityReason
  let eligibleCount = 0;

  membersStore.forEach((m) => {
    const team = teamsStore.find((t) => t.id === m.teamId);
    if (
      getMealEligibilityReason({
        status: m.status,
        teamStatus: team?.status,
        hasTeam: true,
      }) === "eligible"
    ) {
      eligibleCount++;
    }
  });

  staffStore.forEach((s) => {
    if (
      getMealEligibilityReason({
        status: s.status,
        hasTeam: false,
        mealEligibleToggle: s.mealEligible,
      }) === "eligible"
    ) {
      eligibleCount++;
    }
  });

  organizersStore.forEach((o) => {
    if (
      getMealEligibilityReason({
        status: o.status,
        hasTeam: false,
        mealEligibleToggle: o.mealEligible,
      }) === "eligible"
    ) {
      eligibleCount++;
    }
  });

  return {
    totalRegistrations,
    changePct: 8.4,
    teams: {
      total: teamsStore.length,
      kspl: ksplTeams.length,
      iscl: isclTeams.length,
      active: activeTeams.length,
      inactive: inactiveTeams.length,
    },
    staffOrganizers: {
      total: totalStaffOrg,
      approvedPct: calculatePercentage(approvedStaffOrg, totalStaffOrg),
    },
    mealEligible: {
      count: eligibleCount,
      gateSyncedAt: new Date().toISOString(),
      isDelayed: false,
    },
    generatedAt: new Date().toISOString(),
  };
}

// Helper: Filter unified candidate registrations
function getFilteredCandidateRegistrations(filters: ReportFilters = {}) {
  const {
    search = "",
    from,
    to,
    league,
    teamId,
    type,
    memberRole,
    status,
  } = filters;

  const rows: RegistrationReportRow[] = [
    ...membersStore.map((m) => {
      const team = teamsStore.find((t) => t.id === m.teamId);
      return {
        id: m.id,
        registrantId: m.registrationId,
        formattedId: formatRegistrantId(m.registrationId),
        name: m.fullName,
        avatarUrl: m.avatarUrl,
        designation: m.designation,
        isVip: m.isVip,
        type: "TEAM" as const,
        teamId: m.teamId,
        teamName: team?.name || "Independent",
        league: team?.league,
        role: m.roleTitle,
        phone: m.contactNumber,
        email: m.emailAddress,
        submittedAt: m.submittedAt,
        status: m.status,
      };
    }),
    ...staffStore.map((s) => ({
      id: s.id,
      registrantId: s.registrationId,
      formattedId: formatRegistrantId(s.registrationId),
      name: s.fullName,
      avatarUrl: s.avatarUrl,
      designation: s.designation,
      isVip: s.isVip,
      type: "STAFF" as const,
      teamId: undefined,
      teamName: "—",
      league: undefined,
      role: s.role,
      phone: s.contactNumber,
      email: s.emailAddress,
      submittedAt: s.submittedAt,
      status: s.status,
    })),
    ...organizersStore.map((o) => ({
      id: o.id,
      registrantId: o.registrationId,
      formattedId: formatRegistrantId(o.registrationId),
      name: o.fullName,
      avatarUrl: o.avatarUrl,
      designation: o.designation,
      isVip: o.isVip,
      type: "ORGANIZER" as const,
      teamId: undefined,
      teamName: "—",
      league: undefined,
      role: o.role,
      phone: o.contactNumber,
      email: o.emailAddress,
      submittedAt: o.submittedAt,
      status: o.status,
    })),
  ];

  return rows.filter((r) => {
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const match =
        r.name.toLowerCase().includes(q) ||
        r.registrantId.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.teamName.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (type && type !== "ALL" && r.type !== type) return false;
    if (league && league !== "ALL" && r.league !== league) return false;
    if (teamId && teamId !== "ALL" && r.teamId !== teamId) return false;
    if (
      memberRole &&
      memberRole !== "ALL" &&
      !r.role.toLowerCase().includes(memberRole.toLowerCase())
    )
      return false;
    if (status && status !== "ALL" && r.status !== status) return false;
    if (from && new Date(r.submittedAt) < new Date(`${from}T00:00:00`))
      return false;
    if (to && new Date(r.submittedAt) > new Date(`${to}T23:59:59`))
      return false;
    return true;
  });
}

/**
 * 21. GET Registration Report Summary
 */
export async function mockGetRegistrationReportSummary(
  filters: ReportFilters = {},
): Promise<RegistrationReportSummary> {
  await simulateDelay(250);
  const filtered = getFilteredCandidateRegistrations(filters);

  const totalSubmissions = filtered.length;
  const approvedCount = filtered.filter((r) => r.status === "APPROVED").length;
  const pendingCount = filtered.filter((r) => r.status === "PENDING").length;
  const rejectedCount = filtered.filter((r) => r.status === "REJECTED").length;

  return {
    totalSubmissions,
    periodChangePct: 12.5,
    approvedCount,
    approvedPct: calculatePercentage(approvedCount, totalSubmissions),
    pendingCount,
    rejectedCount,
    unresolvedPct: calculatePercentage(
      pendingCount + rejectedCount,
      totalSubmissions,
    ),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * 22. GET Registration Report Rows
 */
export async function mockGetRegistrationReportRows(
  filters: ReportFilters = {},
): Promise<PaginatedResult<RegistrationReportRow>> {
  await simulateDelay(350);
  const rows = getFilteredCandidateRegistrations(filters);

  const {
    sortBy = "submittedAt",
    sortOrder = "desc",
    page = 1,
    pageSize = 10,
  } = filters;

  rows.sort((a, b) => {
    if (sortBy === "submittedAt") {
      const diff =
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      return sortOrder === "asc" ? -diff : diff;
    }
    if (sortBy === "name") {
      const cmp = a.name.localeCompare(b.name);
      return sortOrder === "asc" ? cmp : -cmp;
    }
    if (sortBy === "registrantId") {
      const cmp = a.registrantId.localeCompare(b.registrantId);
      return sortOrder === "asc" ? cmp : -cmp;
    }
    if (sortBy === "teamName") {
      const cmp = a.teamName.localeCompare(b.teamName);
      return sortOrder === "asc" ? cmp : -cmp;
    }
    if (sortBy === "status") {
      const cmp = a.status.localeCompare(b.status);
      return sortOrder === "asc" ? cmp : -cmp;
    }
    return 0;
  });

  const total = rows.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const start = (page - 1) * pageSize;
  const paginatedData = rows.slice(start, start + pageSize);

  return {
    data: paginatedData,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}

// Helper: Filter Team report rows
function getFilteredTeamRows(filters: ReportFilters = {}) {
  const { search = "", league, teamId, status } = filters;

  const teams = teamsStore.map((team) => {
    const teamMembers = membersStore.filter((m) => m.teamId === team.id);
    const approvedCount = teamMembers.filter(
      (m) => m.status === "APPROVED",
    ).length;
    const pendingCount = teamMembers.filter(
      (m) => m.status === "PENDING",
    ).length;
    const rejectedCount = teamMembers.filter(
      (m) => m.status === "REJECTED",
    ).length;
    const totalRegistrations = teamMembers.length;
    const rosterCompliance =
      totalRegistrations > 0
        ? Math.round((approvedCount / totalRegistrations) * 1000) / 10
        : 0;
    const isBelowThreshold = rosterCompliance < COMPLIANCE_THRESHOLD;

    return {
      id: team.id,
      teamId: team.id,
      teamCode: team.teamCode,
      name: team.name,
      league: team.league,
      totalRegistrations,
      approvedCount,
      pendingCount,
      rejectedCount,
      teamStatus: team.status,
      rosterCompliance,
      isBelowThreshold,
    };
  });

  return teams.filter((t) => {
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const match =
        t.name.toLowerCase().includes(q) ||
        t.teamCode.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (league && league !== "ALL" && t.league !== league) return false;
    if (teamId && teamId !== "ALL" && t.teamId !== teamId) return false;
    if (status && status !== "ALL" && t.teamStatus !== status) return false;
    return true;
  });
}

/**
 * 23. GET Team-wise Report Summary
 */
export async function mockGetTeamReportSummary(
  filters: ReportFilters = {},
): Promise<TeamReportSummary> {
  await simulateDelay(250);
  const filtered = getFilteredTeamRows(filters);

  const activeTeams = filtered.filter((t) => t.teamStatus === "ACTIVE").length;
  const inactiveTeams = filtered.filter(
    (t) => t.teamStatus === "INACTIVE",
  ).length;

  // KSPL & ISCL breakdown ignore the league filter so divisional benchmarks remain visible
  const allTeams = getFilteredTeamRows({ ...filters, league: undefined });
  const ksplList = allTeams.filter((t) => t.league === "KSPL");
  const isclList = allTeams.filter((t) => t.league === "ISCL");

  const sumStat = (list: TeamReportRow[]) => {
    const totalRegistrations = list.reduce(
      (acc, t) => acc + t.totalRegistrations,
      0,
    );
    const approvedCount = list.reduce((acc, t) => acc + t.approvedCount, 0);
    const pendingCount = list.reduce((acc, t) => acc + t.pendingCount, 0);
    const rejectedCount = list.reduce((acc, t) => acc + t.rejectedCount, 0);
    const approvalRate =
      totalRegistrations > 0
        ? calculatePercentage(approvedCount, totalRegistrations)
        : 0;
    return {
      teamCount: list.length,
      totalRegistrations,
      approvedCount,
      pendingCount,
      rejectedCount,
      approvalRate,
    };
  };

  const totalRegSum = filtered.reduce(
    (acc, t) => acc + t.totalRegistrations,
    0,
  );
  const totalAppSum = filtered.reduce((acc, t) => acc + t.approvedCount, 0);
  const overallCompliance =
    totalRegSum > 0 ? Math.round((totalAppSum / totalRegSum) * 1000) / 10 : 0;

  const belowThresholdCount = filtered.filter((t) => t.isBelowThreshold).length;

  return {
    totalTeams: filtered.length,
    activeTeams,
    inactiveTeams,
    kspl: sumStat(ksplList),
    iscl: sumStat(isclList),
    activeRosters: {
      operationalCount: activeTeams,
      totalCount: filtered.length,
      operationalPct:
        filtered.length > 0
          ? calculatePercentage(activeTeams, filtered.length)
          : 0,
      belowThresholdCount,
    },
    overallCompliance,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * 24. GET Team-wise Report Rows
 */
export async function mockGetTeamReportRows(
  filters: ReportFilters = {},
): Promise<PaginatedResult<TeamReportRow>> {
  await simulateDelay(350);
  const rows = getFilteredTeamRows(filters);

  const {
    sortBy = "teamCode",
    sortOrder = "asc",
    page = 1,
    pageSize = 10,
  } = filters;

  rows.sort((a, b) => {
    if (sortBy === "name") {
      const cmp = a.name.localeCompare(b.name);
      return sortOrder === "asc" ? cmp : -cmp;
    }
    if (sortBy === "totalRegistrations") {
      return sortOrder === "asc"
        ? a.totalRegistrations - b.totalRegistrations
        : b.totalRegistrations - a.totalRegistrations;
    }
    if (sortBy === "approvedCount") {
      return sortOrder === "asc"
        ? a.approvedCount - b.approvedCount
        : b.approvedCount - a.approvedCount;
    }
    if (sortBy === "pendingCount") {
      return sortOrder === "asc"
        ? a.pendingCount - b.pendingCount
        : b.pendingCount - a.pendingCount;
    }
    if (sortBy === "rejectedCount") {
      return sortOrder === "asc"
        ? a.rejectedCount - b.rejectedCount
        : b.rejectedCount - a.rejectedCount;
    }
    if (sortBy === "rosterCompliance") {
      return sortOrder === "asc"
        ? a.rosterCompliance - b.rosterCompliance
        : b.rosterCompliance - a.rosterCompliance;
    }
    const cmp = a.teamCode.localeCompare(b.teamCode);
    return sortOrder === "asc" ? cmp : -cmp;
  });

  const total = rows.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const start = (page - 1) * pageSize;
  const paginatedData = rows.slice(start, start + pageSize);

  return {
    data: paginatedData,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}

// Helper: Filter Staff & Organizer rows
function getFilteredStaffOrganizers(filters: ReportFilters = {}) {
  const { search = "", type, status, from, to } = filters;

  const rows: StaffOrganizerReportRow[] = [
    ...staffStore.map((s) => ({
      id: s.id,
      registrantId: s.registrationId,
      formattedId: formatRegistrantId(s.registrationId),
      name: s.fullName,
      avatarUrl: s.avatarUrl,
      type: "STAFF" as const,
      departmentOrOrg: s.department,
      role: s.role,
      phone: s.contactNumber,
      email: s.emailAddress,
      submittedAt: s.submittedAt,
      status: s.status,
      mealEligible: s.mealEligible,
    })),
    ...organizersStore.map((o) => ({
      id: o.id,
      registrantId: o.registrationId,
      formattedId: formatRegistrantId(o.registrationId),
      name: o.fullName,
      avatarUrl: o.avatarUrl,
      type: "ORGANIZER" as const,
      departmentOrOrg: o.organization,
      role: o.role,
      phone: o.contactNumber,
      email: o.emailAddress,
      submittedAt: o.submittedAt,
      status: o.status,
      mealEligible: o.mealEligible,
    })),
  ];

  return rows.filter((r) => {
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const match =
        r.name.toLowerCase().includes(q) ||
        r.registrantId.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.departmentOrOrg.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (type && type !== "ALL" && r.type !== type) return false;
    if (status && status !== "ALL" && r.status !== status) return false;
    if (from && new Date(r.submittedAt) < new Date(`${from}T00:00:00`))
      return false;
    if (to && new Date(r.submittedAt) > new Date(`${to}T23:59:59`))
      return false;
    return true;
  });
}

/**
 * 25. GET Staff & Organizer Report Summary
 */
export async function mockGetStaffOrganizerReportSummary(
  filters: ReportFilters = {},
): Promise<StaffOrganizerReportSummary> {
  await simulateDelay(250);
  const filtered = getFilteredStaffOrganizers(filters);

  const staffCount = filtered.filter((r) => r.type === "STAFF").length;
  const organizerCount = filtered.filter((r) => r.type === "ORGANIZER").length;
  const passesIssued = filtered.filter((r) => r.status === "APPROVED").length;

  return {
    totalAccreditation: filtered.length,
    staffCount,
    organizerCount,
    passesIssued,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * 26. GET Staff & Organizer Report Rows
 */
export async function mockGetStaffOrganizerReportRows(
  filters: ReportFilters = {},
): Promise<PaginatedResult<StaffOrganizerReportRow>> {
  await simulateDelay(350);
  const rows = getFilteredStaffOrganizers(filters);

  const {
    sortBy = "submittedAt",
    sortOrder = "desc",
    page = 1,
    pageSize = 10,
  } = filters;

  rows.sort((a, b) => {
    if (sortBy === "submittedAt") {
      const diff =
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      return sortOrder === "asc" ? -diff : diff;
    }
    if (sortBy === "name") {
      const cmp = a.name.localeCompare(b.name);
      return sortOrder === "asc" ? cmp : -cmp;
    }
    if (sortBy === "registrantId") {
      const cmp = a.registrantId.localeCompare(b.registrantId);
      return sortOrder === "asc" ? cmp : -cmp;
    }
    return 0;
  });

  const total = rows.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const start = (page - 1) * pageSize;
  const paginatedData = rows.slice(start, start + pageSize);

  return {
    data: paginatedData,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}

// Helper: Filter Meal Eligibility rows
function getFilteredMealEligibilityRows(filters: ReportFilters = {}) {
  const { search = "", league, teamId, type, eligibility, from, to } = filters;

  const rows: MealEligibilityReportRow[] = [
    ...membersStore.map((m) => {
      const team = teamsStore.find((t) => t.id === m.teamId);
      const reason = getMealEligibilityReason({
        status: m.status,
        teamStatus: team?.status,
        hasTeam: true,
      });

      const roleWithDesignation = m.designation
        ? `${m.roleTitle} (${m.designation})`
        : m.roleTitle;

      return {
        id: m.id,
        registrantId: m.registrationId,
        formattedId: formatRegistrantId(m.registrationId),
        name: m.fullName,
        avatarUrl: m.avatarUrl,
        isVip: m.isVip,
        type: "TEAM" as const,
        teamId: m.teamId,
        teamName: team?.name || "Independent",
        role: m.roleTitle,
        roleWithDesignation,
        phone: m.contactNumber,
        email: m.emailAddress,
        approvalStatus: m.status,
        teamStatus: team ? team.status : ("N/A" as const),
        mealAccessReason: reason,
        isEligible: reason === "eligible",
        reasonLabel: MEAL_REASON_META[reason].label,
        submittedAt: m.submittedAt,
        league: team?.league,
      };
    }),
    ...staffStore.map((s) => {
      const reason = getMealEligibilityReason({
        status: s.status,
        hasTeam: false,
        mealEligibleToggle: s.mealEligible,
      });

      const roleWithDesignation = s.designation
        ? `${s.role} (${s.designation})`
        : s.role;

      return {
        id: s.id,
        registrantId: s.registrationId,
        formattedId: formatRegistrantId(s.registrationId),
        name: s.fullName,
        avatarUrl: s.avatarUrl,
        isVip: s.isVip,
        type: "STAFF" as const,
        teamId: undefined,
        teamName: "—",
        role: s.role,
        roleWithDesignation,
        phone: s.contactNumber,
        email: s.emailAddress,
        approvalStatus: s.status,
        teamStatus: "N/A" as const,
        mealAccessReason: reason,
        isEligible: reason === "eligible",
        reasonLabel: MEAL_REASON_META[reason].label,
        submittedAt: s.submittedAt,
        league: undefined,
      };
    }),
    ...organizersStore.map((o) => {
      const reason = getMealEligibilityReason({
        status: o.status,
        hasTeam: false,
        mealEligibleToggle: o.mealEligible,
      });

      const roleWithDesignation = o.designation
        ? `${o.role} (${o.designation})`
        : o.role;

      return {
        id: o.id,
        registrantId: o.registrationId,
        formattedId: formatRegistrantId(o.registrationId),
        name: o.fullName,
        avatarUrl: o.avatarUrl,
        isVip: o.isVip,
        type: "ORGANIZER" as const,
        teamId: undefined,
        teamName: "—",
        role: o.role,
        roleWithDesignation,
        phone: o.contactNumber,
        email: o.emailAddress,
        approvalStatus: o.status,
        teamStatus: "N/A" as const,
        mealAccessReason: reason,
        isEligible: reason === "eligible",
        reasonLabel: MEAL_REASON_META[reason].label,
        submittedAt: o.submittedAt,
        league: undefined,
      };
    }),
  ];

  return rows.filter((r) => {
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const match =
        r.name.toLowerCase().includes(q) ||
        r.registrantId.toLowerCase().includes(q) ||
        r.teamName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (league && league !== "ALL" && r.league !== league) return false;
    if (teamId && teamId !== "ALL" && r.teamId !== teamId) return false;
    if (type && type !== "ALL" && r.type !== type) return false;
    if (
      eligibility &&
      eligibility !== "ALL" &&
      r.mealAccessReason !== eligibility
    )
      return false;
    if (from && new Date(r.submittedAt) < new Date(`${from}T00:00:00`))
      return false;
    if (to && new Date(r.submittedAt) > new Date(`${to}T23:59:59`))
      return false;
    return true;
  });
}

/**
 * 27. GET Meal Eligibility Report Summary
 */
export async function mockGetMealEligibilityReportSummary(
  filters: ReportFilters = {},
): Promise<MealEligibilityReportSummary> {
  await simulateDelay(250);
  // Buckets ignore eligibility filter so category distribution stays intact
  const unfilteredByEligibility = getFilteredMealEligibilityRows({
    ...filters,
    eligibility: undefined,
  });

  const totalPool = unfilteredByEligibility.length;
  const currentlyEligible = unfilteredByEligibility.filter(
    (r) => r.mealAccessReason === "eligible",
  ).length;
  const ineligibleTeamInactive = unfilteredByEligibility.filter(
    (r) => r.mealAccessReason === "team_inactive",
  ).length;
  const ineligibleUnapproved = unfilteredByEligibility.filter(
    (r) => r.mealAccessReason === "unapproved",
  ).length;
  const manuallyDisabled = unfilteredByEligibility.filter(
    (r) => r.mealAccessReason === "access_disabled",
  ).length;

  return {
    totalPool,
    currentlyEligible,
    eligiblePct: calculatePercentage(currentlyEligible, totalPool),
    ineligibleTeamInactive,
    ineligibleUnapproved,
    manuallyDisabled,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * 28. GET Meal Eligibility Report Rows
 */
export async function mockGetMealEligibilityReportRows(
  filters: ReportFilters = {},
): Promise<PaginatedResult<MealEligibilityReportRow>> {
  await simulateDelay(350);
  const rows = getFilteredMealEligibilityRows(filters);

  const {
    sortBy = "registrantId",
    sortOrder = "asc",
    page = 1,
    pageSize = 10,
  } = filters;

  rows.sort((a, b) => {
    if (sortBy === "name") {
      const cmp = a.name.localeCompare(b.name);
      return sortOrder === "asc" ? cmp : -cmp;
    }
    if (sortBy === "approvalStatus") {
      const cmp = a.approvalStatus.localeCompare(b.approvalStatus);
      return sortOrder === "asc" ? cmp : -cmp;
    }
    const cmp = a.registrantId.localeCompare(b.registrantId);
    return sortOrder === "asc" ? cmp : -cmp;
  });

  const total = rows.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const start = (page - 1) * pageSize;
  const paginatedData = rows.slice(start, start + pageSize);

  return {
    data: paginatedData,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}

/**
 * 29. Export Report Audit Logger & Provider
 */
export async function mockExportReport(
  key: ReportKey,
  format: ExportFormat,
  filters: ReportFilters = {},
): Promise<Blob> {
  await simulateDelay(400);

  let rowCount = 0;
  if (key === "registration") {
    rowCount = getFilteredCandidateRegistrations(filters).length;
  } else if (key === "team") {
    rowCount = getFilteredTeamRows(filters).length;
  } else if (key === "staff-organizer") {
    rowCount = getFilteredStaffOrganizers(filters).length;
  } else if (key === "meal-eligibility") {
    rowCount = getFilteredMealEligibilityRows(filters).length;
  }

  auditLogsStore.unshift({
    id: `audit-${Date.now()}`,
    actor: "Alex Morgan",
    action: `EXPORT_${key.toUpperCase()}_${format.toUpperCase()}`,
    targetId: `report-${key}`,
    details: `Exported ${rowCount} records as ${format.toUpperCase()} with filters: ${JSON.stringify(filters)}`,
    timestamp: new Date().toISOString(),
  });

  return new Blob([`Report export for ${key} (${rowCount} records)`], {
    type:
      format === "csv"
        ? "text/csv"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * 30. Batch Print Catering Tokens (Cap: 500)
 */
export async function mockBatchPrintCateringTokens(
  filters: ReportFilters = {},
): Promise<{ printedCount: number; message: string; pdfUrl: string }> {
  await simulateDelay(600);

  const eligibleRows = getFilteredMealEligibilityRows(filters).filter(
    (r) => r.isEligible,
  );
  const cappedCount = Math.min(eligibleRows.length, 500);

  auditLogsStore.unshift({
    id: `audit-${Date.now()}`,
    actor: "Alex Morgan",
    action: "BATCH_PRINT_CATERING_TOKENS",
    targetId: "meal-eligibility-batch",
    details: `Generated printable batch token dossier for ${cappedCount} eligible attendees.`,
    timestamp: new Date().toISOString(),
  });

  return {
    printedCount: cappedCount,
    message: `Batch catering voucher manifest generated for ${cappedCount} verified registrants.`,
    pdfUrl: `/assets/docs/Batch_Tokens_${Date.now()}.pdf`,
  };
}

/**
 * ============================================================================
 * USER & ROLE MANAGEMENT MOCK HANDLERS
 * ============================================================================
 */

function recomputeRoleCounts() {
  rolesStore.forEach((role) => {
    const assigned = usersStore.filter((u) => u.roleId === role.id);
    role.assignedUserCount = assigned.length;
    role.assignedUsersPreview = assigned.slice(0, 3).map((u) => {
      const parts = u.name.trim().split(" ");
      const initials =
        parts.length > 1
          ? `${parts[0]?.[0] || ""}${parts[parts.length - 1]?.[0] || ""}`.toUpperCase()
          : u.name.slice(0, 2).toUpperCase();
      return {
        id: u.id,
        name: u.name,
        initials,
        avatarUrl: u.avatarUrl,
      };
    });
  });
}

function getNextRoleCode(): string {
  const maxNum = rolesStore.reduce((acc, r) => {
    const match = r.code.match(/ROLE-(\d+)/);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      return Math.max(acc, num);
    }
    return acc;
  }, 0);
  const nextNum = maxNum + 1;
  return `ROLE-${String(nextNum).padStart(3, "0")}`;
}

export function mockGetActingUser(): User {
  const user = usersStore.find((u) => u.id === actingUserId) || usersStore[0]!;
  return { ...user, isCurrentUser: true };
}

export function mockGetActingRole(): Role {
  const user = mockGetActingUser();
  return rolesStore.find((r) => r.id === user.roleId) || rolesStore[0]!;
}

export async function mockSetActingUser(userId: string): Promise<User> {
  const user = usersStore.find((u) => u.id === userId);
  if (!user) throw new Error("User not found.");
  actingUserId = user.id;
  return { ...user, isCurrentUser: true };
}

export async function mockGetCurrentUserPermissions(): Promise<{
  user: User;
  role: Role;
  permissions: Record<ModuleKey, PermissionAction[]>;
}> {
  await simulateDelay(150);
  const user = mockGetActingUser();
  const role = mockGetActingRole();
  return {
    user,
    role,
    permissions: role.permissions,
  };
}

/**
 * 30. GET Users List
 */
export async function mockGetUsers(
  params: UserListParams = {},
): Promise<UserListResponse> {
  await simulateDelay(350);
  recomputeRoleCounts();

  const {
    page = 1,
    pageSize = 6,
    search = "",
    roleId,
    status,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  let filtered = usersStore.map((u) => ({
    ...u,
    isCurrentUser: u.id === actingUserId,
  }));

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.contact.includes(q) ||
        u.roleName.toLowerCase().includes(q),
    );
  }

  if (roleId && roleId !== "ALL") {
    filtered = filtered.filter((u) => u.roleId === roleId);
  }

  if (status && status !== "ALL") {
    filtered = filtered.filter((u) => u.status === status);
  }

  filtered.sort((a, b) => {
    if (sortBy === "name") {
      const cmp = a.name.localeCompare(b.name);
      return sortOrder === "asc" ? cmp : -cmp;
    }
    if (sortBy === "email") {
      const cmp = a.email.localeCompare(b.email);
      return sortOrder === "asc" ? cmp : -cmp;
    }
    if (sortBy === "role") {
      const cmp = a.roleName.localeCompare(b.roleName);
      return sortOrder === "asc" ? cmp : -cmp;
    }
    if (sortBy === "status") {
      const cmp = a.status.localeCompare(b.status);
      return sortOrder === "asc" ? cmp : -cmp;
    }
    const da = new Date(a.createdAt).getTime();
    const db = new Date(b.createdAt).getTime();
    return sortOrder === "asc" ? da - db : db - da;
  });

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  const activeCount = usersStore.filter((u) => u.status === "active").length;
  const inactiveCount = usersStore.filter(
    (u) => u.status === "inactive",
  ).length;
  const activeRoleCount = rolesStore.filter(
    (r) => r.status === "active" && usersStore.some((u) => u.roleId === r.id),
  ).length;

  return {
    items,
    total,
    stats: {
      total: usersStore.length,
      active: activeCount,
      inactive: inactiveCount,
      activeRoleCount,
    },
  };
}

/**
 * 31. GET User By ID
 */
export async function mockGetUserById(id: string): Promise<User> {
  await simulateDelay(250);
  const user = usersStore.find((u) => u.id === id);
  if (!user) throw new Error("User not found.");
  return { ...user, isCurrentUser: user.id === actingUserId };
}

/**
 * 32. CREATE User
 */
export async function mockCreateUser(
  payload: CreateUserPayload,
): Promise<User> {
  await simulateDelay(400);

  const emailLower = payload.email.trim().toLowerCase();
  if (usersStore.some((u) => u.email.toLowerCase() === emailLower)) {
    throw new Error("A user with this email already exists.");
  }

  const cleanContact = payload.contact.replace(/[\s\-()]/g, "");
  if (
    usersStore.some((u) => u.contact.replace(/[\s\-()]/g, "") === cleanContact)
  ) {
    throw new Error("A user with this contact number already exists.");
  }

  const role = rolesStore.find((r) => r.id === payload.roleId);
  if (!role) throw new Error("Selected role does not exist.");
  if (role.status === "inactive")
    throw new Error("Inactive roles cannot be assigned to users.");

  const now = new Date().toISOString();
  const newUser: User = {
    id: `usr-${Date.now().toString().slice(-4)}`,
    name: payload.name.trim(),
    email: payload.email.trim(),
    contact: payload.contact.trim(),
    roleId: role.id,
    roleName: role.name,
    roleCode: role.code,
    status: "active",
    mustChangePassword: true,
    createdAt: now,
    updatedAt: now,
  };

  usersStore.unshift(newUser);
  recomputeRoleCounts();

  auditLogsStore.unshift({
    id: `audit-${Date.now()}`,
    actor: mockGetActingUser().name,
    action: "user_created",
    entityType: "USER",
    entityId: newUser.id,
    details: `Created user ${newUser.name} with role ${role.name}.`,
    timestamp: now,
  });

  return newUser;
}

/**
 * 33. UPDATE User
 */
export async function mockUpdateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<User> {
  await simulateDelay(400);
  const user = usersStore.find((u) => u.id === id);
  if (!user) throw new Error("User not found.");

  if (payload.roleId !== user.roleId) {
    if (user.id === actingUserId) {
      throw new Error("You cannot change your own role.");
    }

    const currentRole = rolesStore.find((r) => r.id === user.roleId);
    if (currentRole?.tier === "superadmin" && user.status === "active") {
      const activeSuperadmins = usersStore.filter(
        (u) =>
          u.status === "active" &&
          rolesStore.find((r) => r.id === u.roleId)?.tier === "superadmin",
      );
      if (activeSuperadmins.length <= 1) {
        throw new Error(
          "Cannot reassign role: at least one active Superadmin user must be maintained.",
        );
      }
    }
  }

  const role = rolesStore.find((r) => r.id === payload.roleId);
  if (!role) throw new Error("Selected role does not exist.");
  if (role.status === "inactive" && payload.roleId !== user.roleId) {
    throw new Error("Cannot assign an inactive role.");
  }

  const cleanContact = payload.contact.replace(/[\s\-()]/g, "");
  if (
    usersStore.some(
      (u) => u.id !== id && u.contact.replace(/[\s\-()]/g, "") === cleanContact,
    )
  ) {
    throw new Error("A user with this contact number already exists.");
  }

  user.name = payload.name.trim();
  user.contact = payload.contact.trim();
  user.roleId = role.id;
  user.roleName = role.name;
  user.roleCode = role.code;
  if (payload.status) user.status = payload.status;
  user.updatedAt = new Date().toISOString();

  recomputeRoleCounts();

  auditLogsStore.unshift({
    id: `audit-${Date.now()}`,
    actor: mockGetActingUser().name,
    action: "user_updated",
    entityType: "USER",
    entityId: user.id,
    details: `Updated user profile and role assignment for ${user.name}.`,
    timestamp: new Date().toISOString(),
  });

  return { ...user, isCurrentUser: user.id === actingUserId };
}

/**
 * 34. SET User Status (Activate / Deactivate)
 */
export async function mockSetUserStatus(
  id: string,
  status: "active" | "inactive",
  notes?: string,
): Promise<User> {
  await simulateDelay(400);
  const user = usersStore.find((u) => u.id === id);
  if (!user) throw new Error("User not found.");

  if (status === "inactive") {
    if (user.id === actingUserId) {
      throw new Error("You cannot deactivate your own account.");
    }

    const currentRole = rolesStore.find((r) => r.id === user.roleId);
    if (currentRole?.tier === "superadmin") {
      const activeSuperadmins = usersStore.filter(
        (u) =>
          u.status === "active" &&
          rolesStore.find((r) => r.id === u.roleId)?.tier === "superadmin",
      );
      if (activeSuperadmins.length <= 1) {
        throw new Error(
          "Cannot deactivate account: at least one active Superadmin user must be maintained.",
        );
      }
    }
  }

  user.status = status;
  user.updatedAt = new Date().toISOString();
  recomputeRoleCounts();

  auditLogsStore.unshift({
    id: `audit-${Date.now()}`,
    actor: mockGetActingUser().name,
    action: status === "active" ? "user_activated" : "user_deactivated",
    entityType: "USER",
    entityId: user.id,
    details: `${status === "active" ? "Activated" : "Deactivated"} user ${user.name}. Notes: ${notes || "None"}`,
    timestamp: new Date().toISOString(),
  });

  return { ...user, isCurrentUser: user.id === actingUserId };
}

/**
 * 35. SEND Password Reset Link
 */
export async function mockSendPasswordReset(
  id: string,
): Promise<{ success: boolean; message: string }> {
  await simulateDelay(350);
  const user = usersStore.find((u) => u.id === id);
  if (!user) throw new Error("User not found.");

  auditLogsStore.unshift({
    id: `audit-${Date.now()}`,
    actor: mockGetActingUser().name,
    action: "password_reset_sent",
    entityType: "USER",
    entityId: user.id,
    details: `Password reset dispatched to ${user.email}.`,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    message: `Password reset instructions dispatched to ${user.email}.`,
  };
}

/**
 * 36. RESEND Temporary Credentials
 */
export async function mockResendCredentials(
  id: string,
): Promise<{ success: boolean; message: string }> {
  await simulateDelay(350);
  const user = usersStore.find((u) => u.id === id);
  if (!user) throw new Error("User not found.");

  auditLogsStore.unshift({
    id: `audit-${Date.now()}`,
    actor: mockGetActingUser().name,
    action: "credentials_resent",
    entityType: "USER",
    entityId: user.id,
    details: `Resent credentials invite to ${user.email}.`,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    message: `Temporary credentials invite resent to ${user.email}.`,
  };
}

/**
 * 37. GET Roles List
 */
export async function mockGetRoles(
  params: RoleListParams = {},
): Promise<RoleListResponse> {
  await simulateDelay(300);
  recomputeRoleCounts();

  const { search = "", sortBy = "code", sortOrder = "asc" } = params;

  let filtered = [...rolesStore];

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }

  filtered.sort((a, b) => {
    if (sortBy === "name") {
      const cmp = a.name.localeCompare(b.name);
      return sortOrder === "asc" ? cmp : -cmp;
    }
    if (sortBy === "assignedUserCount") {
      return sortOrder === "asc"
        ? a.assignedUserCount - b.assignedUserCount
        : b.assignedUserCount - a.assignedUserCount;
    }
    if (sortBy === "status") {
      const cmp = a.status.localeCompare(b.status);
      return sortOrder === "asc" ? cmp : -cmp;
    }
    const cmp = a.code.localeCompare(b.code);
    return sortOrder === "asc" ? cmp : -cmp;
  });

  const systemCount = rolesStore.filter((r) => r.isSystem).length;
  const customCount = rolesStore.filter((r) => !r.isSystem).length;
  const superadminTierCount = rolesStore.filter(
    (r) => r.tier === "superadmin",
  ).length;
  const delegatedCount = rolesStore.filter(
    (r) => r.tier === "delegated",
  ).length;
  const delegatedActiveOperators = usersStore.filter(
    (u) =>
      u.status === "active" &&
      rolesStore.find((r) => r.id === u.roleId)?.tier === "delegated",
  ).length;

  return {
    items: filtered,
    total: filtered.length,
    stats: {
      total: rolesStore.length,
      system: systemCount,
      custom: customCount,
      superadminTier: superadminTierCount,
      delegated: delegatedCount,
      delegatedActiveOperators,
      moduleCount: MODULES.length,
    },
  };
}

/**
 * 38. GET Role By ID
 */
export async function mockGetRoleById(id: string): Promise<Role> {
  await simulateDelay(200);
  recomputeRoleCounts();
  const role = rolesStore.find((r) => r.id === id);
  if (!role) throw new Error("Role not found.");
  return role;
}

/**
 * 39. CREATE Role
 */
export async function mockCreateRole(
  payload: CreateRolePayload,
): Promise<Role> {
  await simulateDelay(400);

  const nameTrim = payload.name.trim();
  if (rolesStore.some((r) => r.name.toLowerCase() === nameTrim.toLowerCase())) {
    throw new Error("A role with this name already exists.");
  }

  const now = new Date().toISOString();
  const newRole: Role = {
    id: `role-${Date.now().toString().slice(-4)}`,
    code: getNextRoleCode(),
    name: nameTrim,
    description: payload.description?.trim() || "",
    tier: "delegated",
    isSystem: false,
    status: "active",
    permissions: payload.permissions,
    assignedUserCount: 0,
    assignedUsersPreview: [],
    createdAt: now,
    updatedAt: now,
    updatedBy: mockGetActingUser().name,
  };

  rolesStore.push(newRole);

  auditLogsStore.unshift({
    id: `audit-${Date.now()}`,
    actor: mockGetActingUser().name,
    action: "role_created",
    entityType: "ROLE",
    entityId: newRole.id,
    details: `Created role ${newRole.name} (${newRole.code}).`,
    timestamp: now,
  });

  return newRole;
}

/**
 * 40. UPDATE Role
 */
export async function mockUpdateRole(
  id: string,
  payload: UpdateRolePayload,
): Promise<Role> {
  await simulateDelay(400);
  const role = rolesStore.find((r) => r.id === id);
  if (!role) throw new Error("Role not found.");

  if (role.isSystem) {
    throw new Error("System role is locked and cannot be edited.");
  }

  const nameTrim = payload.name.trim();
  if (
    rolesStore.some(
      (r) => r.id !== id && r.name.toLowerCase() === nameTrim.toLowerCase(),
    )
  ) {
    throw new Error("A role with this name already exists.");
  }

  role.name = nameTrim;
  role.description = payload.description?.trim() || "";
  role.permissions = payload.permissions;
  if (payload.status) role.status = payload.status;
  role.updatedAt = new Date().toISOString();
  role.updatedBy = mockGetActingUser().name;

  // Sync users that hold this role with updated roleName
  usersStore.forEach((u) => {
    if (u.roleId === id) {
      u.roleName = role.name;
    }
  });

  recomputeRoleCounts();

  auditLogsStore.unshift({
    id: `audit-${Date.now()}`,
    actor: mockGetActingUser().name,
    action: "role_updated",
    entityType: "ROLE",
    entityId: role.id,
    details: `Updated permissions and profile for role ${role.name}.`,
    timestamp: new Date().toISOString(),
  });

  return role;
}

/**
 * 41. DUPLICATE Role
 */
export async function mockDuplicateRole(id: string): Promise<Role> {
  await simulateDelay(400);
  const target = rolesStore.find((r) => r.id === id);
  if (!target) throw new Error("Source role not found.");

  const now = new Date().toISOString();
  let candidateName = `${target.name} (Copy)`;
  let copyIndex = 2;
  while (
    rolesStore.some((r) => r.name.toLowerCase() === candidateName.toLowerCase())
  ) {
    candidateName = `${target.name} (Copy ${copyIndex})`;
    copyIndex++;
  }

  const newRole: Role = {
    id: `role-${Date.now().toString().slice(-4)}`,
    code: getNextRoleCode(),
    name: candidateName,
    description: target.description,
    tier: "delegated",
    isSystem: false,
    status: "active",
    permissions: JSON.parse(JSON.stringify(target.permissions)),
    assignedUserCount: 0,
    assignedUsersPreview: [],
    createdAt: now,
    updatedAt: now,
    updatedBy: mockGetActingUser().name,
  };

  rolesStore.push(newRole);

  auditLogsStore.unshift({
    id: `audit-${Date.now()}`,
    actor: mockGetActingUser().name,
    action: "role_created",
    entityType: "ROLE",
    entityId: newRole.id,
    details: `Duplicated role ${target.name} into ${newRole.name} (${newRole.code}).`,
    timestamp: now,
  });

  return newRole;
}

/**
 * 42. SET Role Status (Activate / Deactivate)
 */
export async function mockSetRoleStatus(
  id: string,
  status: "active" | "inactive",
): Promise<Role> {
  await simulateDelay(400);
  const role = rolesStore.find((r) => r.id === id);
  if (!role) throw new Error("Role not found.");

  if (role.isSystem) {
    throw new Error("System role is locked and cannot be deactivated.");
  }

  if (status === "inactive") {
    const activeAssignedUsers = usersStore.filter(
      (u) => u.roleId === id && u.status === "active",
    );
    if (activeAssignedUsers.length > 0) {
      throw new Error(
        `Cannot deactivate role while ${activeAssignedUsers.length} active ${activeAssignedUsers.length === 1 ? "user is" : "users are"} assigned. Reassign users first.`,
      );
    }
  }

  role.status = status;
  role.updatedAt = new Date().toISOString();
  role.updatedBy = mockGetActingUser().name;

  auditLogsStore.unshift({
    id: `audit-${Date.now()}`,
    actor: mockGetActingUser().name,
    action: "role_status_changed",
    entityType: "ROLE",
    entityId: role.id,
    details: `${status === "active" ? "Activated" : "Deactivated"} role ${role.name}.`,
    timestamp: new Date().toISOString(),
  });

  return role;
}

/**
 * 43. DELETE Role
 */
export async function mockDeleteRole(
  id: string,
): Promise<{ success: boolean; message: string }> {
  await simulateDelay(400);
  const roleIndex = rolesStore.findIndex((r) => r.id === id);
  if (roleIndex === -1) throw new Error("Role not found.");

  const role = rolesStore[roleIndex]!;
  if (role.isSystem) {
    throw new Error("System role is locked and cannot be deleted.");
  }

  const assignedUsers = usersStore.filter((u) => u.roleId === id);
  if (assignedUsers.length > 0) {
    throw new Error(
      `Cannot delete role: ${assignedUsers.length} ${assignedUsers.length === 1 ? "user is" : "users are"} currently assigned. Reassign users first.`,
    );
  }

  const deletedName = role.name;
  rolesStore.splice(roleIndex, 1);

  auditLogsStore.unshift({
    id: `audit-${Date.now()}`,
    actor: mockGetActingUser().name,
    action: "role_deleted",
    entityType: "ROLE",
    entityId: id,
    details: `Deleted custom role ${deletedName}.`,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    message: `Role ${deletedName} deleted successfully.`,
  };
}

// ============================================================================
// PUBLIC MEAL REGISTRATION MOCK HANDLERS
// ============================================================================

const seenIdempotencyKeys = new Map<string, PublicRegistrationResult>();

/**
 * Public endpoint: get public registration configuration
 */
export async function mockGetPublicConfig(): Promise<PublicRegistrationConfig> {
  await simulateDelay(200);
  return { ...DEFAULT_PUBLIC_CONFIG };
}

/**
 * Public endpoint: get active teams for selected league (no private stats/counts)
 */
export async function mockGetPublicTeams(
  league?: League,
): Promise<PublicTeamOption[]> {
  await simulateDelay(250);
  return teamsStore
    .filter((t) => {
      const matchesLeague = !league || t.league === league;
      return matchesLeague && t.status === "ACTIVE";
    })
    .map((t) => ({
      id: t.id,
      teamCode: t.teamCode,
      name: t.name,
      league: t.league,
      full: t.registrationsTotal >= t.maxCap,
    }));
}

/**
 * Public endpoint: submit meal registration application
 */
export async function mockSubmitPublicRegistration(
  payload: PublicRegistrationPayload,
  idempotencyKey?: string,
): Promise<PublicRegistrationResult> {
  await simulateDelay(600);

  // 1. Idempotency check: if already processed, return stored result
  if (idempotencyKey && seenIdempotencyKeys.has(idempotencyKey)) {
    return seenIdempotencyKeys.get(idempotencyKey)!;
  }

  // 2. Honeypot abuse trap: silently return mock success for automated bots
  if (payload.honeypot && payload.honeypot.trim().length > 0) {
    return {
      applicationId: `REG-BOT-${Date.now().toString().slice(-4)}`,
      submittedAt: new Date().toISOString(),
      fullName: payload.fullName,
      teamName: "Registration Review",
      maskedEmail: maskEmail(payload.emailAddress),
    };
  }

  // 3. Verify Registration Window is open
  if (!DEFAULT_PUBLIC_CONFIG.open) {
    const err = new Error(
      "Registration window is currently closed for the season.",
    );
    (err as unknown as { status: number; code: string }).status = 403;
    (err as unknown as { status: number; code: string }).code =
      "REGISTRATION_CLOSED";
    throw err;
  }

  // 4. Validate Team Assignment
  const team = teamsStore.find((t) => t.id === payload.teamId);
  if (!team || team.status !== "ACTIVE") {
    const err = new Error(
      "Selected team is not active for tournament registration.",
    );
    (err as unknown as { status: number; code: string }).status = 422;
    (err as unknown as { status: number; code: string }).code = "TEAM_INACTIVE";
    throw err;
  }

  // 5. Verify Team Capacity
  if (team.registrationsTotal >= team.maxCap) {
    const err = new Error(
      `Roster for ${team.name} has reached maximum capacity (${team.maxCap} max).`,
    );
    (err as unknown as { status: number; code: string }).status = 409;
    (err as unknown as { status: number; code: string }).code = "TEAM_FULL";
    throw err;
  }

  // 6. Duplicate Registration Check across phone and email
  const cleanPhone = payload.contactNumber.replace(/[\s\-()]/g, "");
  const cleanEmail = payload.emailAddress.trim().toLowerCase();

  const isDuplicate = membersStore.some((m) => {
    const mPhone = m.contactNumber.replace(/[\s\-()]/g, "");
    const mEmail = m.emailAddress.trim().toLowerCase();
    return mPhone === cleanPhone || mEmail === cleanEmail;
  });

  if (isDuplicate) {
    const err = new Error(
      "A registration with these details already exists. Check your email for its status.",
    );
    (err as unknown as { status: number; code: string }).status = 409;
    (err as unknown as { status: number; code: string }).code =
      "DUPLICATE_REGISTRATION";
    throw err;
  }

  // 7. Generate Sequential Application ID: REG-[TEAM_CODE]-[INDEX]
  const teamCodeSuffix =
    team.code
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 3) || "CK";
  const nextIndex = (membersStore.length + 101).toString();
  const applicationId = `REG-${teamCodeSuffix}-${nextIndex}`;
  const now = new Date().toISOString();

  // 8. Create RawMember in shared membersStore (status: PENDING)
  const newMember: RawMember = {
    id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    registrationId: applicationId,
    teamId: team.id,
    fullName: payload.fullName.trim(),
    avatarUrl: payload.photo.dataUrl,
    memberType: payload.registrantType,
    registrantType: "TEAM",
    roleTitle:
      payload.registrantType.charAt(0) +
      payload.registrantType.slice(1).toLowerCase(),
    contactNumber: payload.contactNumber,
    emailAddress: cleanEmail,
    status: "PENDING",
    submittedAt: now,
    mealPreference: payload.mealPreference === "VEG" ? "Veg" : "Non-veg",
    dateOfBirth: payload.dateOfBirth,
    division: team.league === "KSPL" ? "Premier Division" : "National Division",
    isVip: false,
    photo: {
      previewUrl: payload.photo.dataUrl,
      fileName: payload.photo.fileName,
      fileSize: `${(payload.photo.fileSize / (1024 * 1024)).toFixed(1)} MB`,
      dimensions: payload.photo.dimensions,
    },
  };

  membersStore.unshift(newMember);

  // 9. Update team counts in shared teamsStore
  team.registrationsTotal += 1;
  team.pendingCount += 1;
  team.updatedAt = now;
  team.updatedBy = "public registration";

  // 10. Record Audit Log Entry
  auditLogsStore.unshift({
    id: `audit-${Date.now()}`,
    actor: "public form",
    action: "submitted",
    entityType: "REGISTRANT",
    entityId: newMember.id,
    details: `New registration application ${applicationId} submitted for ${newMember.fullName} (${team.name}).`,
    timestamp: now,
  });

  const result: PublicRegistrationResult = {
    applicationId,
    submittedAt: now,
    fullName: newMember.fullName,
    teamName: team.name,
    maskedEmail: maskEmail(cleanEmail),
  };

  if (idempotencyKey) {
    seenIdempotencyKeys.set(idempotencyKey, result);
  }

  return result;
}
