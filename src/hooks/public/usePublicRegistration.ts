import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { publicApi } from "@/api/public.api";
import type { League } from "@/constants/leagues";
import type {
  PublicRegistrationPayload,
  PublicRegistrantRole,
} from "@/types/publicRegistration.types";
import { PUBLIC_REGISTRANT_ROLES } from "@/constants/publicRegistration";

export function usePublicConfig() {
  return useQuery({
    queryKey: ["publicRegistrationConfig"],
    queryFn: () => publicApi.getConfig(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublicRegistrationMeta() {
  return useQuery({
    queryKey: ["publicRegistrationMeta"],
    queryFn: () => publicApi.getMeta(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublicTeams(league?: League) {
  return useQuery({
    queryKey: ["publicTeams", league],
    queryFn: () => publicApi.getTeams(league),
    enabled: !!league,
    staleTime: 60 * 1000,
  });
}

export function useSubmitPublicRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: PublicRegistrationPayload;
      idempotencyKey?: string;
    }) => publicApi.submitRegistration(payload, idempotencyKey),
    onSuccess: () => {
      // Invalidate admin queries so submissions immediately appear in admin tabs
      queryClient.invalidateQueries({ queryKey: ["teamRegistrations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      queryClient.invalidateQueries({ queryKey: ["manageTeams"] });
    },
  });
}

/**
 * URL Prefill hook for shareable links:
 * e.g. /register?league=KSPL&team=TM-KSPL-001&role=player
 * Validates against loaded public teams list.
 */
export function useRegistrationPrefill(leagueSelected?: League) {
  const [searchParams] = useSearchParams();
  const rawLeague = searchParams.get("league")?.toUpperCase();
  const rawTeam = searchParams.get("team")?.trim();
  const rawRole = searchParams.get("role")?.toUpperCase();

  const validatedLeague: League | undefined =
    rawLeague === "KSPL" || rawLeague === "ISCL"
      ? (rawLeague as League)
      : undefined;

  const activeLeague = leagueSelected || validatedLeague;
  const { data: teams = [], isLoading: isTeamsLoading } =
    usePublicTeams(activeLeague);

  const prefill = useMemo(() => {
    // 1. Validate League
    const league = validatedLeague;

    // 2. Validate Role
    let role: PublicRegistrantRole | undefined = undefined;
    if (rawRole) {
      const match = PUBLIC_REGISTRANT_ROLES.find(
        (r) => r.value === rawRole || r.label.toUpperCase() === rawRole,
      );
      if (match) role = match.value;
    }

    // 3. Validate Team
    let teamId: string | undefined = undefined;
    let lockedTeamName: string | undefined = undefined;
    let isTeamLocked = false;

    if (rawTeam && teams.length > 0) {
      const cleanTarget = rawTeam.toUpperCase();
      const matchedTeam = teams.find(
        (t) =>
          t.id.toUpperCase() === cleanTarget ||
          t.teamCode.toUpperCase() === cleanTarget ||
          t.name.toUpperCase() === cleanTarget,
      );

      if (matchedTeam) {
        teamId = matchedTeam.id;
        lockedTeamName = matchedTeam.name;
        isTeamLocked = true;
      }
    }

    return {
      prefilledLeague: league,
      prefilledTeamId: teamId,
      prefilledRole: role,
      lockedTeamName,
      isTeamLocked,
    };
  }, [validatedLeague, rawTeam, rawRole, teams]);

  return {
    ...prefill,
    isTeamsLoading,
  };
}
