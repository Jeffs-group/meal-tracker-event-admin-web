import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/config/env";

/**
 * Dedicated Public API Axios Instance
 * Completely unauthenticated — no admin auth headers, no session interceptors,
 * no redirects to /login on 401.
 */
export const publicAxios: AxiosInstance = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: env.VITE_API_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "ngrok-skip-browser-warning": "69420",
  },
});

publicAxios.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
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
  (error) => Promise.reject(error),
);

export default publicAxios;
