import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete, apiFetch } from "@/lib/api";

export interface SalaryHistoryRecord {
  id: string;
  employeeId: string;
  oldSalary: number;
  newSalary: number;
  reason?: string;
  changedBy?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  officeId: string;
  office?: { id: string; name: string };
  departmentId?: string;
  department?: { id: string; name: string; label: string };
  designationId?: string;
  designation?: { id: string; title: string; label: string };
  fullName: string;
  fatherName?: string;
  cnic?: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  emergencyName?: string;
  emergencyRelation?: string;
  emergencyPhone?: string;
  emergencyAltPhone?: string;
  guardianName?: string;
  guardianCnic?: string;
  guardianPhone?: string;
  guardianAddress?: string;
  dutyType?: string;
  joinDate?: string;
  salary: number;
  status: "active" | "inactive" | "terminated" | "on_leave";
  hasCv?: boolean;
  hasNic?: boolean;
  hasPhoto?: boolean;
  hasDegree?: boolean;
  hasContract?: boolean;
  hasPoliceVerification?: boolean;
  bloodGroup?: string;
  medicalHistory?: string;
  disabilities?: string;
  lastEducation?: string;
  educationInstitute?: string;
  educationYear?: string;
  totalExperience?: string;
  previousEmployer?: string;
  previousDesignation?: string;
  activeDeviceId?: string | null;
  activeDeviceInfo?: { manufacturer?: string; model?: string; os?: string } | null;
  lockedUntil?: string | null;
  updatedAt?: string;
  createdAt: string;
}

export type EmployeeInput = Omit<Employee, "id" | "createdAt" | "office" | "department" | "designation">;

const KEY = ["employees"] as const;

export function useEmployees(filters?: { officeId?: string; status?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.officeId && filters.officeId !== "all") params.set("officeId", filters.officeId);
  if (filters?.status && filters.status !== "all") params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);
  const qs = params.toString();
  return useQuery({
    queryKey: [...KEY, filters],
    queryFn: () => apiGet<Employee[]>(`/employees${qs ? `?${qs}` : ""}`),
    staleTime: 2 * 60 * 1000,
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => apiGet<Employee>(`/employees/${id}`),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EmployeeInput) => apiPost<Employee>("/employees", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<EmployeeInput> & { id: string }) => apiPut<Employee>(`/employees/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, vars.id] });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/employees/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUnlockEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost(`/employees/${id}/unlock`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export interface EmployeeSession {
  id: string;
  employeeId: string;
  event: "login" | "logout" | "cooldown_started" | "cooldown_ended";
  deviceId?: string | null;
  deviceInfo?: { manufacturer?: string; model?: string; os?: string } | null;
  performedBy?: string | null;
  performedByRole?: string | null;
  note?: string | null;
  createdAt: string;
}

export function useEmployeeSessions(employeeId: string) {
  return useQuery({
    queryKey: ["employee-sessions", employeeId],
    queryFn: () => apiGet<EmployeeSession[]>(`/employees/${employeeId}/sessions`),
    enabled: !!employeeId,
    staleTime: 30 * 1000,
  });
}

export function useSalaryHistory(employeeId: string) {
  return useQuery({
    queryKey: ["salary-history", employeeId],
    queryFn: () => apiGet<SalaryHistoryRecord[]>(`/employees/${employeeId}/salary-history`),
    enabled: !!employeeId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateEmployeeSalary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newSalary, reason }: { id: string; newSalary: number; reason?: string }) =>
      apiPost<Employee>(`/employees/${id}/salary`, { newSalary, reason }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, vars.id] });
      qc.invalidateQueries({ queryKey: ["salary-history", vars.id] });
    },
  });
}

export interface AdvanceRecord {
  id: string;
  employeeId: string;
  amount: number;
  reason?: string;
  date: string;
  createdAt: string;
}

export function useAdvances(employeeId: string) {
  return useQuery({
    queryKey: ["advances", employeeId],
    queryFn: () => apiGet<AdvanceRecord[]>(`/employees/${employeeId}/advances`),
    enabled: !!employeeId,
  });
}

export function useCreateAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, amount, reason, date }: { employeeId: string; amount: number; reason?: string; date?: string }) =>
      apiPost<AdvanceRecord>(`/employees/${employeeId}/advances`, { amount, reason, date }),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["advances", vars.employeeId] }),
  });
}

export function useDeleteAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, advanceId }: { employeeId: string; advanceId: string }) =>
      apiDelete(`/employees/${employeeId}/advances/${advanceId}`),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["advances", vars.employeeId] }),
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, file, docType }: { employeeId: string; file: File; docType: string }) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("docType", docType);
      const res = await apiFetch(`/employees/${employeeId}/documents`, {
        method: "POST",
        body: fd,
        headers: {},
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Upload failed");
      }
      return res.json() as Promise<{ url: string; key: string; docType: string }>;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, vars.employeeId] });
    },
  });
}
