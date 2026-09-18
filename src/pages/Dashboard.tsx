import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Building2, TrendingUp, DollarSign, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface Stats {
  overview: {
    totalOrgs: number;
    activeOrgs: number;
    trialOrgs: number;
    suspendedOrgs: number;
    mrr: number;
  };
  growth: { month: string; count: number }[];
  recentOrgs: { id: string; name: string; plan: { name: string } | null; status: string; createdAt: string }[];
  plans: { name: string; count: number; orgCount?: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  trial: "bg-yellow-100 text-yellow-700",
  suspended: "bg-red-100 text-red-700",
};

export default function Dashboard() {
  const { data, isLoading } = useQuery<Stats>({
    queryKey: ["super-stats"],
    queryFn: () => apiGet<Stats>("/stats"),
    refetchInterval: 60_000,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Loading platform stats…</div>
  );

  const stats = data!;
  const ov = stats.overview;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Live overview of all tenant organizations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orgs</p>
                <p className="text-3xl font-bold mt-1">{ov.totalOrgs}</p>
              </div>
              <Building2 className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-3xl font-bold mt-1 text-green-600">{ov.activeOrgs}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MRR</p>
                <p className="text-3xl font-bold mt-1">${ov.mrr.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suspended</p>
                <p className="text-3xl font-bold mt-1 text-red-600">{ov.suspendedOrgs}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">New Organizations (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.growth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#colorCount)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plans Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.plans.length === 0 && <p className="text-sm text-muted-foreground">No plans yet</p>}
            {stats.plans.map(p => (
              <div key={p.name} className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">{p.name}</span>
                <Badge variant="secondary">{p.orgCount ?? p.count ?? 0}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Organizations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {stats.recentOrgs.map(org => (
              <Link key={org.id} to={`/organizations/${org.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-muted/40 transition-colors">
                <div>
                  <p className="text-sm font-medium">{org.name}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(org.createdAt), "MMM d, yyyy")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{org.plan?.name ?? "—"}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[org.status] || "bg-muted text-muted-foreground"}`}>
                    {org.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
