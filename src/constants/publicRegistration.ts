import type {
  PublicRegistrationConfig,
  PublicRegistrantRole,
} from "@/types/publicRegistration.types";

/**
 * Public Meal Registration Module Constants
 */

export const PUBLIC_STAFF_ORGANIZER_ENABLED = true;

export const PUBLIC_REGISTRANT_ROLES: {
  value: PublicRegistrantRole;
  label: string;
  requiresTeam: boolean;
}[] = [
  { value: "PLAYER", label: "Player", requiresTeam: true },
  { value: "COACH", label: "Coach / Support Staff", requiresTeam: true },
  { value: "OWNER", label: "Franchise Owner", requiresTeam: true },
  { value: "STAFF", label: "Operational Staff", requiresTeam: false },
  { value: "ORGANIZER", label: "Committee Organizer", requiresTeam: false },
];

export const PHOTO_CONSTRAINTS = {
  MAX_BYTES: 5 * 1024 * 1024, // 5 MB
  MIN_PX: 600, // 600 x 600 px
  ACCEPTED_TYPES: ["image/jpeg", "image/png"] as const,
  ACCEPTED_EXTENSIONS: [".jpg", ".jpeg", ".png"] as const,
};

export const DEFAULT_PUBLIC_CONFIG: PublicRegistrationConfig = {
  open: true,
  opensAt: "2026-08-01T00:00:00Z",
  closesAt: "2026-11-30T23:59:59Z",
  seasonLabel: "KSPL & ISCL LEAGUES 2026",
  leagues: ["KSPL", "ISCL"],
  roles: PUBLIC_REGISTRANT_ROLES,
  maxPhotoBytes: PHOTO_CONSTRAINTS.MAX_BYTES,
  minPhotoPx: PHOTO_CONSTRAINTS.MIN_PX,
  slaText:
    "Registrations are reviewed by the Event Admin. Official accreditation badge and meal token passcodes will be issued via email upon verification approval.",
};

export const PRIVACY_NOTICE_TEXT = `Jeffs Group Data Privacy & Accreditation Notice:
1. Personal Information Collection: Full name, contact details, date of birth, dietary meal preferences, and identification portrait are collected strictly for event accreditation, venue catering allocation, and tournament logistics.
2. Photo Verification: Uploaded identification portraits are utilized to generate digital gate accreditation badges and prevent identity spoofing across turnstiles.
3. Access Controls: Your data is accessible solely by authorized Event Administrators and catering supervisors. Personal details are never shared with third-party advertisers or unverified external organizations.
4. Security: All submissions are encrypted in transit and stored in protected enterprise databases.
5. Inquiries: For questions regarding accreditation data, contact the Jeffs Group Accreditation Desk at accreditation@jeffsgroup.org.`;
