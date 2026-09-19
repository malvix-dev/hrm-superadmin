import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2, User, CreditCard, Users, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface OrgDetail {
  id: string;
  name: string;
  status: string;
  plan: { id: string; name: string; priceMonthly: number } | null;
  staff: { id: string; name: string; email: string; role: string }[];
  _count: { staff: number; offices: number; employees: number };
  createdAt: string;
}
interface Plan { id: string; name: string; priceMonthly: number; }
interface PlanHistoryEntry {
  id: string;
  planName: string;
  priceMonthly: number;
  changedBy: string;
  changedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  pending_payment: "bg-yellow-100 text-yellow-700",
  suspended: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  pending_payment: "Pending Activation",
  suspended: "Suspended",
};

export default function OrgDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"overview" | "billing">("overview");

  const { data: org, isLoading } = useQuery<OrgDetail>({
    queryKey: ["org", id],
    queryFn: () => apiGet<OrgDetail>(`/organizations/${id}`),
  });

  const { data: plansData = [] } = useQuery<Plan[]>({
    queryKey: ["plans-list"],
    queryFn: () => apiGet<Plan[]>("/plans"),
  });

  const { data: billingHistory = [] } = useQuery<PlanHistoryEntry[]>({
    queryKey: ["org-billing", id],
    queryFn: () => apiGet<PlanHistoryEntry[]>(`/organizations/${id}/billing`),
    enabled: tab === "billing",
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => apiPatch(`/organizations/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["org", id] }); toast.success("Status updated"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const planMutation = useMutation({
    mutationFn: (planId: string) => apiPatch(`/organizations/${id}/plan`, { planId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["org", id] }); toast.success("Plan updated"); },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Loading…</div>
  );
  if (!org) return (
    <div className="p-6 text-muted-foreground text-sm">Organization not found.</div>
  );

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <p className="text-muted-foreground text-sm">Organization detail</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Employees", value: org._count.employees, icon: Users },
          { label: "Branches", value: org._count.offices, icon: Building2 },
          { label: "Plan", value: org.plan?.name || "—", icon: CreditCard },
          { label: "Joined", value: format(new Date(org.createdAt), "MMM yyyy"), icon: Calendar },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Icon className="w-4 h-4" />
                <span className="text-xs">{label}</span>
              </div>
              <p className="text-xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["overview", "billing"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "billing" ? "Billing History" : "Overview"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Owner info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4" /> Owner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(() => {
                const owner = org.staff.find(s => s.role === "org_owner");
                return owner ? (
                  <>
                    <p className="font-medium">{owner.name}</p>
                    <p className="text-muted-foreground">{owner.email}</p>
                  </>
                ) : <p className="text-muted-foreground">No owner assigned</p>;
              })()}
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${STATUS_COLORS[org.status] || "bg-muted text-muted-foreground"}`}>
                {STATUS_LABELS[org.status] ?? org.status}
              </span>
              <div className="flex flex-wrap gap-2 pt-2">
                {["active", "pending_payment", "suspended"].filter(s => s !== org.status).map(s => (
                  <Button key={s} size="sm" variant="outline" disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate(s)}>
                    {s === "active" ? "Activate" : s === "suspended" ? "Suspend" : "Set Pending"}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Plan change */}
          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><CreditCard className="w-4 h-4" /> Change Plan</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Select defaultValue={org.plan?.id || ""} onValueChange={v => planMutation.mutate(v)}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plansData.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — ${p.priceMonthly}/mo</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {planMutation.isPending && <span className="text-xs text-muted-foreground">Saving…</span>}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "billing" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" /> Plan Change History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {billingHistory.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                No plan changes recorded yet. History is logged when a plan is assigned via this admin panel.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {billingHistory.map((entry, i) => (
                  <div key={entry.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${i === 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />
                      <div>
                        <p className="text-sm font-medium">{entry.planName}</p>
                        <p className="text-xs text-muted-foreground">Changed by {entry.changedBy}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">${entry.priceMonthly}/mo</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(entry.changedAt), "MMM d, yyyy · HH:mm")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
