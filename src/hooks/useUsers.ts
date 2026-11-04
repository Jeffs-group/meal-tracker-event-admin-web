import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/api/users.api";
import type {
  UserListParams,
  UserListResponse,
  RoleListParams,
  RoleListResponse,
  CreateUserPayload,
  UpdateUserPayload,
  CreateRolePayload,
  UpdateRolePayload,
  UserStatus,
  RoleStatus,
} from "@/types/users.types";

export const USERS_QUERY_KEY = ["users"] as const;
export const ROLES_QUERY_KEY = ["roles"] as const;

export function useUsers(params: UserListParams = {}) {
  return useQuery<UserListResponse>({
    queryKey: [...USERS_QUERY_KEY, params],
    queryFn: () => usersApi.getUsers(params),
    placeholderData: (prev) => prev,
  });
}

export function useUser(id?: string) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, "detail", id],
    queryFn: () => (id ? usersApi.getUserById(id) : null),
    enabled: !!id,
  });
}

export function useRoles(params: RoleListParams = {}) {
  return useQuery<RoleListResponse>({
    queryKey: [...ROLES_QUERY_KEY, params],
    queryFn: () => usersApi.getRoles(params),
    placeholderData: (prev) => prev,
  });
}

export function useRole(id?: string) {
  return useQuery({
    queryKey: [...ROLES_QUERY_KEY, "detail", id],
    queryFn: () => (id ? usersApi.getRoleById(id) : null),
    enabled: !!id,
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();

  const invalidateUserRelated = () => {
    queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["currentUserPermissions"] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.createUser(payload),
    onSuccess: invalidateUserRelated,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      usersApi.updateUser(id, payload),
    onSuccess: invalidateUserRelated,
  });

  const setStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: UserStatus;
      notes?: string;
    }) => usersApi.setUserStatus(id, status, notes),
    onSuccess: invalidateUserRelated,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => usersApi.sendPasswordReset(id),
  });

  const resendCredentialsMutation = useMutation({
    mutationFn: (id: string) => usersApi.resendCredentials(id),
  });

  return {
    createUser: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    updateUser: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    setUserStatus: setStatusMutation.mutateAsync,
    isSettingStatus: setStatusMutation.isPending,
    statusError: setStatusMutation.error,

    sendPasswordReset: resetPasswordMutation.mutateAsync,
    isSendingReset: resetPasswordMutation.isPending,

    resendCredentials: resendCredentialsMutation.mutateAsync,
    isResendingCredentials: resendCredentialsMutation.isPending,
  };
}

export function useRoleMutations() {
  const queryClient = useQueryClient();

  const invalidateRoleRelated = () => {
    queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["currentUserPermissions"] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateRolePayload) => usersApi.createRole(payload),
    onSuccess: invalidateRoleRelated,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRolePayload }) =>
      usersApi.updateRole(id, payload),
    onSuccess: invalidateRoleRelated,
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => usersApi.duplicateRole(id),
    onSuccess: invalidateRoleRelated,
  });

  const setStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RoleStatus }) =>
      usersApi.setRoleStatus(id, status),
    onSuccess: invalidateRoleRelated,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.deleteRole(id),
    onSuccess: invalidateRoleRelated,
  });

  return {
    createRole: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    updateRole: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    duplicateRole: duplicateMutation.mutateAsync,
    isDuplicating: duplicateMutation.isPending,

    setRoleStatus: setStatusMutation.mutateAsync,
    isSettingStatus: setStatusMutation.isPending,

    deleteRole: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
