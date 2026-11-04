import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard.api";

export function useDashboard(date?: string) {
  return useQuery({
    queryKey: ["dashboard", "summary", date || "today"],
    queryFn: () => dashboardApi.getSummary(date),
    staleTime: 1000 * 30, // 30 seconds
  });
}

