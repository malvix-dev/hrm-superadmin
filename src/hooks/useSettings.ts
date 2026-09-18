import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/lib/api";

export interface OrgSettings {
  id: string;
  name: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  usdPerLot: number;
  pkrPerUsd: number;
  updatedAt: string;
}

const KEY = ["settings"] as const;

export function useSettings() {
  return useQuery({ queryKey: KEY, queryFn: () => apiGet<OrgSettings>("/settings"), staleTime: 10 * 60 * 1000 });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Omit<OrgSettings, "id" | "updatedAt">>) => apiPut<OrgSettings>("/settings", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
