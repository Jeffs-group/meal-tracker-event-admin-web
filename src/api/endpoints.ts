/**
 * Centralized API Endpoints Map
 * Aligned with Swagger / OpenAPI specifications (v1)
 * Host: https://huddle-unspoiled-explicit.ngrok-free.dev
 */
export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    REFRESH: "/api/v1/auth/refresh",
    LOGOUT: "/api/v1/auth/logout",
    ME: "/api/v1/auth/me",
  },
  REGISTRATIONS: {
    SUMMARY: "/api/v1/event/registrations/summary",
    METRICS: "/api/v1/event/registrations/metrics",
    EXPORT: "/api/v1/event/registrations/export",
    TEAM_ROSTER: (teamId: string) =>
      `/api/v1/event/registrations/teams/${teamId}/roster`,
    TEAM_ROSTER_EXPORT: (teamId: string) =>
      `/api/v1/event/registrations/teams/${teamId}/roster/export`,
    LIST: "/api/v1/event/registrations",
    DETAIL: (id: string) => `/api/v1/event/registrations/${id}`,
    BADGE_PDF: (id: string) => `/api/v1/event/registrations/${id}/badge-pdf`,
    APPROVE: (id: string) => `/api/v1/event/registrations/${id}/approve`,
    REJECT: (id: string) => `/api/v1/event/registrations/${id}/reject`,
    REOPEN: (id: string) => `/api/v1/event/registrations/${id}/reopen`,
    REVOKE: (id: string) => `/api/v1/event/registrations/${id}/revoke`,
    RESEND: (id: string) =>
      `/api/v1/event/registrations/${id}/resend-credentials`,
    BULK_APPROVE: "/api/v1/event/registrations/bulk-approve",
    BULK_REJECT: "/api/v1/event/registrations/bulk-reject",
    MEAL_ELIGIBILITY: (id: string) =>
      `/api/v1/event/registrations/${id}/meal-eligibility`,
    BULK_MEAL_ELIGIBILITY: "/api/v1/event/registrations/bulk-meal-eligibility",
    PHOTO: "/api/v1/event/registrations/photo",
  },
  USERS: {
    SUMMARY: "/api/v1/event/users/summary",
    LIST: "/api/v1/event/users",
    CREATE: "/api/v1/event/users",
    UPDATE: (id: string) => `/api/v1/event/users/${id}`,
    RESET_PASSWORD: (id: string) => `/api/v1/event/users/${id}/reset-password`,
    ROLES_SUMMARY: "/api/v1/event/roles/summary",
    PERMISSIONS_MATRIX: "/api/v1/event/roles/permissions-matrix",
    ROLES_LIST: "/api/v1/event/roles",
    ROLES_CREATE: "/api/v1/event/roles",
    ROLES_UPDATE: (id: string) => `/api/v1/event/roles/${id}`,
    ROLES_DELETE: (id: string) => `/api/v1/event/roles/${id}`,
  },
  TEAMS: {
    EXPORT: "/api/v1/event/teams/export",
    LIST: "/api/v1/event/teams",
    CREATE: "/api/v1/event/teams",
    UPDATE: (id: string) => `/api/v1/event/teams/${id}`,
    ACTIVATION: (id: string) => `/api/v1/event/teams/${id}/activation`,
    MEAL_ACTIVATIONS: "/api/v1/event/meal-activations",
  },
  REPORTS: {
    DASHBOARD: "/api/v1/event/dashboard",
    REGISTRATIONS: "/api/v1/event/reports/registrations",
    APPROVALS: "/api/v1/event/reports/approvals",
    TEAMS: "/api/v1/event/reports/teams",
    TEAM_ACTIVATION: "/api/v1/event/reports/team-activation",
    MEAL_ACTIVATION: "/api/v1/event/reports/meal-activation",
    STAFF: "/api/v1/event/reports/staff",
  },
  PUBLIC: {
    META: "/api/v1/public/registrations/meta",
    TEAMS: "/api/v1/public/teams",
    PHOTO: "/api/v1/public/registrations/photo",
    REGISTER: "/api/v1/public/registrations",
  },
} as const;
