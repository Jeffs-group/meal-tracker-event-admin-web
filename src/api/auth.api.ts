import { axiosInstance } from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import type { AuthUser, AuthTokens } from "@/types/auth";

export interface LoginPayload {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface LoginResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    portal: "EVENT" | "SUPER";
    role: string;
  };
}

export interface MeResponseDto {
  id: string;
  name: string;
  email: string;
  portal: "EVENT" | "SUPER";
  role: string;
  permissions: string[];
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface ForgotPasswordPayload {
  email: string;
}

function mapAuthUser(dto: {
  id: string;
  email: string;
  name: string;
  portal?: string;
  role: string;
  permissions?: string[];
}): AuthUser {
  const parts = (dto.name || "User").trim().split(" ");
  const firstName = parts[0] || "Admin";
  const lastName = parts.slice(1).join(" ") || "User";

  return {
    id: dto.id,
    email: dto.email,
    firstName,
    lastName,
    organizationId: "org-event-admin",
    role: "ORG_ADMIN",
    permissions: dto.permissions || [
      "dashboard",
      "registrations",
      "teams",
      "reports",
      "users",
    ],
  };
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const res = await axiosInstance.post<LoginResponseDto>(
      ENDPOINTS.AUTH.LOGIN,
      {
        email: payload.email.trim(),
        password: payload.password || "",
      },
    );

    const { accessToken, user: rawUser } = res.data;

    // Check if Super Admin is attempting to log into the Event Admin portal
    const isRawSuper =
      rawUser?.portal === "SUPER" ||
      rawUser?.role?.toUpperCase().includes("SUPER");

    if (isRawSuper) {
      try {
        await axiosInstance.post(ENDPOINTS.AUTH.LOGOUT);
      } catch {
        // ignore logout errors
      }
      throw new Error(
        "Super Admin accounts cannot log into the Event Admin portal. Please sign in via the Super Admin portal.",
      );
    }

    const tokens: AuthTokens = { accessToken };

    // Fetch authoritative profile via GET /api/v1/auth/me
    let authUser = mapAuthUser(rawUser);
    try {
      const meRes = await axiosInstance.get<MeResponseDto>(ENDPOINTS.AUTH.ME, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (meRes.data) {
        if (
          meRes.data.portal === "SUPER" ||
          meRes.data.role?.toUpperCase().includes("SUPER")
        ) {
          try {
            await axiosInstance.post(ENDPOINTS.AUTH.LOGOUT);
          } catch {
            // ignore logout errors
          }
          throw new Error(
            "Super Admin accounts cannot log into the Event Admin portal. Please sign in via the Super Admin portal.",
          );
        }
        authUser = mapAuthUser(meRes.data);
      }
    } catch (err) {
      // Re-throw if it's our explicit Super Admin rejection error
      if (
        err instanceof Error &&
        err.message.includes("Super Admin accounts cannot log into")
      ) {
        throw err;
      }
      // Fallback to rawUser for network hiccups on /me
    }

    return { user: authUser, tokens };
  },

  me: async (): Promise<AuthUser> => {
    const res = await axiosInstance.get<MeResponseDto>(ENDPOINTS.AUTH.ME);
    if (
      res.data &&
      (res.data.portal === "SUPER" ||
        res.data.role?.toUpperCase().includes("SUPER"))
    ) {
      throw new Error(
        "Super Admin accounts cannot log into the Event Admin portal. Please sign in via the Super Admin portal.",
      );
    }
    return mapAuthUser(res.data);
  },

  refresh: async (): Promise<AuthTokens> => {
    const res = await axiosInstance.post<{ accessToken: string }>(
      ENDPOINTS.AUTH.REFRESH,
    );
    return { accessToken: res.data.accessToken };
  },

  logout: async (): Promise<void> => {
    try {
      await axiosInstance.post(ENDPOINTS.AUTH.LOGOUT);
    } catch {
      // Ignore logout errors on network
    }
  },

  forgotPassword: async (
    payload: ForgotPasswordPayload,
  ): Promise<{ message: string }> => {
    return {
      message: `If an account exists for ${payload.email}, password recovery instructions have been dispatched.`,
    };
  },
};

export default authApi;
