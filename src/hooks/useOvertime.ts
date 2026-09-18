import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

export interface OvertimeRecord {
  id: string;
  employeeId: string;
  officeId: string;
  date: string;
  startTime: string;
  endTime?: string | null;
  hours?: number | null;
  reason?: string | null;
  type: string;
  status: string;
  approvedById?: string | null;
  approvedByName?: string | null;
  rejectedReason?: string | null;
  note?: string | null;
  payAmount?: number | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    fullName: string;
    officeId: string;
    salary: number;
  };
}

export function useOvertime(filters?: { employeeId?: string; officeId?: string; status?: string; date?: string }) {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.set("employeeId", filters.employeeId);
  if (filters?.officeId) params.set("officeId", filters.officeId);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.date) params.set("date", filters.date);
  const qs = params.toString();

  return useQuery({
    queryKey: ["overtime", filters],
    queryFn: () => apiGet<OvertimeRecord[]>(`/overtime${qs ? `?${qs}` : ""}`),
    staleTime: 60 * 1000,
  });
}

export function useCreateOvertime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { employeeId: string; date: string; startTime: string; endTime: string; reason?: string; note?: string }) =>
      apiPost<OvertimeRecord>("/overtime", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["overtime"] }); qc.invalidateQueries({ queryKey: ["attendance"] }); },
  });
}

export function useUpdateOvertimeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, rejectedReason }: { id: string; status: "approved" | "rejected"; rejectedReason?: string }) =>
      apiPatch<OvertimeRecord>(`/overtime/${id}/status`, { status, rejectedReason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["overtime"] }); qc.invalidateQueries({ queryKey: ["attendance"] }); },
  });
}

export function useEditOvertime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, startTime, endTime, note }: { id: string; startTime?: string; endTime?: string; note?: string }) =>
      apiPatch<OvertimeRecord>(`/overtime/${id}`, { startTime, endTime, note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["overtime"] }),
  });
}

export function useDeleteOvertime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/overtime/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["overtime"] }),
  });
}
