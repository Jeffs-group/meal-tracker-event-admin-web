import { publicAxios } from "./publicAxios";
import { ENDPOINTS } from "./endpoints";
import type {
  PublicRegistrationConfig,
  PublicTeamOption,
  PublicRegistrationPayload,
  PublicRegistrationResult,
  PublicRegistrationMeta,
} from "@/types/publicRegistration.types";
import type { League } from "@/constants/leagues";

export interface PublicTeamDto {
  id: string;
  name: string;
  league: "KSPL" | "ISCL";
}

export interface UploadPhotoResponseDto {
  photoKey: string;
  photoUrl: string;
  originalFilename: string;
  mimetype: string;
  size: number;
  dimensions: string;
}

export interface RegistrationCreatedDto {
  id: string;
  status: string;
  message: string;
}

export const publicApi = {
  /**
   * Fetches dynamic registration form metadata from backend
   */
  getMeta: async (): Promise<PublicRegistrationMeta> => {
    try {
      const response = await publicAxios.get<PublicRegistrationMeta>(
        ENDPOINTS.PUBLIC.META,
      );
      return response.data;
    } catch {
      return {
        leagues: [
          { code: "KSPL", name: "Karnataka Super Premier League" },
          { code: "ISCL", name: "Inter-State Cricket League" },
        ],
        roles: [
          { value: "PLAYER", label: "Player", requiresTeam: true },
          {
            value: "COACH",
            label: "Coach / Support Staff",
            requiresTeam: true,
          },
          { value: "OWNER", label: "Franchise Owner", requiresTeam: true },
          { value: "STAFF", label: "Operational Staff", requiresTeam: false },
          {
            value: "ORGANIZER",
            label: "Committee Organizer",
            requiresTeam: false,
          },
        ],
        maxPhotoSizeMb: 5,
        allowedPhotoFormats: ["image/jpeg", "image/png"],
      };
    }
  },

  /**
   * Fetches public registration configuration and status
   */
  getConfig: async (): Promise<PublicRegistrationConfig> => {
    return {
      open: true,
      seasonLabel: "Season 2026 Live",
      leagues: ["KSPL", "ISCL"],
      roles: [
        { value: "PLAYER", label: "Player", requiresTeam: true },
        { value: "COACH", label: "Coach / Support Staff", requiresTeam: true },
        { value: "OWNER", label: "Franchise Owner", requiresTeam: true },
        { value: "STAFF", label: "Operational Staff", requiresTeam: false },
        {
          value: "ORGANIZER",
          label: "Committee Organizer",
          requiresTeam: false,
        },
      ],
      maxPhotoBytes: 5 * 1024 * 1024,
      minPhotoPx: 600,
      slaText:
        "Approvals are processed within 24–48 hours by Event Administrators.",
    };
  },

  /**
   * Fetches active teams for league (no private roster details exposed)
   */
  getTeams: async (league?: League): Promise<PublicTeamOption[]> => {
    const params = league ? { league } : undefined;
    const response = await publicAxios.get<PublicTeamDto[]>(
      ENDPOINTS.PUBLIC.TEAMS,
      { params },
    );
    let list = response.data || [];
    if (league) {
      list = list.filter((t) => t.league === league);
    }
    return list.map((t) => ({
      id: t.id,
      name: t.name,
      league: t.league as League,
      teamCode: t.id.slice(0, 8).toUpperCase(),
      full: false,
    }));
  },

  /**
   * Uploads a portrait identification photo to get photoKey and photoUrl
   */
  uploadPhoto: async (file: File): Promise<UploadPhotoResponseDto> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await publicAxios.post<UploadPhotoResponseDto>(
      ENDPOINTS.PUBLIC.PHOTO,
      formData,
      {
        headers: {
          "Content-Type": undefined,
        },
      },
    );
    return response.data;
  },

  /**
   * Submits public meal registration application
   */
  submitRegistration: async (
    payload: PublicRegistrationPayload,
    idempotencyKey?: string,
  ): Promise<PublicRegistrationResult> => {
    const isStaffOrOrganizer = ["STAFF", "ORGANIZER"].includes(
      payload.registrantType,
    );

    const cleanContact = payload.contactNumber.replace(/\D/g, "").slice(-10);

    const body: Record<string, unknown> = {
      type: isStaffOrOrganizer ? payload.registrantType : "TEAM",
      registerAs: payload.registrantType,
      fullName: payload.fullName,
      contactNumber: cleanContact,
      email: payload.emailAddress,
      dateOfBirth: payload.dateOfBirth,
      mealPreference: payload.mealPreference,
      confirmedGuidelines: Boolean(payload.consent),
      photoKey: payload.photo?.photoKey || "",
      photoDimensions:
        payload.photo?.photoDimensions ||
        payload.photo?.dimensions ||
        "1200 x 1600 px",
    };

    if (!isStaffOrOrganizer) {
      body.teamId = payload.teamId;
      body.memberType = payload.registrantType;
    }

    const response = await publicAxios.post<RegistrationCreatedDto>(
      ENDPOINTS.PUBLIC.REGISTER,
      body,
      {
        headers: idempotencyKey
          ? { "Idempotency-Key": idempotencyKey }
          : undefined,
      },
    );

    const emailParts = payload.emailAddress.split("@");
    const namePart = emailParts[0] || "user";
    const domainPart = emailParts[1] || "domain.com";
    const maskedEmail =
      namePart.length > 2
        ? `${namePart[0]}***${namePart[namePart.length - 1]}@${domainPart}`
        : `${namePart[0]}***@${domainPart}`;

    return {
      applicationId: `APP-${response.data.id.slice(0, 8).toUpperCase()}`,
      submittedAt: new Date().toISOString(),
      fullName: payload.fullName,
      teamName: isStaffOrOrganizer
        ? payload.registrantType === "STAFF"
          ? "Operational Staff"
          : "Committee Organizer"
        : payload.teamId || "Assigned Team",
      maskedEmail,
    };
  },
};

export default publicApi;
