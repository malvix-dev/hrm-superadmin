import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

export type StaffRole = "super_admin" | "org_owner" | "area_manager" | "branch_manager" | "finance_manager" | "hr_manager";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  branchId?: string;
  employeeId?: string;
  branch?: { id: string; name: string };
  branches?: { id: string; name: string }[];
  employee?: { id: string; fullName: string; phone?: string; cnic?: string; designation?: { title: string; label?: string } };
  createdAt: string;
}

export type StaffInput = {
  name: string;
  email: string;
  password?: string;
  role: StaffRole;
  branchId?: string;
  branchIds?: string[];
  employeeId?: string | null;
};

const KEY = ["staff"] as const;

export function useStaffList() {
  return useQuery({ queryKey: KEY, queryFn: () => apiGet<StaffMember[]>("/staff"), staleTime: 5 * 60 * 1000 });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StaffInput & { password: string }) => apiPost<StaffMember>("/staff", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<StaffInput> & { id: string }) => apiPut<StaffMember>(`/staff/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/staff/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMyProfile() {
  return useQuery({ queryKey: ["staff-me"], queryFn: () => apiGet<StaffMember>("/staff/me"), staleTime: 5 * 60 * 1000 });
}

export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) =>
      apiPut<StaffMember>("/staff/me", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-me"] }),
  });
}
