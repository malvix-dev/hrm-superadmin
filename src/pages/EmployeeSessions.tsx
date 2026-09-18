import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEmployee, useEmployeeSessions, EmployeeSession } from "@/hooks/useEmployees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Smartphone, LogIn, LogOut, LockKeyhole, LockOpen,
  Clock, Search, Filter,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

// ── Config ────────────────────────────────────────────────────────────────────

const EVENT_CFG: Record<string, { icon: React.ElementType; color: string; bg: string; border: string; label: string }> = {
  login:            { icon: LogIn,       color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20",  border: "border-emerald-200 dark:border-emerald-800", label: "Logged In" },
  logout:           { icon: LogOut,      color: "text-slate-500",   bg: "bg-slate-100 dark:bg-slate-800/30",     border: "border-slate-200 dark:border-slate-700",     label: "Logged Out" },
  cooldown_started: { icon: LockKeyhole, color: "text-red-600",     bg: "bg-red-50 dark:bg-red-900/20",          border: "border-red-200 dark:border-red-800",          label: "Cooldown Started" },
  cooldown_ended:   { icon: LockOpen,    color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-900/20",         border: "border-blue-200 dark:border-blue-800",        label: "Cooldown Ended" },
};

const ALL_EVENTS = ["login", "logout", "cooldown_started", "cooldown_ended"] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTs(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

function deviceLabel(info: any) {
  if (!info) return null;
  return [info.manufacturer, info.model, info.os].filter(Boolean).join(" · ");
}

// ── Session Row ───────────────────────────────────────────────────────────────

function SessionRow({ session }: { session: EmployeeSession }) {
  const cfg = EVENT_CFG[session.event] ?? { icon: Clock, color: "text-muted-foreground", bg: "bg-muted/30", border: "border-border", label: session.event };
  const Icon = cfg.icon;
  const device = deviceLabel(session.deviceInfo);
  const { date, time } = fmtTs(session.createdAt);

  return (
    <div className={`flex gap-4 p-4 md:p-5 border-b border-border last:border-0 hover:bg-muted/20 transition-colors`}>
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
          {device && (
            <div className="flex items-center gap-1 bg-muted rounded-md px-2 py-0.5">
              <Smartphone className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground">{device}</span>
            </div>
          )}
        </div>

        {session.event === "cooldown_started" && session.note && (
          <p className="text-xs text-muted-foreground mb-1">{session.note}</p>
        )}

        {session.event === "cooldown_ended" && session.performedBy && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs text-muted-foreground">Ended by</span>
            <span className="text-xs font-semibold text-card-foreground">{session.performedBy}</span>
            {session.performedByRole && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 capitalize">
                {session.performedByRole.replace(/_/g, " ")}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
          <Clock className="w-3 h-3" />
          <span>{date} at {time}</span>
        </div>
      </div>

      {/* Device ID tag */}
      {session.deviceId && (
        <div className="hidden md:flex items-start shrink-0">
          <span className="text-[10px] font-mono text-muted-foreground/50 mt-1 max-w-[120px] truncate" title={session.deviceId}>
            {session.deviceId.slice(0, 8)}…
          </span>
        </div>
      )}
    </div>
  );
}

// ── Summary Stats ─────────────────────────────────────────────────────────────

function StatPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-center ${color}`}>
      <p className="text-xl md:text-2xl font-bold">{count}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EmployeeSessions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: emp } = useEmployee(id!);
  const { data: sessions = [], isLoading } = useEmployeeSessions(id!);

  const [search, setSearch] = useState("");
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = sessions.filter(s => {
    if (filterEvent !== "all" && s.event !== filterEvent) return false;
    if (dateFrom && new Date(s.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(s.createdAt) > new Date(dateTo + "T23:59:59")) return false;
    if (search) {
      const q = search.toLowerCase();
      const dev = deviceLabel(s.deviceInfo)?.toLowerCase() ?? "";
      const note = s.note?.toLowerCase() ?? "";
      const by = s.performedBy?.toLowerCase() ?? "";
      if (!dev.includes(q) && !note.includes(q) && !by.includes(q)) return false;
    }
    return true;
  });

  const counts = {
    login: sessions.filter(s => s.event === "login").length,
    logout: sessions.filter(s => s.event === "logout").length,
    cooldown_started: sessions.filter(s => s.event === "cooldown_started").length,
    cooldown_ended: sessions.filter(s => s.event === "cooldown_ended").length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/employees/${id}`)} className="h-9 w-9">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {emp?.fullName?.charAt(0) ?? "?"}
          </div>
          <div className="min-w-0">
            <h1 className="text-base md:text-lg font-bold text-foreground truncate">
              {emp?.fullName ?? "Employee"} — Session History
            </h1>
            <p className="text-xs text-muted-foreground">
              {emp?.office?.name} · {sessions.length} total event{sessions.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-5">
        <StatPill label="Logins"            count={counts.login}            color="border-emerald-200 dark:border-emerald-800" />
        <StatPill label="Logouts"           count={counts.logout}           color="border-slate-200 dark:border-slate-700" />
        <StatPill label="Cooldowns Started" count={counts.cooldown_started} color="border-red-200 dark:border-red-800" />
        <StatPill label="Cooldowns Ended"   count={counts.cooldown_ended}   color="border-blue-200 dark:border-blue-800" />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-3 md:p-4 shadow-sm mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search device, note, ended by…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {["all", ...ALL_EVENTS].map(ev => (
            <button
              key={ev}
              onClick={() => setFilterEvent(ev)}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                filterEvent === ev
                  ? "bg-primary text-white border-primary"
                  : "bg-muted text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {ev === "all" ? "All" : EVENT_CFG[ev]?.label ?? ev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs w-36" />
          <span className="text-xs text-muted-foreground">to</span>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs w-36" />
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={() => { setDateFrom(""); setDateTo(""); }}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-primary">Events</span>
          <span className="text-[10px] text-muted-foreground">{filtered.length} of {sessions.length}</span>
        </div>

        {isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Smartphone className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No session events match your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(s => <SessionRow key={s.id} session={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}
