import { axiosInstance } from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { formatDateTimeIST } from "@/utils/formatDate";
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
  League,
  TeamStatsSummary,
} from "@/types/team.types";
import type {
  PaginatedResult,
  TableQueryParams,
  RegistrationStatus,
  MemberType,
} from "@/types/common.types";

interface BackendTeamItemDto {
  id: string;
  code: string;
  name: string;
  league: "KSPL" | "ISCL";
  maxRosterCap: number;
  franchiseCode?: string | null;
  isActive: boolean;
  deactivationReason?: string | null;
  deactivationNotes?: string | null;
  totalRegistrations: number;
  approvedMembers: number;
  pendingMembers: number;
  rejectedMembers: number;
  updatedAt: string;
  updatedBy?: { id: string; name: string } | null;
}

interface BackendTeamListPageDto {
  summary: {
    totalTeams: number;
    ksplTeams: number;
    isclTeams: number;
  };
  data: BackendTeamItemDto[];
  page: number;
  pageSize: number;
  total: number;
}

interface BackendTeamRosterResponseDto {
  team: {
    id: string;
    code: string;
    name: string;
    league: "KSPL" | "ISCL";
    franchiseCode?: string | null;
    isActive: boolean;
  };
  metrics: {
    total: number;
    maxCap: number;
    approved: number;
    pending: number;
    rejected: number;
    rosterPercentage: number;
  };
  roleCounts: {
    all: number;
    player: number;
    owner: number;
    coach: number;
    others: number;
  };
  data: Array<{
    id: string;
    registrantCode?: string | null;
    fullName: string;
    type: string;
    memberType?: string | null;
    contactNumber: string;
    email: string;
    mealPreference: string;
    status: string;
    isMealEligible: boolean;
    createdAt: string;
  }>;
  page: number;
  pageSize: number;
  total: number;
}

interface BackendTeamRecordDto {
  id: string;
  code: string;
  name: string;
  league: "KSPL" | "ISCL";
  maxRosterCap: number;
  franchiseCode?: string | null;
  isActive: boolean;
  updatedAt: string;
  updatedBy?: { id: string; name: string } | null;
}

function mapBackendTeamToTeam(
  dto: BackendTeamItemDto | BackendTeamRecordDto,
): Team {
  const isItem = "totalRegistrations" in dto;
  const initials = dto.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    id: dto.id,
    teamCode: dto.code,
    name: dto.name,
    league: dto.league as League,
    status: dto.isActive ? "ACTIVE" : "INACTIVE",
    licensed: true,
    registrationsTotal: isItem
      ? (dto as BackendTeamItemDto).totalRegistrations
      : 0,
    approvedCount: isItem ? (dto as BackendTeamItemDto).approvedMembers : 0,
    pendingCount: isItem ? (dto as BackendTeamItemDto).pendingMembers : 0,
    rejectedCount: isItem ? (dto as BackendTeamItemDto).rejectedMembers : 0,
    createdAt: dto.updatedAt,
    updatedAt: dto.updatedAt,
    updatedBy: dto.updatedBy?.name || "Event Admin",
    initials,
  };
}

export const teamsApi = {
  /**
   * Manage Teams Page list & stats
   */
  getTeams: async (params?: TeamListParams): Promise<TeamListResponse> => {
    const queryParams: Record<string, unknown> = {
      page: params?.page || 1,
      pageSize: params?.pageSize || 20,
    };
    if (params?.search && params.search.trim()) {
      queryParams.search = params.search.trim();
    }
    if (params?.league && params.league !== "ALL" && params.league.trim()) {
      queryParams.league = params.league.trim();
    }
    if (params?.status && params.status !== "ALL" && params.status.trim()) {
      const s = params.status.trim().toLowerCase();
      if (s === "active" || s === "inactive") {
        queryParams.status = s;
      }
    }

    const response = await axiosInstance.get<BackendTeamListPageDto>(
      ENDPOINTS.TEAMS.LIST,
      { params: queryParams },
    );

    const items = response.data.data.map(mapBackendTeamToTeam);

    const stats: TeamStatsSummary = {
      total: response.data.summary.totalTeams,
      kspl: response.data.summary.ksplTeams,
      iscl: response.data.summary.isclTeams,
      active: response.data.data.filter((t) => t.isActive).length,
      inactive: response.data.data.filter((t) => !t.isActive).length,
    };

    return {
      items,
      total: response.data.total,
      stats,
    };
  },

  /**
   * Get team details and roster metrics
   */
  getTeamById: async (teamId: string): Promise<TeamDetail> => {
    const response = await axiosInstance.get<BackendTeamRosterResponseDto>(
      ENDPOINTS.REGISTRATIONS.TEAM_ROSTER(teamId),
    );

    const { team, metrics, roleCounts } = response.data;
    const rejectedPct =
      metrics.total > 0
        ? Math.round((metrics.rejected / metrics.total) * 100)
        : 0;

    return {
      id: team.id,
      name: team.name,
      code: team.code,
      league: team.league as League,
      franchiseId: team.franchiseCode || team.code,
      teamCode: team.code,
      status: team.isActive ? "ACTIVE" : "INACTIVE",
      licensed: true,
      stats: {
        total: metrics.total,
        maxCap: metrics.maxCap,
        approved: metrics.approved,
        approvedPercentage: metrics.rosterPercentage,
        pending: metrics.pending,
        rejected: metrics.rejected,
        rejectedPercentage: rejectedPct,
      },
      memberCountsByType: {
        ALL: roleCounts.all,
        PLAYER: roleCounts.player,
        OWNER: roleCounts.owner,
        COACH: roleCounts.coach,
        OTHERS: roleCounts.others,
      },
    };
  },

  getDetail: async (teamId: string): Promise<TeamDetail> => {
    return teamsApi.getTeamById(teamId);
  },

  /**
   * Get team members roster
   */
  getMembers: async (
    teamId: string,
    params?: TableQueryParams,
  ): Promise<PaginatedResult<TeamMemberRow>> => {
    const queryParams: Record<string, unknown> = {
      page: params?.page || 1,
      pageSize: params?.pageSize || 20,
    };
    if (params?.search && params.search.trim()) {
      queryParams.search = params.search.trim();
    }
    if (params?.status && params.status !== "ALL" && params.status.trim()) {
      queryParams.status = params.status.trim();
    }
    if (
      params?.memberType &&
      params.memberType !== "ALL" &&
      params.memberType.trim()
    ) {
      queryParams.memberType = params.memberType.trim();
    }

    const response = await axiosInstance.get<BackendTeamRosterResponseDto>(
      ENDPOINTS.REGISTRATIONS.TEAM_ROSTER(teamId),
      { params: queryParams },
    );

    const members: TeamMemberRow[] = response.data.data.map((item) => ({
      id: item.id,
      registrationId:
        item.registrantCode || `REG-TM-${item.id.slice(0, 4).toUpperCase()}`,
      name: item.fullName,
      memberType: (item.memberType || "PLAYER") as MemberType,
      contact: item.contactNumber,
      email: item.email,
      submittedAt: formatDateTimeIST(item.createdAt),
      status: item.status as RegistrationStatus,
      mealEligible: Boolean(item.isMealEligible),
    }));

    return {
      data: members,
      pagination: {
        page: response.data.page,
        pageSize: response.data.pageSize,
        total: response.data.total,
        totalPages: Math.ceil(
          response.data.total / (response.data.pageSize || 20),
        ),
      },
    };
  },

  /**
   * Create a new team
   */
  createTeam: async (payload: CreateTeamPayload): Promise<Team> => {
    const response = await axiosInstance.post<BackendTeamRecordDto>(
      ENDPOINTS.TEAMS.CREATE,
      {
        name: payload.name,
        league: payload.league,
      },
    );
    return mapBackendTeamToTeam(response.data);
  },

  /**
   * Update team info
   */
  updateTeam: async (
    teamId: string,
    payload: UpdateTeamPayload,
  ): Promise<Team> => {
    const response = await axiosInstance.patch<BackendTeamRecordDto>(
      ENDPOINTS.TEAMS.UPDATE(teamId),
      {
        name: payload.name,
        league: payload.league,
      },
    );
    return mapBackendTeamToTeam(response.data);
  },

  /**
   * Deactivate a team
   * Backend requires isActive: false, reason: enum, and optional notes
   */
  deactivateTeam: async (
    teamId: string,
    payload: DeactivateTeamPayload,
  ): Promise<Team> => {
    const reasonMap: Record<
      string,
      | "TEAM_WITHDRAWN"
      | "SEASON_ENDED"
      | "ADMINISTRATIVE"
      | "DUPLICATE"
      | "OTHER"
    > = {
      "Franchise withdrawn": "TEAM_WITHDRAWN",
      TEAM_WITHDRAWN: "TEAM_WITHDRAWN",
      "Season ended": "SEASON_ENDED",
      SEASON_ENDED: "SEASON_ENDED",
      "Compliance review": "ADMINISTRATIVE",
      "Payment/licensing issue": "ADMINISTRATIVE",
      ADMINISTRATIVE: "ADMINISTRATIVE",
      "Duplicate team": "DUPLICATE",
      DUPLICATE: "DUPLICATE",
      Other: "OTHER",
      OTHER: "OTHER",
    };

    const backendReason = reasonMap[payload.reason] || "ADMINISTRATIVE";

    const body: { isActive: false; reason: string; notes?: string } = {
      isActive: false,
      reason: backendReason,
    };
    if (payload.notes && payload.notes.trim()) {
      body.notes = payload.notes.trim();
    }

    const response = await axiosInstance.post<BackendTeamRecordDto>(
      ENDPOINTS.TEAMS.ACTIVATION(teamId),
      body,
    );
    return mapBackendTeamToTeam(response.data);
  },

  /**
   * Reactivate a deactivated team
   * Backend spec: Those fields (reason, notes) are cleared when the team is activated again,
   * and sending them with isActive true is rejected.
   */
  reactivateTeam: async (
    teamId: string,
    _payload?: ReactivateTeamPayload,
  ): Promise<Team> => {
    const response = await axiosInstance.post<BackendTeamRecordDto>(
      ENDPOINTS.TEAMS.ACTIVATION(teamId),
      {
        isActive: true,
      },
    );
    return mapBackendTeamToTeam(response.data);
  },

  /**
   * Toggle team active/inactive status
   */
  toggleStatus: async (
    teamId: string,
  ): Promise<{ id: string; status: "ACTIVE" | "INACTIVE" }> => {
    const detail = await teamsApi.getTeamById(teamId);
    const newActiveState = detail.status !== "ACTIVE";
    const body = newActiveState
      ? { isActive: true }
      : {
          isActive: false,
          reason: "ADMINISTRATIVE",
          notes: "Deactivated via toggle",
        };

    const response = await axiosInstance.post<BackendTeamRecordDto>(
      ENDPOINTS.TEAMS.ACTIVATION(teamId),
      body,
    );
    return {
      id: response.data.id,
      status: response.data.isActive ? "ACTIVE" : "INACTIVE",
    };
  },

  /**
   * Export all teams roster CSV/XLSX/PDF
   */
  exportRoster: async (params?: {
    search?: string;
    league?: string;
    status?: string;
    format?: "csv" | "xlsx" | "pdf";
  }): Promise<Blob> => {
    const response = await axiosInstance.get(ENDPOINTS.TEAMS.EXPORT, {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Export individual team's roster CSV
   * GET /api/v1/event/registrations/teams/{teamId}/roster/export
   */
  exportTeamRoster: async (
    teamId: string,
    params?: {
      search?: string;
      status?: string;
      memberType?: string;
      format?: string;
    },
  ): Promise<Blob> => {
    const cleanParams: Record<string, string> = {};
    if (params?.search && params.search.trim()) {
      cleanParams.search = params.search.trim();
    }
    if (params?.status && params.status !== "ALL") {
      cleanParams.status = params.status;
    }
    if (params?.memberType && params.memberType !== "ALL") {
      cleanParams.memberType = params.memberType;
    }
    if (params?.format) {
      cleanParams.format = params.format;
    }

    const response = await axiosInstance.get(
      ENDPOINTS.REGISTRATIONS.TEAM_ROSTER_EXPORT(teamId),
      {
        params: cleanParams,
        responseType: "blob",
      },
    );
    return response.data;
  },

  /**
   * List meal activations for date
   */
  getMealActivations: async (
    date?: string,
  ): Promise<{
    date: string;
    teams: Array<{
      teamId: string;
      name: string;
      league: "KSPL" | "ISCL";
      isActive: boolean;
      mealActivated: boolean;
      totalRegistrations: number;
      approvedMembers: number;
    }>;
  }> => {
    const response = await axiosInstance.get(ENDPOINTS.TEAMS.MEAL_ACTIVATIONS, {
      params: { date },
    });
    return response.data;
  },

  /**
   * Set meal activation for a team on a service date
   */
  setMealActivation: async (payload: {
    teamId: string;
    serviceDate: string;
    isActive: boolean;
  }): Promise<{ teamId: string; serviceDate: string; isActive: boolean }> => {
    const response = await axiosInstance.put(
      ENDPOINTS.TEAMS.MEAL_ACTIVATIONS,
      payload,
    );
    return response.data;
  },
};

export default teamsApi;
