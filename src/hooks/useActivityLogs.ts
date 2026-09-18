import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  entityName: string;
  description: string;
  performedById: string;
  performedBy: string;
  performedByRole: string;
  officeId?: string;
  officeName?: string;
  createdAt: string;
}

export interface ActivityLogsResponse {
  logs: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Filters {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  role?: string;
  search?: string;
  officeId?: string;
}

export function useActivityLogs(filters: Filters = {}) {
  const params = new URLSearchParams();
  if (filters.page)     params.set("page",     String(filters.page));
  if (filters.limit)    params.set("limit",    String(filters.limit));
  if (filters.action && filters.action !== "all")  params.set("action",  filters.action);
  if (filters.entity && filters.entity !== "all")  params.set("entity",  filters.entity);
  if (filters.role   && filters.role   !== "all")  params.set("role",    filters.role);
  if (filters.search?.trim())                       params.set("search",  filters.search.trim());
  if (filters.officeId)                             params.set("officeId", filters.officeId);

  const qs = params.toString();
  return useQuery<ActivityLogsResponse>({
    queryKey: ["activity-logs", filters],
    queryFn: () => apiGet<ActivityLogsResponse>(`/activity-logs${qs ? `?${qs}` : ""}`),
    staleTime: 30 * 1000,
  });
}
