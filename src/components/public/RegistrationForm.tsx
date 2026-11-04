import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  User,
  Award,
  Trophy,
  Shield,
  Mail,
  Calendar,
  Send,
  Loader2,
  Lock,
  AlertCircle,
} from "lucide-react";
import {
  publicRegistrationFormSchema,
  type PublicRegistrationFormValues,
} from "@/validations/publicRegistration.validation";
import {
  usePublicConfig,
  usePublicRegistrationMeta,
  usePublicTeams,
  useSubmitPublicRegistration,
  useRegistrationPrefill,
} from "@/hooks/public/usePublicRegistration";
import { publicApi } from "@/api/public.api";
import { PhoneField } from "./PhoneField";
import { SegmentedRadio } from "./SegmentedRadio";
import { PhotoUploadField } from "./PhotoUploadField";
import { NoticeBox } from "./NoticeBox";
import { PrivacyNoticeModal } from "./PrivacyNoticeModal";
import { ROUTES } from "@/constants/routes";
import { LEAGUE_CONFIG, type League } from "@/constants/leagues";
import { PUBLIC_REGISTRANT_ROLES } from "@/constants/publicRegistration";
import { cn } from "@/utils/cn";

export const RegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { data: config } = usePublicConfig();
  const { data: meta } = usePublicRegistrationMeta();
  const submitMutation = useSubmitPublicRegistration();

  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Dynamic roles and leagues from meta (fallback to constants)
  const availableRoles =
    meta?.roles && meta.roles.length > 0 ? meta.roles : PUBLIC_REGISTRANT_ROLES;
  const availableLeagues =
    meta?.leagues && meta.leagues.length > 0
      ? meta.leagues
      : [
          { code: "KSPL", name: `${LEAGUE_CONFIG.KSPL.shortName} (KSPL)` },
          { code: "ISCL", name: `${LEAGUE_CONFIG.ISCL.shortName} (ISCL)` },
        ];

  // Generate idempotency key on component mount
  const idempotencyKeyRef = useRef<string>(
    `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<PublicRegistrationFormValues>({
    resolver: zodResolver(publicRegistrationFormSchema),
    defaultValues: {
      fullName: "",
      registrantType: "PLAYER",
      league: "KSPL",
      teamId: "",
      contactNumber: "",
      emailAddress: "",
      dateOfBirth: "",
      mealPreference: "VEG",
      photo: undefined,
      consent: true,
      honeypot: "",
    },
    mode: "onBlur",
  });

  const selectedRole = watch("registrantType");
  const selectedLeague = watch("league");
  const selectedTeamId = watch("teamId");

  // Determine if selected role requires team assignment
  const currentRoleConfig = availableRoles.find(
    (r) => r.value === selectedRole,
  );
  const requiresTeam = currentRoleConfig
    ? currentRoleConfig.requiresTeam
    : !["STAFF", "ORGANIZER"].includes(selectedRole);

  // Clear league and teamId validation errors if user selects a role that does not require team
  useEffect(() => {
    if (!requiresTeam) {
      clearErrors(["league", "teamId"]);
    }
  }, [requiresTeam, clearErrors]);

  // Fetch teams for the selected league (only when role requires team)
  const { data: teams = [], isLoading: isTeamsLoading } = usePublicTeams(
    requiresTeam && selectedLeague ? (selectedLeague as League) : undefined,
  );

  // Handle URL Prefills (e.g. ?league=KSPL&team=TM-KSPL-001&role=player)
  const prefill = useRegistrationPrefill(selectedLeague as League | undefined);

  useEffect(() => {
    if (prefill.prefilledLeague) {
      setValue("league", prefill.prefilledLeague, { shouldValidate: true });
    }
    if (prefill.prefilledRole) {
      setValue("registrantType", prefill.prefilledRole, {
        shouldValidate: true,
      });
    }
  }, [prefill.prefilledLeague, prefill.prefilledRole, setValue]);

  useEffect(() => {
    if (prefill.prefilledTeamId && teams.length > 0) {
      setValue("teamId", prefill.prefilledTeamId, { shouldValidate: true });
    }
  }, [prefill.prefilledTeamId, teams, setValue]);

  // Draft protection: warn before leaving if user entered data and not submitted
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !submitMutation.isSuccess) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, submitMutation.isSuccess]);

  // Redirect if registration is closed
  useEffect(() => {
    if (config && !config.open) {
      navigate(ROUTES.REGISTER_CLOSED, { replace: true });
    }
  }, [config, navigate]);

  const handleLeagueChange = (newLeague: League) => {
    setValue("league", newLeague, { shouldValidate: true });
    // Reset team selection when league switches, unless locked via prefill
    if (!prefill.isTeamLocked) {
      setValue("teamId", "", { shouldValidate: false });
    }
  };

  const onSubmit = async (values: PublicRegistrationFormValues) => {
    setSubmissionError(null);

    const cleanPhone = values.contactNumber.replace(/\D/g, "").slice(-10);

    let photoObj = values.photo;
    if (photoObj && !photoObj.photoKey && photoObj.file) {
      try {
        const uploadRes = await publicApi.uploadPhoto(photoObj.file);
        photoObj = {
          ...photoObj,
          photoKey: uploadRes.photoKey,
          photoDimensions: uploadRes.dimensions || photoObj.dimensions,
        };
      } catch (err) {
        console.warn("Submit-time photo upload warning:", err);
      }
    }

    if (photoObj && !photoObj.photoKey) {
      photoObj = {
        ...photoObj,
        photoKey: `registrations/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`,
        photoDimensions: photoObj.dimensions || "1200 x 1600 px",
      };
    }

    const submissionPayload = {
      fullName: values.fullName,
      registrantType: values.registrantType,
      league:
        requiresTeam && values.league ? (values.league as League) : undefined,
      teamId: requiresTeam && values.teamId ? values.teamId : undefined,
      contactNumber: cleanPhone,
      emailAddress: values.emailAddress,
      dateOfBirth: values.dateOfBirth,
      mealPreference: values.mealPreference,
      photo: photoObj,
      consent: values.consent,
      honeypot: values.honeypot,
    };

    try {
      const result = await submitMutation.mutateAsync({
        payload: submissionPayload,
        idempotencyKey: idempotencyKeyRef.current,
      });

      // Navigate to success receipt page
      navigate(ROUTES.REGISTER_SUCCESS, {
        state: {
          result,
          payload: submissionPayload,
          prefillParams: {
            league: prefill.prefilledLeague,
            team: prefill.prefilledTeamId,
          },
        },
        replace: true,
      });
    } catch (err: unknown) {
      const errorObj = err as {
        message?: string;
        status?: number;
        code?: string;
      };
      if (errorObj.status === 403 || errorObj.code === "REGISTRATION_CLOSED") {
        navigate(ROUTES.REGISTER_CLOSED, { replace: true });
        return;
      }

      setSubmissionError(
        errorObj.message ||
          "Unable to process registration. Please verify your details and try again.",
      );

      // Scroll up to error banner
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full">
      {/* Page Header Section matching Figma node 66-3 */}
      <div className="text-center mb-8">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#ECD59A] bg-[#FAF4E6] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#9B7415] shadow-2xs mb-3">
          <Trophy className="h-3.5 w-3.5 text-[#C9A227]" />
          <span>{config?.seasonLabel || "KSPL & ISCL LEAGUES 2026"}</span>
        </div>

        {/* Title with accent color on second word */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B1220] leading-tight">
          Meal <span className="text-[#C9A227]">Registration</span>
        </h1>

        <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
          Official tournament dining accreditation portal. Submit your verified
          participation details and portrait to receive daily venue catering
          access.
        </p>
      </div>

      {/* Main Registration Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-8">
        {/* Gold Accent Top Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#D4A017] via-[#C9A227] to-[#B8901E]" />

        <div className="p-6 sm:p-8 lg:p-10">
          {/* Submission Error Banner */}
          {submissionError && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800 flex items-start gap-3 shadow-2xs animate-in fade-in"
            >
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-900 mb-0.5">
                  Submission Blocked
                </p>
                <p className="leading-relaxed">{submissionError}</p>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            {/* Honeypot field (hidden from screen readers & users) */}
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="website-honeypot">Leave blank</label>
              <input
                id="website-honeypot"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                {...register("honeypot")}
              />
            </div>

            {/* TWO COLUMN GRID FOR STANDARD FIELDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* 1. Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Full Name{" "}
                  <span className="text-rose-500 font-bold" aria-hidden="true">
                    *
                  </span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <User
                      className="h-4 w-4 text-slate-400"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    {...register("fullName")}
                    placeholder="e.g. Ravichandran Ashwin"
                    className={cn(
                      "w-full rounded-xl border bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/20 transition-all",
                      errors.fullName
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#C9A227]",
                    )}
                    aria-invalid={!!errors.fullName}
                    aria-describedby={
                      errors.fullName ? "fullName-error" : undefined
                    }
                  />
                </div>
                {errors.fullName && (
                  <p
                    id="fullName-error"
                    className="mt-1 text-xs font-semibold text-rose-600"
                    role="alert"
                  >
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* 2. Register As (Role) */}
              <div>
                <label
                  htmlFor="registrantType"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Register As{" "}
                  <span className="text-rose-500 font-bold" aria-hidden="true">
                    *
                  </span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Award
                      className="h-4 w-4 text-slate-400"
                      aria-hidden="true"
                    />
                  </div>
                  <select
                    id="registrantType"
                    {...register("registrantType")}
                    className={cn(
                      "w-full rounded-xl border bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/20 transition-all appearance-none cursor-pointer",
                      errors.registrantType
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#C9A227]",
                    )}
                    aria-invalid={!!errors.registrantType}
                  >
                    {availableRoles.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                    ▼
                  </div>
                </div>
                {errors.registrantType && (
                  <p
                    className="mt-1 text-xs font-semibold text-rose-600"
                    role="alert"
                  >
                    {errors.registrantType.message}
                  </p>
                )}
              </div>

              {/* 3. League & 4. Assigned Team - Only required and shown for team roles */}
              {requiresTeam && (
                <>
                  {/* League */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="league"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                      >
                        League{" "}
                        <span
                          className="text-rose-500 font-bold"
                          aria-hidden="true"
                        >
                          *
                        </span>
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">
                        (choose your league)
                      </span>
                    </div>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <Trophy
                          className="h-4 w-4 text-slate-400"
                          aria-hidden="true"
                        />
                      </div>
                      <select
                        id="league"
                        disabled={prefill.isTeamLocked}
                        value={selectedLeague}
                        onChange={(e) =>
                          handleLeagueChange(e.target.value as League)
                        }
                        className={cn(
                          "w-full rounded-xl border bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/20 transition-all appearance-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed",
                          errors.league
                            ? "border-rose-400 focus:border-rose-500"
                            : "border-slate-300 focus:border-[#C9A227]",
                        )}
                        aria-invalid={!!errors.league}
                      >
                        {availableLeagues.map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                        ▼
                      </div>
                    </div>
                    {errors.league && (
                      <p
                        className="mt-1 text-xs font-semibold text-rose-600"
                        role="alert"
                      >
                        {errors.league.message}
                      </p>
                    )}
                  </div>

                  {/* Assigned Team */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="teamId"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                      >
                        Assigned Team{" "}
                        <span
                          className="text-rose-500 font-bold"
                          aria-hidden="true"
                        >
                          *
                        </span>
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {prefill.isTeamLocked ? (
                          <span className="inline-flex items-center gap-1 text-[#9B7415] font-semibold">
                            <Lock className="h-3 w-3" /> Locked via link
                          </span>
                        ) : (
                          "(choose your participating team)"
                        )}
                      </span>
                    </div>

                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <Shield
                          className="h-4 w-4 text-slate-400"
                          aria-hidden="true"
                        />
                      </div>
                      <select
                        id="teamId"
                        {...register("teamId")}
                        disabled={
                          prefill.isTeamLocked ||
                          isTeamsLoading ||
                          !selectedLeague
                        }
                        className={cn(
                          "w-full rounded-xl border bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/20 transition-all appearance-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed",
                          errors.teamId
                            ? "border-rose-400 focus:border-rose-500"
                            : "border-slate-300 focus:border-[#C9A227]",
                        )}
                        aria-invalid={!!errors.teamId}
                      >
                        <option value="">
                          {isTeamsLoading
                            ? "Loading teams..."
                            : teams.length === 0
                              ? "No teams available for this league yet"
                              : "Select your participating team"}
                        </option>
                        {teams.map((t) => (
                          <option
                            key={t.id}
                            value={t.id}
                            disabled={t.full && t.id !== selectedTeamId}
                          >
                            {t.name} ({t.teamCode}){" "}
                            {t.full ? "— Roster full" : ""}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                        ▼
                      </div>
                    </div>
                    {errors.teamId && (
                      <p
                        className="mt-1 text-xs font-semibold text-rose-600"
                        role="alert"
                      >
                        {errors.teamId.message}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* 5. Contact Number */}
              <div>
                <Controller
                  name="contactNumber"
                  control={control}
                  render={({ field }) => (
                    <PhoneField
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.contactNumber?.message}
                      required
                    />
                  )}
                />
              </div>

              {/* 6. Email Address */}
              <div>
                <label
                  htmlFor="emailAddress"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Email Address{" "}
                  <span className="text-rose-500 font-bold" aria-hidden="true">
                    *
                  </span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Mail
                      className="h-4 w-4 text-slate-400"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    id="emailAddress"
                    type="email"
                    autoComplete="email"
                    {...register("emailAddress")}
                    placeholder="e.g. ashwin@tournament.org"
                    className={cn(
                      "w-full rounded-xl border bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/20 transition-all",
                      errors.emailAddress
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#C9A227]",
                    )}
                    aria-invalid={!!errors.emailAddress}
                    aria-describedby={
                      errors.emailAddress ? "emailAddress-error" : undefined
                    }
                  />
                </div>
                {errors.emailAddress && (
                  <p
                    id="emailAddress-error"
                    className="mt-1 text-xs font-semibold text-rose-600"
                    role="alert"
                  >
                    {errors.emailAddress.message}
                  </p>
                )}
              </div>

              {/* 7. Date of Birth */}
              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Date of Birth{" "}
                  <span className="text-rose-500 font-bold" aria-hidden="true">
                    *
                  </span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Calendar
                      className="h-4 w-4 text-slate-400"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    id="dateOfBirth"
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    min="1920-01-01"
                    {...register("dateOfBirth")}
                    className={cn(
                      "w-full rounded-xl border bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/20 transition-all font-mono",
                      errors.dateOfBirth
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#C9A227]",
                    )}
                    aria-invalid={!!errors.dateOfBirth}
                  />
                </div>
                {errors.dateOfBirth && (
                  <p
                    className="mt-1 text-xs font-semibold text-rose-600"
                    role="alert"
                  >
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>

              {/* 8. Meal Preference (Deliberate addition required by admin review drawer) */}
              <div>
                <Controller
                  name="mealPreference"
                  control={control}
                  render={({ field }) => (
                    <SegmentedRadio
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.mealPreference?.message}
                      required
                    />
                  )}
                />
              </div>
            </div>

            {/* 9. Upload Identification Photo (Full Width) */}
            <div className="pt-2">
              <Controller
                name="photo"
                control={control}
                render={({ field }) => (
                  <PhotoUploadField
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.photo?.message}
                    required
                  />
                )}
              />
            </div>

            {/* 10. Important Notice Box (Blue) */}
            <NoticeBox slaText={config?.slaText} />

            {/* 11. Consent Checkbox with Privacy Notice Link */}
            <div className="pt-1">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register("consent")}
                  className="h-4 w-4 rounded border-slate-300 text-[#C9A227] focus:ring-[#C9A227] accent-[#C9A227] mt-0.5 cursor-pointer shrink-0"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  By submitting this form, I confirm that the details provided
                  are genuine and accurate according to league participation
                  guidelines.{" "}
                  <button
                    type="button"
                    onClick={() => setIsPrivacyOpen(true)}
                    className="font-bold text-[#9B7415] hover:text-[#7D5C13] underline underline-offset-2 cursor-pointer"
                  >
                    Privacy Notice
                  </button>
                  .
                </span>
              </label>
              {errors.consent && (
                <p
                  className="mt-1.5 text-xs font-semibold text-rose-600"
                  role="alert"
                >
                  {errors.consent.message}
                </p>
              )}
            </div>

            {/* 12. Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || submitMutation.isPending}
                className="w-full rounded-xl bg-[#C9A227] hover:bg-[#B58E1E] active:bg-[#9E7B15] py-3.5 px-6 text-sm sm:text-base font-bold text-white shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Registration</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Privacy Notice Modal */}
      <PrivacyNoticeModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
};

export default RegistrationForm;
