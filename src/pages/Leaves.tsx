import { useState } from "react";
import { useOffice } from "@/contexts/OfficeContext";
import { useEmployees } from "@/hooks/useEmployees";
import {
  useLeaveTypes, useCreateLeaveType, useUpdateLeaveType, useDeleteLeaveType,
  useHolidays, useCreateHoliday, useUpdateHoliday, useDeleteHoliday,
  useLeaves, useCreateLeave, useUpdateLeaveStatus, useDeleteLeave,
  LeaveType, OfficialHoliday, LeaveRequest,
} from "@/hooks/useLeaves";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Plus, Pencil, Trash2, CheckCircle, XCircle, Clock,
  Calendar, Tag, CalendarDays, Star,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#3b82f6","#ec4899","#8b5cf6","#14b8a6","#f97316"];

const statusStyle = (s: string) => s === "approved"
  ? "bg-stat-free/15 text-stat-free"
  : s === "rejected"
  ? "bg-destructive/15 text-destructive"
  : "bg-stat-pending/15 text-stat-pending";

// ── Leave Types Tab ─────────────────────────────────────────────────────────
const LeaveTypesTab = () => {
  const { data: types = [] } = useLeaveTypes();
  const create = useCreateLeaveType();
  const update = useUpdateLeaveType();
  const del = useDeleteLeaveType();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeaveType | null>(null);
  const [name, setName] = useState("");
  const [daysAllowed, setDaysAllowed] = useState("30");
  const [color, setColor] = useState(COLORS[0]);

  const openDialog = (t?: LeaveType) => {
    if (t) { setEditing(t); setName(t.name); setDaysAllowed(String(t.daysAllowed)); setColor(t.color || COLORS[0]); }
    else { setEditing(null); setName(""); setDaysAllowed("30"); setColor(COLORS[0]); }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, name: name.trim(), daysAllowed: Number(daysAllowed) || 30, color });
        toast.success("Leave type updated");
      } else {
        await create.mutateAsync({ name: name.trim(), daysAllowed: Number(daysAllowed) || 30, color });
        toast.success("Leave type created");
      }
      setOpen(false);
      setEditing(null);
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Leave type deleted");
    } catch (e: any) { toast.error(e.message || "Failed to delete"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{types.length} leave type{types.length !== 1 ? "s" : ""}</p>
        <Button size="sm" className="h-8 text-xs gap-1" onClick={() => openDialog()}>
          <Plus className="w-3 h-3" /> Add Type
        </Button>
      </div>

      {types.length === 0 ? (
        <div className="bg-card rounded-xl border border-border py-14 text-center text-muted-foreground">
          <Tag className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No leave types defined yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {types.map(t => (
            <div key={t.id} className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: t.color + "22" }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.daysAllowed} days/year</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog(t)}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => setDeleteTarget(t)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={v => { if (!v) { setOpen(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" /> {editing ? "Edit" : "New"} Leave Type
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Annual Leave" className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Days Allowed Per Year</Label>
              <Input type="number" value={daysAllowed} onChange={e => setDaysAllowed(e.target.value)} className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-all border-2 ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setEditing(null); }} className="h-9 text-xs">Cancel</Button>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending} className="h-9 text-xs">
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-base flex items-center gap-2"><Trash2 className="w-4 h-4 text-destructive" /> Delete Leave Type</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Delete <strong>{deleteTarget?.name}</strong>? This may affect existing leave records.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="h-9 text-xs">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={del.isPending} className="h-9 text-xs">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Holidays Tab ────────────────────────────────────────────────────────────
const HolidaysTab = () => {
  const { data: holidays = [] } = useHolidays();
  const create = useCreateHoliday();
  const update = useUpdateHoliday();
  const del = useDeleteHoliday();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OfficialHoliday | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OfficialHoliday | null>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [days, setDays] = useState("1");
  const [description, setDescription] = useState("");
  const [recurring, setRecurring] = useState(false);

  const openDialog = (h?: OfficialHoliday) => {
    if (h) {
      setEditing(h); setName(h.name); setDate(h.date); setDays(String(h.days));
      setDescription(h.description || ""); setRecurring(h.recurring);
    } else {
      setEditing(null); setName(""); setDate(""); setDays("1"); setDescription(""); setRecurring(false);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !date) { toast.error("Name and date are required"); return; }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, name: name.trim(), date, days: Number(days) || 1, description: description || undefined, recurring });
        toast.success("Holiday updated");
      } else {
        await create.mutateAsync({ name: name.trim(), date, days: Number(days) || 1, description: description || undefined, recurring });
        toast.success("Holiday added");
      }
      setOpen(false); setEditing(null);
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Holiday deleted");
    } catch (e: any) { toast.error(e.message || "Failed to delete"); }
  };

  const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{holidays.length} holiday{holidays.length !== 1 ? "s" : ""}</p>
        <Button size="sm" className="h-8 text-xs gap-1" onClick={() => openDialog()}>
          <Plus className="w-3 h-3" /> Add Holiday
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-card rounded-xl border border-border py-14 text-center text-muted-foreground">
          <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No official holidays added yet</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Holiday</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">Days</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Recurring</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Description</th>
                  <th className="px-4 py-3 w-20 text-center text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map(h => (
                  <tr key={h.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-card-foreground">{h.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(h.date)}</td>
                    <td className="px-4 py-3 text-center font-medium text-card-foreground">{h.days}</td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${h.recurring ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {h.recurring ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{h.description || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openDialog(h)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => setDeleteTarget(h)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={v => { if (!v) { setOpen(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" /> {editing ? "Edit" : "New"} Holiday
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Holiday Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Eid ul Fitr" className="h-9 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9 text-xs" />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Duration (days)</Label>
                <Input type="number" value={days} onChange={e => setDays(e.target.value)} min="1" className="h-9 text-xs" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Description (optional)</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." className="h-9 text-xs" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} className="rounded" />
              <span className="text-card-foreground">Recurring every year</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setEditing(null); }} className="h-9 text-xs">Cancel</Button>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending} className="h-9 text-xs">
              {editing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-base flex items-center gap-2"><Trash2 className="w-4 h-4 text-destructive" /> Delete Holiday</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Delete <strong>{deleteTarget?.name}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="h-9 text-xs">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={del.isPending} className="h-9 text-xs">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Leave Requests Tab ──────────────────────────────────────────────────────
const LeaveRequestsTab = ({ officeId }: { officeId: string }) => {
  const { data: leaves = [], isLoading } = useLeaves({ officeId });
  const { data: leaveTypes = [] } = useLeaveTypes();
  const { data: employees = [] } = useEmployees({ officeId: officeId !== "all" ? officeId : undefined });
  const { data: holidays = [] } = useHolidays();
  const createLeave = useCreateLeave();
  const updateStatus = useUpdateLeaveStatus();
  const deleteLeave = useDeleteLeave();

  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LeaveRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [employeeId, setEmployeeId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [initialStatus, setInitialStatus] = useState<"pending" | "approved">("approved");

  const calcDays = (s: string, e: string) => {
    if (!s || !e) return 0;
    const start = new Date(s);
    const end = new Date(e);
    const holidaySet = new Set(holidays.map(h => new Date(h.date).toISOString().split("T")[0]));
    let count = 0;
    const cursor = new Date(start);
    while (cursor <= end) {
      if (!holidaySet.has(cursor.toISOString().split("T")[0])) count++;
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  };

  const openDialog = () => {
    setEmployeeId(""); setLeaveTypeId(leaveTypes[0]?.id || "");
    setStartDate(""); setEndDate(""); setReason(""); setIsHalfDay(false); setInitialStatus("approved");
    setOpen(true);
  };

  const handleSave = async () => {
    if (!employeeId) { toast.error("Select an employee"); return; }
    if (!leaveTypeId) { toast.error("Select a leave type"); return; }
    if (!startDate || !endDate) { toast.error("Select start and end dates"); return; }
    const days = isHalfDay ? 0.5 : calcDays(startDate, endDate);
    try {
      const created = await createLeave.mutateAsync({ employeeId, leaveTypeId, startDate, endDate, days, isHalfDay, reason: reason || undefined });
      if (initialStatus === "approved") {
        await updateStatus.mutateAsync({ id: created.id, status: "approved" });
      }
      toast.success(`Leave recorded — ${days} day(s)`);
      setOpen(false);
    } catch (e: any) { toast.error(e.message || "Failed to save leave"); }
  };

  const handleApprove = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: "approved" });
      toast.success("Leave approved");
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await updateStatus.mutateAsync({ id: rejectTarget.id, status: "rejected", rejectedReason: rejectReason.trim() || undefined });
      toast.success("Leave rejected");
      setRejectTarget(null);
      setRejectReason("");
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLeave.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Leave deleted");
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const filtered = filterStatus === "all" ? leaves : leaves.filter(l => l.status === filterStatus);
  const sorted = [...filtered].sort((a, b) => b.startDate.localeCompare(a.startDate));

  const pending = leaves.filter(l => l.status === "pending").length;
  const approved = leaves.filter(l => l.status === "approved").length;
  const rejected = leaves.filter(l => l.status === "rejected").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <div className="bg-card rounded-xl border border-border p-3 md:p-4 shadow-sm text-center">
          <Clock className="w-4 h-4 mx-auto mb-1 text-stat-pending opacity-70" />
          <p className="text-[10px] text-muted-foreground">Pending</p>
          <p className="text-base font-bold text-stat-pending">{pending}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 md:p-4 shadow-sm text-center">
          <CheckCircle className="w-4 h-4 mx-auto mb-1 text-stat-free opacity-70" />
          <p className="text-[10px] text-muted-foreground">Approved</p>
          <p className="text-base font-bold text-stat-free">{approved}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 md:p-4 shadow-sm text-center">
          <XCircle className="w-4 h-4 mx-auto mb-1 text-destructive opacity-70" />
          <p className="text-[10px] text-muted-foreground">Rejected</p>
          <p className="text-base font-bold text-destructive">{rejected}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-9 w-40 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Leaves</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" className="h-8 text-xs gap-1" onClick={openDialog}>
          <Plus className="w-3 h-3" /> New Leave
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm">
        {isLoading ? (
          <div className="h-32 animate-pulse" />
        ) : sorted.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No leave records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Employee</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Dates</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">Days</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Reason</th>
                  <th className="px-4 py-3 w-24 text-center text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map(l => (
                  <tr key={l.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-card-foreground">
                      {l.employee?.fullName || employees.find(e => e.id === l.employeeId)?.fullName || "—"}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {l.leaveType ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: (l.leaveType.color || "#6366f1") + "22", color: l.leaveType.color || "#6366f1" }}>
                          {l.leaveType.name}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="whitespace-nowrap">{formatDate(l.startDate)}</span>
                      {l.startDate !== l.endDate && <span className="whitespace-nowrap"> – {formatDate(l.endDate)}</span>}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-card-foreground">{l.days}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyle(l.status)}`}>
                        {l.status === "approved" && <CheckCircle className="w-2.5 h-2.5" />}
                        {l.status === "rejected" && <XCircle className="w-2.5 h-2.5" />}
                        {l.status === "pending" && <Clock className="w-2.5 h-2.5" />}
                        {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-[180px] truncate">
                      {l.status === "rejected" && l.rejectedReason
                        ? <span className="text-destructive">{l.rejectedReason}</span>
                        : l.reason || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        {l.status === "pending" && (
                          <>
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-stat-free hover:bg-stat-free/10" title="Approve" onClick={() => handleApprove(l.id)}>
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive hover:bg-destructive/10" title="Reject" onClick={() => { setRejectTarget(l); setRejectReason(""); }}>
                              <XCircle className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => setDeleteTarget(l)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Leave Dialog */}
      <Dialog open={open} onOpenChange={v => !v && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> New Leave Record
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Employee</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Leave Type</Label>
              <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {leaveTypes.map(lt => <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Start Date</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 text-xs" />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">End Date</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="halfDayChk" checked={isHalfDay} onChange={e => setIsHalfDay(e.target.checked)} className="w-4 h-4 rounded" />
              <Label htmlFor="halfDayChk" className="text-xs font-medium cursor-pointer">Half Day (0.5 days)</Label>
            </div>
            {startDate && endDate && (
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">Total Days</p>
                <p className="font-bold text-card-foreground">{isHalfDay ? "0.5" : calcDays(startDate, endDate)}</p>
              </div>
            )}
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Reason</Label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for leave..." rows={2} className="text-xs" />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Status</Label>
              <Select value={initialStatus} onValueChange={v => setInitialStatus(v as any)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="h-9 text-xs">Cancel</Button>
            <Button onClick={handleSave} disabled={createLeave.isPending || updateStatus.isPending} className="h-9 text-xs">Add Leave</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-base flex items-center gap-2"><Trash2 className="w-4 h-4 text-destructive" /> Delete Leave</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">
            Delete <strong>{deleteTarget?.days} day(s)</strong> leave for <strong>{deleteTarget?.employee?.fullName || employees.find(e => e.id === deleteTarget?.employeeId)?.fullName}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="h-9 text-xs">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLeave.isPending} className="h-9 text-xs">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject with Reason */}
      <Dialog open={!!rejectTarget} onOpenChange={o => { if (!o) { setRejectTarget(null); setRejectReason(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" /> Reject Leave
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Reject <strong>{rejectTarget?.days} day(s)</strong> leave for <strong>{rejectTarget?.employee?.fullName || employees.find(e => e.id === rejectTarget?.employeeId)?.fullName}</strong>?
            </p>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Reason (optional)</Label>
              <Textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                rows={3}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(""); }} className="h-9 text-xs">Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={updateStatus.isPending} className="h-9 text-xs">Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Main Page ───────────────────────────────────────────────────────────────
const Leaves = () => {
  const { selectedOfficeId } = useOffice();

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Leaves</h1>
        <p className="text-xs md:text-sm text-muted-foreground">Manage leave requests, types, and holidays</p>
      </div>
      <Tabs defaultValue="requests">
        <TabsList className="mb-4 bg-muted/50 h-auto p-1">
          <TabsTrigger value="requests" className="gap-1.5 text-xs md:text-sm h-8 md:h-9">
            <Calendar className="w-3.5 h-3.5" /> Requests
          </TabsTrigger>
          <TabsTrigger value="types" className="gap-1.5 text-xs md:text-sm h-8 md:h-9">
            <Tag className="w-3.5 h-3.5" /> Leave Types
          </TabsTrigger>
          <TabsTrigger value="holidays" className="gap-1.5 text-xs md:text-sm h-8 md:h-9">
            <CalendarDays className="w-3.5 h-3.5" /> Holidays
          </TabsTrigger>
        </TabsList>
        <TabsContent value="requests">
          <LeaveRequestsTab officeId={selectedOfficeId || "all"} />
        </TabsContent>
        <TabsContent value="types">
          <LeaveTypesTab />
        </TabsContent>
        <TabsContent value="holidays">
          <HolidaysTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Leaves;
