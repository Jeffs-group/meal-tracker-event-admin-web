import { env } from "@/config/env";

/**
 * Checks if the current visitor is accessing via the public registration domain
 * (e.g. cricket.jeffscorporatecatering.com or any cricket.* subdomain).
 */
export const isPublicRegistrationDomain = (): boolean => {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname.toLowerCase();
  return (
    hostname.startsWith("cricket.") ||
    hostname === "cricket.jeffscorporatecatering.com"
  );
};

/**
 * Returns the base public registration URL for sharing and QR codes.
 */
export const getPublicRegistrationBaseUrl = (): string => {
  if (typeof window === "undefined") {
    return "https://cricket.jeffscorporatecatering.com";
  }

  // If running locally on localhost/127.0.0.1, use the current origin for easy testing
  const hostname = window.location.hostname.toLowerCase();
  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.");

  if (isLocalhost && !import.meta.env.PROD) {
    return window.location.origin;
  }

  // Configured public registration URL or default production cricket domain
  if (env.VITE_PUBLIC_REGISTRATION_URL) {
    return env.VITE_PUBLIC_REGISTRATION_URL.replace(/\/+$/, "");
  }

  return "https://cricket.jeffscorporatecatering.com";
};

/**
 * Checks if a given path is part of the public registration portal
 */
export const isPublicRegistrationPath = (pathname: string): boolean => {
  const clean = pathname.toLowerCase();
  return (
    clean.startsWith("/register") ||
    clean === "/register" ||
    clean === "/register/success" ||
    clean === "/register/closed"
  );
};

