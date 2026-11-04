import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/config/env";
import { getAccessToken, useAuthStore } from "@/stores/authStore";
import { ApiError } from "@/lib/apiError";
import type { ApiErrorResponse } from "@/types/api";

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: env.VITE_API_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "ngrok-skip-browser-warning": "69420",
  },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Sanitize query params: strip empty strings, null, undefined, or "ALL" filters
    if (config.params && typeof config.params === "object") {
      const sanitized: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(config.params)) {
        if (
          val !== undefined &&
          val !== null &&
          val !== "" &&
          val !== "ALL" &&
          val !== "all"
        ) {
          sanitized[key] = typeof val === "string" ? val.trim() : val;
        }
      }
      config.params = sanitized;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && originalRequest) {
      const url = originalRequest.url || "";
      const isAuthEndpoint =
        url.includes("/api/v1/auth/login") ||
        url.includes("/api/v1/auth/refresh");

      if (isAuthEndpoint || originalRequest._retry) {
        useAuthStore.getState().logout();
        const apiError = ApiError.fromAxiosError(error);
        return Promise.reject(apiError);
      }

      if (isRefreshing) {
        return new Promise<unknown>((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(axiosInstance(originalRequest));
            },
            reject: (err: unknown) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post<{ accessToken: string }>(
          `${env.VITE_API_BASE_URL}/api/v1/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "ngrok-skip-browser-warning": "69420",
            },
          },
        );

        const newAccessToken = refreshResponse.data?.accessToken;
        if (!newAccessToken) {
          throw new Error("No access token received from refresh endpoint");
        }

        useAuthStore.getState().setTokens({ accessToken: newAccessToken });

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().logout();
        const apiError = ApiError.fromAxiosError(error);
        return Promise.reject(apiError);
      } finally {
        isRefreshing = false;
      }
    }

    const apiError = ApiError.fromAxiosError(error);
    return Promise.reject(apiError);
  },
);

export default axiosInstance;
