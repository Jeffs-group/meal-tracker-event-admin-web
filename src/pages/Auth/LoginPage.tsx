import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { JeffsGroupLogo } from "@/components/common/JeffsGroupLogo";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/api/auth.api";
import { ROUTES } from "@/constants/routes";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, setAuth } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("remember_admin_email");
    if (savedEmail) {
      setEmail(savedEmail);
    } else {
      // Default to demo admin for quick developer convenience
      setEmail("alex.morgan@jeffsgroup.org");
      setPassword("admin123");
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (
        user &&
        (user.role === "SUPER_ADMIN" ||
          (user as unknown as { portal?: string })?.portal === "SUPER" ||
          user.role?.toUpperCase().includes("SUPER"))
      ) {
        useAuthStore.getState().logout();
        setErrorMessage(
          "Super Admin accounts cannot log into the Event Admin portal. Please sign in via the Super Admin portal.",
        );
        return;
      }
      const from =
        (location.state as { from?: { pathname?: string } })?.from?.pathname ||
        ROUTES.DASHBOARD;
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await authApi.login({
        email: cleanEmail,
        password,
        rememberMe,
      });

      if (rememberMe) {
        localStorage.setItem("remember_admin_email", cleanEmail);
      } else {
        localStorage.removeItem("remember_admin_email");
      }

      setAuth(res.user, res.tokens);

      const destination =
        (location.state as { from?: { pathname?: string } })?.from?.pathname ||
        ROUTES.DASHBOARD;
      navigate(destination, { replace: true });
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Invalid credentials. Please verify your email and password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-white flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 font-sans overflow-hidden selection:bg-[#FAF4E6] selection:text-[#9B7415]">
      {/* Central Card Shell matching Figma node 66-479 */}
      <div className="w-full max-w-[420px] sm:max-w-[440px] mx-auto">
        {/* Brand Logo */}
        <div className="mb-4">
          <JeffsGroupLogo iconClassName="h-8 w-8 text-[#C9A227]" />
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1220] leading-tight">
            Welcome Back
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
            Login to your Jeffs Group Event Admin Portal to manage registrations
            and team information.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50/90 p-2.5 text-xs text-rose-800"
          >
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="flex-1 font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email Address */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Mail className="h-5 w-5 text-slate-400" aria-hidden="true" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Enter your email address"
                className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#C9A227] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/20"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Enter your password"
                className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#C9A227] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-700 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot Password Row */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#C9A227] focus:ring-[#C9A227] accent-[#C9A227] cursor-pointer"
              />
              <span className="text-xs sm:text-sm font-medium text-slate-700">
                Remember me
              </span>
            </label>

            <button
              type="button"
              onClick={() => setIsForgotOpen(true)}
              className="text-xs sm:text-sm font-semibold text-[#C9A227] hover:text-[#9B7415] transition-colors cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>

          {/* Primary Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-[#C9A227] hover:bg-[#B58E1E] active:bg-[#9E7B15] py-2.5 px-4 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Login</span>
            )}
          </button>
        </form>

        {/* Authorized Access Only Notice Box */}
        <div className="mt-5 rounded-xl border border-[#ECD59A]/80 bg-[#FAF4E6]/60 p-3.5 sm:p-4 flex items-start gap-3">
          <ShieldCheck
            className="h-5 w-5 text-[#C9A227] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="text-left">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
              Authorized Access Only
            </h2>
            <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
              This portal is for Jeffs Group Event Administrators. If you are
              not an authorized user, please contact the system administrator.
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <ForgotPasswordDialog
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        defaultEmail={email}
      />
    </div>
  );
};

export default LoginPage;
