export type UserRole =
  "SUPER_ADMIN" | "ORG_ADMIN" | "ORG_MANAGER" | "ORG_STAFF";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  role: UserRole;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthSession {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
}
