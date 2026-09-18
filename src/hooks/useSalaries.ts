import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

export interface SalaryPayment {
  id: string;
  employeeId: string;
  employee?: { id: string; fullName: string; salary: number };
  officeId: string;
  month: string;
  type: "salary" | "advance" | "commission" | "deduction";
  baseSalary: number;
  commission: number;
  deduction: number;
  advance: number;
  netPaid: number;
  lots?: number;
  note?: string;
  paidAt: string;
  createdAt: string;
}

export type SalaryInput = {
  employeeId: string;
  officeId: string;
  month: string;
  type?: "salary" | "advance" | "commission" | "deduction";
  baseSalary?: number;
  commission?: number;
  deduction?: number;
  advance?: number;
  netPaid: number;
  lots?: number;
  note?: string;
  paidAt?: string;
};

const KEY = ["salaries"] as const;

export function useSalaries(filters?: { officeId?: string; month?: string; employeeId?: string }) {
  const params = new URLSearchParams();
  if (filters?.officeId && filters.officeId !== "all") params.set("officeId", filters.officeId);
  if (filters?.month) params.set("month", filters.month);
  if (filters?.employeeId) params.set("employeeId", filters.employeeId);
  const qs = params.toString();
  return useQuery({
    queryKey: [...KEY, filters],
    queryFn: () => apiGet<SalaryPayment[]>(`/salaries${qs ? `?${qs}` : ""}`),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateSalary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SalaryInput) => apiPost<SalaryPayment>("/salaries", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useUpdateSalary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<SalaryInput> & { id: string }) => apiPut<SalaryPayment>(`/salaries/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteSalary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/salaries/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}
