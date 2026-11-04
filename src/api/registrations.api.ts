import { axiosInstance } from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { formatDateTimeIST } from "@/utils/formatDate";
import type {
  TeamRegistrationRow,
  StaffRegistrationRow,
  OrganizerRegistrationRow,
  RegistrantDetail,
  StaffStats,
} from "@/types/registration.types";
import type {
  PaginatedResult,
  TableQueryParams,
  RegistrationStatus,
  RegistrantType,
} from "@/types/common.types";

interface BackendRegistrationTeamDto {
  id: string;
  code: string;
  name: string;
  league: "KSPL" | "ISCL";
  franchiseCode?: string | null;
  isActive?: boolean;
}

interface BackendRegistrationItemDto {
  id: string;
  registrantCode?: string | null;
  fullName: string;
  type: "TEAM" | "STAFF" | "ORGANIZER";
  team?: BackendRegistrationTeamDto | null;
  memberType?: "PLAYER" | "OWNER" | "COACH" | "OTHERS" | null;
  contactNumber: string;
  email: string;
  mealPreference: "VEG" | "NON_VEG";
  status: "PENDING" | "APPROVED" | "REJECTED";
  isMealEligible: boolean;
  createdAt: string;
}

interface BackendRegistrationDetailDto extends BackendRegistrationItemDto {
  photoUrl: string;
  photoMimetype?: string | null;
  photoSize?: number | null;
  photoDimensions?: string | null;
  dateOfBirth?: string | null;
  rejectionReason?: string | null;
  rejectionCategory?: string | null;
  rejectionRemarks?: string | null;
  approvedAt?: string | null;
  approvedBy?: { id: string; name: string } | null;
  revokedAt?: string | null;
  revokedBy?: { id: string; name: string } | null;
  revocationReason?: string | null;
  revocationNotes?: string | null;
  verificationPasscode?: string | null;
  qrCodeDataUrl?: string | null;
}

interface BackendMetricsDto {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  approvedPercentage: number;
  pendingPercentage: number;
  rejectedPercentage: number;
  mealEligibleCount: number;
}

interface BackendTeamsPageDto {
  summary: {
    totalTeams: number;
    ksplTeams: number;
    isclTeams: number;
  };
  data: Array<{
    id: string;
    code: string;
    name: string;
    league: "KSPL" | "ISCL";
    maxRosterCap: number;
    isActive: boolean;
    totalRegistrations: number;
    approvedMembers: number;
    pendingMembers: number;
    rejectedMembers: number;
  }>;
  page: number;
  pageSize: number;
  total: number;
}

function mapDetailDtoToRegistrantDetail(
  dto: BackendRegistrationDetailDto,
): RegistrantDetail {
  const isApproved = dto.status === "APPROVED";
  const isRejected = dto.status === "REJECTED";

  return {
    id: dto.id,
    applicationId: `#REG-${dto.registrantCode || dto.id.slice(0, 6).toUpperCase()}`,
    registrantId:
      dto.registrantCode || `REG-${dto.id.slice(0, 6).toUpperCase()}`,
    fullName: dto.fullName,
    roleTitle: `${dto.memberType || "Member"} (${dto.team?.name || dto.type})`,
    registrantType: dto.type as RegistrantType,
    teamName: dto.team?.name || "General Organization",
    teamId: dto.team?.id,
    teamStatus: dto.team?.isActive ? "ACTIVE" : "INACTIVE",
    status: dto.status as RegistrationStatus,
    submittedAt: formatDateTimeIST(dto.createdAt),
    verifiedAt: dto.approvedAt ? formatDateTimeIST(dto.approvedAt) : undefined,
    verifiedBy: dto.approvedBy?.name,

    photo: {
      previewUrl: dto.photoUrl || "",
      fileName: `${dto.fullName.toLowerCase().replace(/\s+/g, "_")}_photo.jpg`,
      fileSize:
        typeof dto.photoSize === "number"
          ? `${(dto.photoSize / 1024).toFixed(1)} KB`
          : "1.2 MB",
      dimensions: dto.photoDimensions || "600 x 600 px",
    },

    attributes: {
      franchiseAndDivision: `${dto.team?.name || "Jeffs Group"} • ${dto.team?.league || "Main Event"}`,
      registrantTypeLabel: dto.type,
      contactNumber: dto.contactNumber,
      emailAddress: dto.email,
      mealPreference:
        dto.mealPreference === "VEG" ? "Vegetarian" : "Non-Vegetarian",
      dateOfBirth: dto.dateOfBirth || "15 Aug 1995",
    },

    accreditation: {
      registrantId: dto.registrantCode || dto.id,
      verificationPasscode:
        dto.verificationPasscode ||
        `VCD-${dto.id.slice(0, 4).toUpperCase()}-${dto.team?.league || "ISCL"}`,
      sentTime: dto.approvedAt
        ? formatDateTimeIST(dto.approvedAt)
        : "Pending Issuance",
      qrValue:
        dto.qrCodeDataUrl ||
        JSON.stringify({
          id: dto.id,
          code: dto.registrantCode,
          name: dto.fullName,
          status: dto.status,
        }),
      isActive: isApproved && dto.isMealEligible,
    },

    rejectionReason: dto.rejectionReason || undefined,
    rejectionInfo: isRejected
      ? {
          primaryCategory:
            dto.rejectionCategory ||
            "Incompatible / Blurry Photo Identification",
          adminRemarks:
            dto.rejectionRemarks ||
            dto.rejectionReason ||
            "Verification criteria not fulfilled.",
        }
      : undefined,
  };
}

export const registrationsApi = {
  /**
   * Get team registration summary rows for the Teams tab
   */
  getTeams: async (
    params?: TableQueryParams,
  ): Promise<PaginatedResult<TeamRegistrationRow>> => {
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

    const response = await axiosInstance.get<BackendTeamsPageDto>(
      ENDPOINTS.TEAMS.LIST,
      { params: queryParams },
    );

    const items: TeamRegistrationRow[] = response.data.data.map((item) => ({
      id: item.id,
      teamId: item.id,
      name: item.name,
      code: item.code,
      league: item.league,
      totalRegistrations: item.totalRegistrations,
      approvedCount: item.approvedMembers,
      pendingCount: item.pendingMembers,
      rejectedCount: item.rejectedMembers,
      status: item.isActive ? "ACTIVE" : "INACTIVE",
      isMealActive: Boolean(
        (item as unknown as { isMealActive?: boolean; mealActivated?: boolean })
          .isMealActive ??
          (item as unknown as { isMealActive?: boolean; mealActivated?: boolean })
            .mealActivated ??
          false,
      ),
    }));

    return {
      data: items,
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
   * Get staff registrations and operational KPI metrics
   */
  getStaffs: async (
    params?: TableQueryParams,
  ): Promise<{
    result: PaginatedResult<StaffRegistrationRow>;
    stats: StaffStats;
  }> => {
    const [listRes, metricsRes] = await Promise.all([
      axiosInstance.get<{
        data: BackendRegistrationItemDto[];
        page: number;
        pageSize: number;
        total: number;
      }>(ENDPOINTS.REGISTRATIONS.LIST, {
        params: {
          type: "STAFF",
          page: params?.page || 1,
          pageSize: params?.pageSize || 20,
          search: params?.search,
          status: params?.status,
        },
      }),
      axiosInstance.get<BackendMetricsDto>(ENDPOINTS.REGISTRATIONS.METRICS, {
        params: { type: "STAFF" },
      }),
    ]);

    const rows: StaffRegistrationRow[] = listRes.data.data.map((item) => ({
      id: item.id,
      registrationId:
        item.registrantCode || `REG-STF-${item.id.slice(0, 4).toUpperCase()}`,
      name: item.fullName,
      role: item.memberType || "Operations Staff",
      department: item.team?.name || "Event Operations",
      contact: item.contactNumber,
      email: item.email,
      submittedAt: formatDateTimeIST(item.createdAt),
      status: item.status as RegistrationStatus,
      mealEligible: Boolean(item.isMealEligible),
    }));

    const metrics = metricsRes.data;
    const stats: StaffStats = {
      total: metrics.total,
      approvedMealEligible: metrics.mealEligibleCount,
      approvedPercent: metrics.approvedPercentage,
      pending: metrics.pending,
      pendingPercent: metrics.pendingPercentage,
      rejected: metrics.rejected,
      rejectedPercent: metrics.rejectedPercentage,
    };

    return {
      result: {
        data: rows,
        pagination: {
          page: listRes.data.page,
          pageSize: listRes.data.pageSize,
          total: listRes.data.total,
          totalPages: Math.ceil(
            listRes.data.total / (listRes.data.pageSize || 20),
          ),
        },
      },
      stats,
    };
  },

  /**
   * Get organizer registrations and operational KPI metrics
   */
  getOrganizers: async (
    params?: TableQueryParams,
  ): Promise<{
    result: PaginatedResult<OrganizerRegistrationRow>;
    stats: StaffStats;
  }> => {
    const [listRes, metricsRes] = await Promise.all([
      axiosInstance.get<{
        data: BackendRegistrationItemDto[];
        page: number;
        pageSize: number;
        total: number;
      }>(ENDPOINTS.REGISTRATIONS.LIST, {
        params: {
          type: "ORGANIZER",
          page: params?.page || 1,
          pageSize: params?.pageSize || 20,
          search: params?.search,
          status: params?.status,
        },
      }),
      axiosInstance.get<BackendMetricsDto>(ENDPOINTS.REGISTRATIONS.METRICS, {
        params: { type: "ORGANIZER" },
      }),
    ]);

    const rows: OrganizerRegistrationRow[] = listRes.data.data.map((item) => ({
      id: item.id,
      registrationId:
        item.registrantCode || `REG-ORG-${item.id.slice(0, 4).toUpperCase()}`,
      name: item.fullName,
      role: item.memberType || "Committee Organizer",
      organization: item.team?.name || "Jeffs Event Organizing Committee",
      contact: item.contactNumber,
      email: item.email,
      submittedAt: formatDateTimeIST(item.createdAt),
      status: item.status as RegistrationStatus,
      mealEligible: Boolean(item.isMealEligible),
    }));

    const metrics = metricsRes.data;
    const stats: StaffStats = {
      total: metrics.total,
      approvedMealEligible: metrics.mealEligibleCount,
      approvedPercent: metrics.approvedPercentage,
      pending: metrics.pending,
      pendingPercent: metrics.pendingPercentage,
      rejected: metrics.rejected,
      rejectedPercent: metrics.rejectedPercentage,
    };

    return {
      result: {
        data: rows,
        pagination: {
          page: listRes.data.page,
          pageSize: listRes.data.pageSize,
          total: listRes.data.total,
          totalPages: Math.ceil(
            listRes.data.total / (listRes.data.pageSize || 20),
          ),
        },
      },
      stats,
    };
  },

  /**
   * Get single registration detail
   */
  getDetail: async (id: string): Promise<RegistrantDetail> => {
    const response = await axiosInstance.get<BackendRegistrationDetailDto>(
      ENDPOINTS.REGISTRATIONS.DETAIL(id),
    );
    return mapDetailDtoToRegistrantDetail(response.data);
  },

  /**
   * Approve a registration
   */
  approve: async (id: string): Promise<RegistrantDetail> => {
    await axiosInstance.post(ENDPOINTS.REGISTRATIONS.APPROVE(id));
    return registrationsApi.getDetail(id);
  },

  /**
   * Reject a registration with reason and category
   */
  reject: async (
    id: string,
    reason: string,
    category?: string,
  ): Promise<RegistrantDetail> => {
    await axiosInstance.post(ENDPOINTS.REGISTRATIONS.REJECT(id), {
      reason,
      remarks: reason,
      category: category || "OTHER",
      sendEmail: true,
    });
    return registrationsApi.getDetail(id);
  },

  /**
   * Revoke an approved registration
   */
  revoke: async (id: string, reason?: string): Promise<RegistrantDetail> => {
    await axiosInstance.post(ENDPOINTS.REGISTRATIONS.REVOKE(id), {
      reason: reason || "Revocation requested by administrative action",
      securityNotes: reason,
    });
    return registrationsApi.getDetail(id);
  },

  /**
   * Reopen a rejected registration for verification
   */
  reopen: async (id: string): Promise<RegistrantDetail> => {
    await axiosInstance.post(ENDPOINTS.REGISTRATIONS.REOPEN(id));
    return registrationsApi.getDetail(id);
  },

  /**
   * Resend approval credentials to registrant
   */
  resendPasscode: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.post<{
      id: string;
      emailed: boolean;
    }>(ENDPOINTS.REGISTRATIONS.RESEND(id));
    return {
      success: response.data.emailed,
      message: response.data.emailed
        ? "Accreditation passcode emailed successfully."
        : "Failed to dispatch email.",
    };
  },

  /**
   * Toggle meal eligibility on an approved registration
   */
  toggleMealEligibility: async (
    id: string,
    isMealEligible: boolean,
  ): Promise<boolean> => {
    const response = await axiosInstance.patch<{
      id: string;
      isMealEligible: boolean;
      status: string;
    }>(ENDPOINTS.REGISTRATIONS.MEAL_ELIGIBILITY(id), {
      isMealEligible,
    });
    return response.data.isMealEligible;
  },

  /**
   * Bulk approve registrations
   */
  bulkApprove: async (registrationIds: string[]): Promise<number> => {
    const response = await axiosInstance.post<{
      affected: number;
      ids: string[];
    }>(ENDPOINTS.REGISTRATIONS.BULK_APPROVE, {
      registrationIds,
    });
    return response.data.affected;
  },

  /**
   * Bulk reject registrations
   */
  bulkReject: async (
    registrationIds: string[],
    remarks?: string,
    category?: string,
  ): Promise<number> => {
    const response = await axiosInstance.post<{
      affected: number;
      ids: string[];
    }>(ENDPOINTS.REGISTRATIONS.BULK_REJECT, {
      registrationIds,
      remarks: remarks || "Bulk rejected by administrator.",
      category: category || "OTHER",
    });
    return response.data.affected;
  },

  /**
   * Batch toggle meal eligibility
   */
  bulkMealEligibility: async (
    registrationIds: string[],
    isMealEligible: boolean,
  ): Promise<number> => {
    const response = await axiosInstance.post<{
      affected: number;
      ids: string[];
    }>(ENDPOINTS.REGISTRATIONS.BULK_MEAL_ELIGIBILITY, {
      registrationIds,
      isMealEligible,
    });
    return response.data.affected;
  },

  /**
   * Download accreditation badge PDF as a blob
   */
  downloadBadgePdf: async (id: string): Promise<Blob> => {
    const response = await axiosInstance.get(
      ENDPOINTS.REGISTRATIONS.BADGE_PDF(id),
      {
        responseType: "blob",
      },
    );
    return response.data;
  },

  /**
   * Export registrations roster as CSV
   * GET /api/v1/event/registrations/export
   */
  exportRegistrationsCsv: async (params?: {
    page?: number;
    pageSize?: number;
    status?: "PENDING" | "APPROVED" | "REJECTED" | string;
    type?: "TEAM" | "STAFF" | "ORGANIZER" | string;
    memberType?: "PLAYER" | "OWNER" | "COACH" | "OTHERS" | string;
    teamId?: string;
    search?: string;
    sort?: "latest" | "oldest" | "name" | string;
    isMealEligible?: boolean;
  }): Promise<Blob> => {
    const cleanParams: Record<string, unknown> = {};
    if (params?.page) cleanParams.page = params.page;
    if (params?.pageSize) cleanParams.pageSize = params.pageSize;
    if (params?.status && params.status !== "ALL") cleanParams.status = params.status;
    if (params?.type && params.type !== "ALL") cleanParams.type = params.type;
    if (params?.memberType && params.memberType !== "ALL") cleanParams.memberType = params.memberType;
    if (params?.teamId) cleanParams.teamId = params.teamId;
    if (params?.search && params.search.trim()) cleanParams.search = params.search.trim();
    if (params?.sort) cleanParams.sort = params.sort;
    if (params?.isMealEligible !== undefined) cleanParams.isMealEligible = params.isMealEligible;

    const response = await axiosInstance.get(ENDPOINTS.REGISTRATIONS.EXPORT, {
      params: cleanParams,
      responseType: "blob",
    });
    return response.data;
  },
};

export default registrationsApi;
