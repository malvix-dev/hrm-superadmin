import { useState } from "react";
import {
  UserPlus, UserCog, Pencil, Trash2, Banknote, Receipt, Building2,
  Clock, Filter, Search, AlertCircle, Shield,
  Users, DollarSign, FileText, RefreshCw, LogIn,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActivityLogs } from "@/hooks/useActivityLogs";

// ── Config maps ───────────────────────────────────────────────────────────────
type ActionType = "created" | "updated" | "deleted" | "login" | "payment" | "approved" | "rejected";
type EntityType = "employee" | "branch" | "salary" | "expense" | "leave" | "attendance" | "department" | "designation" | "staff" | "settings";

const ACTION_CONFIG: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  created:  { label: "Created",  color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", Icon: UserPlus },
  updated:  { label: "Updated",  color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",             Icon: Pencil },
  deleted:  { label: "Deleted",  color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",                 Icon: Trash2 },
  login:    { label: "Login",    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",     Icon: LogIn },
  payment:  { label: "Payment",  color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",     Icon: Banknote },
  approved: { label: "Approved", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",             Icon: FileText },
  rejected: { label: "Rejected", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",     Icon: AlertCircle },
};

const ENTITY_CONFIG: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  employee:    { label: "Employee",    Icon: Users,       color: "text-primary" },
  branch:      { label: "Branch",      Icon: Building2,   color: "text-violet-500" },
  salary:      { label: "Salary",      Icon: Banknote,    color: "text-emerald-500" },
  expense:     { label: "Expense",     Icon: Receipt,     color: "text-orange-500" },
  leave:       { label: "Leave",       Icon: FileText,    color: "text-blue-500" },
  attendance:  { label: "Attendance",  Icon: Clock,       color: "text-teal-500" },
  department:  { label: "Department",  Icon: Users,       color: "text-pink-500" },
  designation: { label: "Designation", Icon: UserCog,     color: "text-indigo-500" },
  staff:       { label: "Staff",       Icon: Shield,      color: "text-red-500" },
  settings:    { label: "Settings",    Icon: DollarSign,  color: "text-yellow-500" },
};

const ROLE_LABELS: Record<string, string> = {
  super_admin:     "Super Admin",
  area_manager:    "Area Mgr",
  branch_manager:  "Branch Mgr",
  finance_manager: "Finance Mgr",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin:     "bg-primary/10 text-primary",
  area_manager:    "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  branch_manager:  "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  finance_manager: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

function formatTimestamp(iso: string): { date: string; time: string; relative: string } {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  let relative = "";
  if (diffMin < 1) relative = "Just now";
  else if (diffMin < 60) relative = `${diffMin}m ago`;
  else if (diffHr < 24) relative = `${diffHr}h ago`;
  else if (diffDay === 1) relative = "Yesterday";
  else relative = `${diffDay}d ago`;
  return {
    date: d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }),
    relative,
  };
}

const StatCard = ({ label, value, sub, Icon, iconColor }: { label: string; value: number; sub?: string; Icon: React.ElementType; iconColor: string }) => (
  <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted/50">
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
    <div>
      <p className="text-2xl font-bold text-card-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/70">{sub}</p>}
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const ActivityLogs = () => {
  const [search, setSearch]           = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");
  const [filterRole, setFilterRole]   = useState("all");
  const [page, setPage]               = useState(1);
  const LIMIT = 20;

  const { data, isLoading, refetch } = useActivityLogs({
    page, limit: LIMIT,
    action: filterAction,
    entity: filterEntity,
    role: filterRole,
    search,
  });

  const logs       = data?.logs       ?? [];
  const total      = data?.total      ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount   = logs.filter(l => l.createdAt.startsWith(todayStr)).length;
  const adminCount   = logs.filter(l => l.performedByRole === "super_admin").length;
  const deleteCount  = logs.filter(l => l.action === "deleted").length;

  const resetFilters = () => { setSearch(""); setFilterAction("all"); setFilterEntity("all"); setFilterRole("all"); setPage(1); };
  const hasFilters = search || filterAction !== "all" || filterEntity !== "all" || filterRole !== "all";

  return (
    <div>
      {/* Header */}
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Activity Logs</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Audit trail of all actions across the system</p>
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
        <StatCard label="Total Logs" value={total} sub="all time" Icon={FileText} iconColor="text-primary" />
        <StatCard label="Today" value={todayCount} sub="current page" Icon={Clock} iconColor="text-emerald-500" />
        <StatCard label="By Admin" value={adminCount} Icon={Shield} iconColor="text-violet-500" />
        <StatCard label="Deletions" value={deleteCount} sub="requires review" Icon={Trash2} iconColor="text-destructive" />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-3 md:p-4 mb-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name, description, user..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="h-9 text-xs pl-8"
            />
          </div>
          <Select value={filterAction} onValueChange={v => { setFilterAction(v); setPage(1); }}>
            <SelectTrigger className="h-9 text-xs w-full sm:w-36"><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {Object.entries(ACTION_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterEntity} onValueChange={v => { setFilterEntity(v); setPage(1); }}>
            <SelectTrigger className="h-9 text-xs w-full sm:w-36"><SelectValue placeholder="Module" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {Object.entries(ENTITY_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterRole} onValueChange={v => { setFilterRole(v); setPage(1); }}>
            <SelectTrigger className="h-9 text-xs w-full sm:w-36"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="area_manager">Area Manager</SelectItem>
              <SelectItem value="branch_manager">Branch Manager</SelectItem>
              <SelectItem value="finance_manager">Finance Manager</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground shrink-0" onClick={resetFilters}>
              Clear
            </Button>
          )}
        </div>
        {hasFilters && (
          <p className="text-[10px] text-muted-foreground mt-2">
            Showing {logs.length} of {total} total entries
          </p>
        )}
      </div>

      {/* Log Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-30 animate-spin" />
            <p className="text-sm">Loading activity logs…</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Filter className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No logs match your filters</p>
            {hasFilters && <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={resetFilters}>Clear filters</Button>}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Action</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Module</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Description</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Performed By</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Branch</th>
                    <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {logs.map(log => {
                    const action = ACTION_CONFIG[log.action] ?? ACTION_CONFIG.updated;
                    const entity = ENTITY_CONFIG[log.entity] ?? ENTITY_CONFIG.employee;
                    const ts = formatTimestamp(log.createdAt);
                    return (
                      <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full ${action.color}`}>
                            <action.Icon className="w-3 h-3" />
                            {action.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <entity.Icon className={`w-3.5 h-3.5 ${entity.color}`} />
                            <span className="text-xs text-card-foreground">{entity.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-[320px]">
                          <p className="text-xs text-card-foreground font-medium truncate" title={log.description}>{log.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{log.entityName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                              {log.performedBy.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-card-foreground">{log.performedBy}</p>
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${ROLE_COLORS[log.performedByRole] ?? ""}`}>
                                {ROLE_LABELS[log.performedByRole] ?? log.performedByRole}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {log.officeName ? (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Building2 className="w-3 h-3 shrink-0" />
                              {log.officeName}
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/50 italic">System-wide</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="text-xs text-muted-foreground">{ts.relative}</p>
                          <p className="text-[10px] text-muted-foreground/60">{ts.time} · {ts.date}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card feed */}
            <div className="md:hidden divide-y divide-border/60">
              {logs.map(log => {
                const action = ACTION_CONFIG[log.action] ?? ACTION_CONFIG.updated;
                const entity = ENTITY_CONFIG[log.entity] ?? ENTITY_CONFIG.employee;
                const ts = formatTimestamp(log.createdAt);
                return (
                  <div key={log.id} className="p-4 hover:bg-muted/20">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${action.color}`}>
                          <action.Icon className="w-2.5 h-2.5" />
                          {action.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                          <entity.Icon className={`w-3 h-3 ${entity.color}`} />
                          {entity.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{ts.relative}</span>
                    </div>
                    <p className="text-xs text-card-foreground font-medium mb-1">{log.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                          {log.performedBy.charAt(0)}
                        </div>
                        {log.performedBy}
                        <span className={`px-1 py-0.5 rounded-full ${ROLE_COLORS[log.performedByRole] ?? ""}`}>
                          {ROLE_LABELS[log.performedByRole] ?? log.performedByRole}
                        </span>
                      </span>
                      {log.officeName && (
                        <span className="flex items-center gap-0.5">
                          <Building2 className="w-2.5 h-2.5" />{log.officeName}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages} · {total} entries
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
