import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useOffice } from "@/contexts/OfficeContext";

export interface DashboardSummary {
  employees: {
    total: number;
    active: number;
    onLeave: number;
    terminated: number;
  };
  offices: Array<{ id: string; name: string; city: string; activeEmployees: number }>;
  todayAttendance: Record<string, number>;
  thisMonth: {
    salaryTotal: number;
    expensesTotal: number;
  };
  pendingLeaves: Array<{
    id: string;
    employeeId: string;
    employee: { id: string; fullName: string; officeId: string };
    leaveType: { name: string };
    days: number;
    startDate: string;
    endDate: string;
    status: string;
  }>;
  departments: Array<{ id: string; name: string; employeeCount: number }>;
}

export function useDashboard() {
  const { selectedOfficeId } = useOffice();
  const qs = selectedOfficeId && selectedOfficeId !== "all" ? `?officeId=${selectedOfficeId}` : "";
  return useQuery({
    queryKey: ["dashboard", selectedOfficeId],
    queryFn: () => apiGet<DashboardSummary>(`/dashboard/summary${qs}`),
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
