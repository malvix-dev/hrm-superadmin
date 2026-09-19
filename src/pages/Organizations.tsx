import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Building2, ChevronRight, CheckCircle, Ban, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Plan { id: string; name: string; priceMonthly: number; }
interface Org {
  id: string;
  name: string;
  status: string;
  plan: { id: string; name: string; priceMonthly: number } | null;
  planId: string | null;
  createdAt: string;
  _count: { staff: number; offices: number; employees: number };
}
interface OrgListResponse {
  organizations: Org[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  active:          { label: "Active",           cls: "bg-green-100 text-green-700 border-green-200",   icon: <CheckCircle className="w-3 h-3" /> },
  pending_payment: { label: "Pending Payment",  cls: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: <Clock className="w-3 h-3" /> },
  suspended:       { label: "Suspended",        cls: "bg-red-100 text-red-700 border-red-200",          icon: <Ban className="w-3 h-3" /> },
};

export default function Organizations() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ orgName: "", ownerName: "", email: "", password: "", planId: "" });
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (search) params.set("search", search);
  if (statusFilter !== "all") params.set("status", statusFilter);

  const { data, isLoading } = useQuery<OrgListResponse>({
    queryKey: ["orgs", page, search, statusFilter],
    queryFn: () => apiGet<OrgListResponse>(`/organizations?${params}`),
  });

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ["plans-list"],
    queryFn: () => apiGet<Plan[]>("/plans"),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof form) => apiPost("/organizations", { ...body, status: "active" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs"] });
      setCreateOpen(false);
      setForm({ orgName: "", ownerName: "", email: "", password: "", planId: "" });
      toast.success("Organization created and activated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiPatch(`/organizations/${id}/status`, { status }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["orgs"] });
      setActivatingId(null);
      const label = vars.status === "active" ? "activated" : vars.status === "suspended" ? "suspended" : "updated";
      toast.success(`Organization ${label}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage tenant organizations and subscriptions</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> New Organization
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 h-9 text-sm" placeholder="Search organizations…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending_payment">Pending Payment</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <CardContent className="py-16 text-center text-muted-foreground text-sm">Loading…</CardContent>
        ) : (
          <>
            <div className="divide-y divide-border">
              {(data?.organizations ?? []).length === 0 ? (
                <div className="py-16 text-center text-muted-foreground text-sm">No organizations found</div>
              ) : (data?.organizations ?? []).map(org => {
                const sc = STATUS_CONFIG[org.status] ?? { label: org.status, cls: "bg-muted text-muted-foreground border-border", icon: null };
                const isPending = org.status === "pending_payment";
                const isActive  = org.status === "active";

                return (
                  <div key={org.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors group">
                    <Link to={`/organizations/${org.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{org.name}</p>
                        <p className="text-xs text-muted-foreground">{org._count.employees} employees · {org.plan?.name ?? "No plan"}{org.plan ? ` · Rs ${org.plan.priceMonthly.toLocaleString()}/mo` : ""}</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{format(new Date(org.createdAt), "MMM d, yyyy")}</span>
                      </div>
                    </Link>

                    {/* Status badge */}
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${sc.cls}`}>
                      {sc.icon}{sc.label}
                    </span>

                    {/* Quick-action buttons */}
                    {isPending && (
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        disabled={statusMutation.isPending && activatingId === org.id}
                        onClick={() => { setActivatingId(org.id); statusMutation.mutate({ id: org.id, status: "active" }); }}
                      >
                        Activate
                      </Button>
                    )}
                    {isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                        disabled={statusMutation.isPending && activatingId === org.id}
                        onClick={() => { if (confirm(`Suspend ${org.name}?`)) { setActivatingId(org.id); statusMutation.mutate({ id: org.id, status: "suspended" }); } }}
                      >
                        Suspend
                      </Button>
                    )}
                    {org.status === "suspended" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={statusMutation.isPending && activatingId === org.id}
                        onClick={() => { setActivatingId(org.id); statusMutation.mutate({ id: org.id, status: "active" }); }}
                      >
                        Reactivate
                      </Button>
                    )}

                    <Link to={`/organizations/${org.id}`}>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                    </Link>
                  </div>
                );
              })}
            </div>
            {(data?.totalPages ?? 1) > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t">
                <p className="text-xs text-muted-foreground">{data?.total} total</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <span className="text-xs self-center text-muted-foreground">Page {page} / {data?.totalPages}</span>
                  <Button size="sm" variant="outline" disabled={page === data?.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create org dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">Organizations created here are immediately activated.</p>
          <form onSubmit={handleCreate} className="space-y-4 pt-1">
            <div>
              <Label className="text-sm mb-1.5 block">Organization Name</Label>
              <Input value={form.orgName} onChange={e => setForm(f => ({ ...f, orgName: e.target.value }))} placeholder="Acme Corp" required />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Owner Name</Label>
              <Input value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} placeholder="John Doe" required />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Owner Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="owner@acme.com" required />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Owner Password</Label>
              <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Temporary password" required />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Plan</Label>
              <Select value={form.planId} onValueChange={v => setForm(f => ({ ...f, planId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — Rs {p.priceMonthly.toLocaleString()}/mo</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create & Activate"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
