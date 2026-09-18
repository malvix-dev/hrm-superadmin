import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  _count?: { staff: number };
}

export interface RoleInput {
  name: string;
  permissions: string[];
}

const KEY = ["roles"] as const;

export function useRoles() {
  return useQuery<Role[]>({ queryKey: KEY, queryFn: () => apiGet("/roles") });
}

export function usePermissionsList() {
  return useQuery<string[]>({ queryKey: ["role-permissions"], queryFn: () => apiGet("/roles/permissions") });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RoleInput) => apiPost<Role>("/roles", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: RoleInput & { id: string }) => apiPut<Role>(`/roles/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/roles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
