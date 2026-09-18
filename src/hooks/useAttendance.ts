import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

export type AttendanceStatus = "present" | "absent" | "half_day" | "late" | "on_leave";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employee?: { id: string; fullName: string; officeId: string };
  officeId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  note?: string;
  createdAt: string;
}

export type AttendanceInput = {
  employeeId: string;
  officeId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  note?: string;
};

const KEY = ["attendance"] as const;

export function useAttendance(filters?: { date?: string; officeId?: string; employeeId?: string; month?: string }) {
  const params = new URLSearchParams();
  if (filters?.date) params.set("date", filters.date);
  if (filters?.officeId && filters.officeId !== "all") params.set("officeId", filters.officeId);
  if (filters?.employeeId) params.set("employeeId", filters.employeeId);
  if (filters?.month) params.set("month", filters.month);
  const qs = params.toString();
  return useQuery({
    queryKey: [...KEY, filters],
    queryFn: () => apiGet<AttendanceRecord[]>(`/attendance${qs ? `?${qs}` : ""}`),
    staleTime: 60 * 1000,
  });
}

export function useUpsertAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AttendanceInput) => apiPost<AttendanceRecord>("/attendance", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useBulkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { officeId: string; date: string; status: AttendanceStatus; employeeIds: string[] }) =>
      apiPost<{ count: number }>("/attendance/bulk", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<AttendanceInput> & { id: string }) =>
      apiPut<AttendanceRecord>(`/attendance/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/attendance/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
