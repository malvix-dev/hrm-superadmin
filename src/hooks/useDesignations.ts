import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

export interface Designation {
  id: string;
  title: string;
  label: string;
  departmentId?: string;
  department?: { id: string; name: string; label: string };
  description?: string;
  scope?: "global" | "branch";
  officeId?: string | null;
  office?: { id: string; name: string; city: string } | null;
  createdAt: string;
  _count?: { employees: number };
}

export type DesigInput = {
  title: string;
  departmentId?: string;
  description?: string;
  scope?: "global" | "branch";
  officeId?: string;
};

const KEY = ["designations"] as const;

export function useDesignations(departmentId?: string) {
  return useQuery({
    queryKey: [...KEY, { departmentId }],
    queryFn: () => apiGet<Designation[]>("/designations" + (departmentId ? `?departmentId=${departmentId}` : "")),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DesigInput) => apiPost<Designation>("/designations", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: DesigInput & { id: string }) => apiPut<Designation>(`/designations/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/designations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
