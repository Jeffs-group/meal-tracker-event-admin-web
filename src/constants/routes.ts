export const ROUTES = {
  ROOT: "/",
  DASHBOARD: "/dashboard",
  MANAGE_TEAMS: "/manage-teams",
  REGISTRATIONS: "/registrations",
  TEAM_MEMBERS: "/registrations/teams/:teamId",
  REPORTS: "/reports",
  REPORTS_REGISTRATIONS: "/reports/registrations",
  REPORTS_TEAMS: "/reports/teams",
  REPORTS_STAFF_ORGANIZERS: "/reports/staff-organizers",
  REPORTS_MEAL_ELIGIBILITY: "/reports/meal-eligibility",
  USER_MANAGEMENT: "/user-management",
  REGISTER: "/register",
  REGISTER_SUCCESS: "/register/success",
  REGISTER_CLOSED: "/register/closed",
  LOGIN: "/login",
  UNAUTHORIZED: "/403",
  NOT_FOUND: "*",
} as const;

export const buildTeamMembersRoute = (teamId: string) =>
  `/registrations/teams/${teamId}`;
