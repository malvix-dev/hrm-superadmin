import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

export interface LeaveType {
  id: string;
  name: string;
  daysAllowed: number;
  color: string;
  createdAt: string;
}

export interface OfficialHoliday {
  id: string;
  name: string;
  date: string;
  days: number;
  description?: string;
  recurring: boolean;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee?: { id: string; fullName: string; officeId: string };
  leaveTypeId: string;
  leaveType?: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  isHalfDay?: boolean;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  reportingTo?: string;
  approvedById?: string;
  approvedAt?: string;
  rejectedReason?: string;
  deductionAmount?: number | null;
  createdAt: string;
}

// ── Leave Types ───────────────────────────────────────────────────────────────

export function useLeaveTypes() {
  return useQuery({ queryKey: ["leaveTypes"], queryFn: () => apiGet<LeaveType[]>("/leaves/types"), staleTime: 10 * 60 * 1000 });
}

export function useCreateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; daysAllowed?: number; color?: string }) => apiPost<LeaveType>("/leaves/types", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leaveTypes"] }),
  });
}

export function useUpdateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; daysAllowed?: number; color?: string }) =>
      apiPut<LeaveType>(`/leaves/types/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leaveTypes"] }),
  });
}

export function useDeleteLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/leaves/types/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leaveTypes"] }),
  });
}

// ── Official Holidays ─────────────────────────────────────────────────────────

export function useHolidays() {
  return useQuery({ queryKey: ["holidays"], queryFn: () => apiGet<OfficialHoliday[]>("/leaves/holidays"), staleTime: 10 * 60 * 1000 });
}

export function useCreateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; date: string; days?: number; description?: string; recurring?: boolean }) =>
      apiPost<OfficialHoliday>("/leaves/holidays", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holidays"] }),
  });
}

export function useUpdateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; date?: string; days?: number; description?: string; recurring?: boolean }) =>
      apiPut<OfficialHoliday>(`/leaves/holidays/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holidays"] }),
  });
}

export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/leaves/holidays/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holidays"] }),
  });
}

// ── Leave Requests ────────────────────────────────────────────────────────────

const LEAVES_KEY = ["leaves"] as const;

export function useLeaves(filters?: { status?: string; employeeId?: string; officeId?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.employeeId) params.set("employeeId", filters.employeeId);
  if (filters?.officeId && filters.officeId !== "all") params.set("officeId", filters.officeId);
  const qs = params.toString();
  return useQuery({
    queryKey: [...LEAVES_KEY, filters],
    queryFn: () => apiGet<LeaveRequest[]>(`/leaves${qs ? `?${qs}` : ""}`),
    staleTime: 60 * 1000,
  });
}

export function useCreateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { employeeId: string; leaveTypeId: string; startDate: string; endDate: string; days: number; isHalfDay?: boolean; reason?: string; reportingTo?: string }) =>
      apiPost<LeaveRequest>("/leaves", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEAVES_KEY }),
  });
}

export function useUpdateLeaveStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, rejectedReason }: { id: string; status: "approved" | "rejected"; rejectedReason?: string }) => {
      const { apiFetch } = await import("@/lib/api");
      const res = await apiFetch(`/leaves/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, rejectedReason }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Failed"); }
      return res.json() as Promise<LeaveRequest>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LEAVES_KEY }),
  });
}

export function useDeleteLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/leaves/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEAVES_KEY }),
  });
}

export interface LeaveBalance {
  leaveTypeId: string;
  name: string;
  color: string;
  daysAllowed: number;
  usedDays: number;
  remainingDays: number;
}

export function useLeaveBalance(employeeId: string) {
  return useQuery({
    queryKey: ["leave-balance", employeeId],
    queryFn: () => apiGet<LeaveBalance[]>(`/leaves/balance/${employeeId}`),
    enabled: !!employeeId,
    staleTime: 2 * 60 * 1000,
  });
}
