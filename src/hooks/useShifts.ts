import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from "@/lib/api";

export interface Shift {
  id: string;
  officeId: string;
  name: string;
  startTime: string;
  endTime: string;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  breakDuration: number;
  gracePeriod: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { employees: number };
}

export function useShifts(officeId?: string) {
  return useQuery({
    queryKey: ["shifts", officeId],
    queryFn: () => apiGet<Shift[]>(`/shifts${officeId ? `?officeId=${officeId}` : ""}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Shift>) => apiPost<Shift>("/shifts", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shifts"] }),
  });
}

export function useUpdateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Shift> & { id: string }) => apiPut<Shift>(`/shifts/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shifts"] }),
  });
}

export function useDeleteShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/shifts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shifts"] }),
  });
}

export function useAssignShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shiftId, employeeIds }: { shiftId: string; employeeIds: string[] }) =>
      apiPatch(`/shifts/${shiftId}/assign`, { employeeIds }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shifts"] }); qc.invalidateQueries({ queryKey: ["employees"] }); },
  });
}
