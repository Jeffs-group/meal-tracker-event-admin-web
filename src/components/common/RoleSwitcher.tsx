import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/api/users.api";
import { UserCheck } from "lucide-react";

export const RoleSwitcher: React.FC = () => {
  const isMock = import.meta.env.VITE_USE_MOCK !== "false";
  const queryClient = useQueryClient();

  const { data: usersData } = useQuery({
    queryKey: ["allUsersForSwitcher"],
    queryFn: () => usersApi.getUsers({ pageSize: 50 }),
    enabled: isMock,
  });

  const { data: currentPerms } = useQuery({
    queryKey: ["currentUserPermissions"],
    queryFn: () => usersApi.getCurrentUserPermissions(),
    enabled: isMock,
  });

  const switchMutation = useMutation({
    mutationFn: (userId: string) => usersApi.setActingUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  if (!isMock || !usersData?.items) {
    return null;
  }

  const currentUserId = currentPerms?.user?.id || usersData.items[0]?.id;

  return (
    <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-[#ECD59A] bg-[#FAF4E6]/90 px-2 py-1 text-xs">
      <UserCheck className="h-3.5 w-3.5 text-[#9B7415]" />
      <span className="font-bold text-[#644813] text-[11px] uppercase tracking-wider">
        Act as:
      </span>
      <select
        value={currentUserId}
        onChange={(e) => switchMutation.mutate(e.target.value)}
        disabled={switchMutation.isPending}
        className="rounded border border-[#DEC067] bg-white px-2 py-0.5 text-xs font-semibold text-slate-800 shadow-2xs outline-none focus:ring-1 focus:ring-[#9B7415] cursor-pointer"
        aria-label="Switch acting user persona"
      >
        {usersData.items.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.roleName}){" "}
            {u.status === "inactive" ? "[Inactive]" : ""}
          </option>
        ))}
      </select>
    </div>
  );
};

export default RoleSwitcher;
