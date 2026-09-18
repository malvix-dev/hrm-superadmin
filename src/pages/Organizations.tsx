import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Building2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Plan { id: string; name: string; }
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

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  trial: "bg-yellow-100 text-yellow-700 border-yellow-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
};

export default function Organizations() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", ownerName: "", ownerEmail: "", ownerPassword: "", planId: "" });

  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (search) params.set("search", search);
  if (status !== "all") params.set("status", status);

  const { data, isLoading } = useQuery<OrgListResponse>({
    queryKey: ["orgs", page, search, status],
    queryFn: () => apiGet<OrgListResponse>(`/organizations?${params}`),
  });

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ["plans-list"],
    queryFn: () => apiGet<Plan[]>("/plans"),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof form) => apiPost("/organizations", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs"] });
      setCreateOpen(false);
      setForm({ name: "", ownerName: "", ownerEmail: "", ownerPassword: "", planId: "" });
      toast.success("Organization created");
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
          <p className="text-muted-foreground text-sm mt-0.5">Manage tenant organizations</p>
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
        <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
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
              ) : (data?.organizations ?? []).map(org => (
                <Link key={org.id} to={`/organizations/${org.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{org.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{org.ownerEmail}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{org._count.employees} employees</span>
                    <span>{org.plan?.name ?? "—"}</span>
                    <span>{format(new Date(org.createdAt), "MMM d, yyyy")}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[org.status] || "bg-muted text-muted-foreground border-border"}`}>
                    {org.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                </Link>
              ))}
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

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div>
              <Label className="text-sm mb-1.5 block">Organization Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Acme Corp" required />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Owner Name</Label>
              <Input value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} placeholder="John Doe" required />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Owner Email</Label>
              <Input type="email" value={form.ownerEmail} onChange={e => setForm(f => ({ ...f, ownerEmail: e.target.value }))} placeholder="owner@acme.com" required />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Owner Password</Label>
              <Input type="password" value={form.ownerPassword} onChange={e => setForm(f => ({ ...f, ownerPassword: e.target.value }))} placeholder="Temporary password" required />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Plan (optional)</Label>
              <Select value={form.planId} onValueChange={v => setForm(f => ({ ...f, planId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
