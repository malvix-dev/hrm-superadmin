import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

export interface Office {
  id: string;
  name: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  managerName?: string;
  status: "active" | "inactive";
  usdPerLot: number;
  pkrPerUsd: number;
  latitude?: number | null;
  longitude?: number | null;
  geoRadius?: number;
  createdAt: string;
  updatedAt?: string;
}

export type OfficeInput = Omit<Office, "id" | "createdAt" | "updatedAt">;

const KEY = ["offices"] as const;

export function useOffices() {
  return useQuery({ queryKey: KEY, queryFn: () => apiGet<Office[]>("/offices"), staleTime: 5 * 60 * 1000 });
}

export function useCreateOffice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OfficeInput) => apiPost<Office>("/offices", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateOffice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<OfficeInput> & { id: string }) => apiPut<Office>(`/offices/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteOffice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/offices/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateOfficeCommission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, usdPerLot, pkrPerUsd }: { id: string; usdPerLot: number; pkrPerUsd: number }) =>
      apiPut<Office>(`/offices/${id}/commission`, { usdPerLot, pkrPerUsd }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
