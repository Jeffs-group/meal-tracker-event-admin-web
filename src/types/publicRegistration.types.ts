import type { League } from "@/constants/leagues";

export type PublicRegistrantRole =
  "PLAYER" | "COACH" | "OWNER" | "STAFF" | "ORGANIZER" | "OTHERS";

export interface PublicRegistrationMetaRole {
  value: PublicRegistrantRole;
  label: string;
  requiresTeam: boolean;
}

export interface PublicRegistrationMetaLeague {
  code: string;
  name: string;
}

export interface PublicRegistrationMeta {
  leagues: PublicRegistrationMetaLeague[];
  roles: PublicRegistrationMetaRole[];
  maxPhotoSizeMb: number;
  allowedPhotoFormats: string[];
}

export interface PublicRegistrationConfig {
  open: boolean;
  opensAt?: string;
  closesAt?: string;
  seasonLabel: string;
  leagues: League[];
  roles: {
    value: PublicRegistrantRole;
    label: string;
    requiresTeam?: boolean;
  }[];
  maxPhotoBytes: number; // 5 MB = 5 * 1024 * 1024
  minPhotoPx: number; // 600 px
  slaText?: string;
}

export interface PublicTeamOption {
  id: string;
  teamCode: string; // e.g. TM-KSPL-001
  name: string;
  league: League;
  full: boolean;
}

export type MealPreference = "VEG" | "NON_VEG";

export interface PublicRegistrationPayload {
  fullName: string;
  registrantType: PublicRegistrantRole;
  league?: League;
  teamId?: string;
  contactNumber: string;
  emailAddress: string;
  dateOfBirth: string; // YYYY-MM-DD
  mealPreference: MealPreference;
  photo: {
    dataUrl: string; // Base64 or object URL for client preview
    fileName: string;
    fileSize: number; // bytes
    dimensions: string; // e.g. "1200 x 1600 px"
    mimeType: string;
    file?: File;
    photoKey?: string;
    photoDimensions?: string;
  };
  consent: boolean;
  honeypot?: string; // abuse prevention
}

export interface PublicRegistrationResult {
  applicationId: string; // e.g. "REG-CK-109"
  submittedAt: string;
  fullName: string;
  teamName: string;
  maskedEmail: string; // e.g. "j***h@example.com"
}

export type PublicRegistrationErrorCode =
  | "VALIDATION_FAILED"
  | "REGISTRATION_CLOSED"
  | "DUPLICATE_REGISTRATION"
  | "TEAM_FULL"
  | "TEAM_INACTIVE"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_MEDIA"
  | "RATE_LIMITED"
  | "SERVER_ERROR";
