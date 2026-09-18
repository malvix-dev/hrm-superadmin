import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

export interface Department {
  id: string;
  name: string;
  label: string;
  description?: string;
  headId?: string;
  headName?: string;
  scope?: "global" | "branch";
  officeId?: string | null;
  office?: { id: string; name: string; city: string } | null;
  createdAt: string;
  _count?: { employees: number };
}

export type DeptInput = {
  name: string;
  description?: string;
  headId?: string;
  headName?: string;
  scope?: "global" | "branch";
  officeId?: string;
};

const KEY = ["departments"] as const;

export function useDepartments() {
  return useQuery({ queryKey: KEY, queryFn: () => apiGet<Department[]>("/departments"), staleTime: 5 * 60 * 1000 });
}

export function useDepartment(id: string) {
  return useQuery({ queryKey: [...KEY, id], queryFn: () => apiGet<Department & { employees: any[]; designations: any[] }>(`/departments/${id}`) });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DeptInput) => apiPost<Department>("/departments", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: DeptInput & { id: string }) => apiPut<Department>(`/departments/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/departments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
