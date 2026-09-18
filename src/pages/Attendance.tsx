import { useState, useMemo } from "react";
import { useOffice } from "@/contexts/OfficeContext";
import { useEmployees } from "@/hooks/useEmployees";
import { useAttendance, useUpsertAttendance, useBulkAttendance, useUpdateAttendance, useDeleteAttendance, AttendanceStatus, AttendanceRecord } from "@/hooks/useAttendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, CheckCircle, XCircle, Clock, AlarmClock, UserX, Users, Pencil, Trash2, Plus, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  absent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  half_day: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  late: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  on_leave: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present", absent: "Absent", half_day: "Half Day", late: "Late", on_leave: "On Leave",
};

const STATUS_ICONS: Record<AttendanceStatus, React.ElementType> = {
  present: CheckCircle, absent: XCircle, half_day: CalendarDays, late: AlarmClock, on_leave: UserX,
};

const STATUSES: AttendanceStatus[] = ["present", "absent", "half_day", "late", "on_leave"];

const today = () => new Date().toISOString().split("T")[0];
const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const AttendanceDialog = ({
  open,
  onClose,
  record,
  employees,
  officeId,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  record?: AttendanceRecord | null;
  employees: any[];
  officeId: string;
  defaultDate: string;
}) => {
  const upsert = useUpsertAttendance();
  const update = useUpdateAttendance();

  const [employeeId, setEmployeeId] = useState(record?.employeeId || "");
  const [date, setDate] = useState(record?.date || defaultDate);
  const [status, setStatus] = useState<AttendanceStatus>(record?.status || "present");
  const [checkIn, setCheckIn] = useState(record?.checkIn || "");
  const [checkOut, setCheckOut] = useState(record?.checkOut || "");
  const [note, setNote] = useState(record?.note || "");

  const isEdit = !!record;

  const handleSave = async () => {
    if (!employeeId && !isEdit) { toast.error("Select an employee"); return; }
    const emp = employees.find(e => e.id === (isEdit ? record!.employeeId : employeeId));
    const oid = officeId !== "all" ? officeId : emp?.officeId || "";
    try {
      if (isEdit) {
        await update.mutateAsync({ id: record!.id, status, checkIn: checkIn || undefined, checkOut: checkOut || undefined, note: note || undefined });
        toast.success("Attendance updated");
      } else {
        await upsert.mutateAsync({ employeeId, officeId: oid, date, status, checkIn: checkIn || undefined, checkOut: checkOut || undefined, note: note || undefined });
        toast.success("Attendance saved");
      }
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to save attendance");
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="w-4 h-4 text-primary" />
            {isEdit ? "Edit Attendance" : "Mark Attendance"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {!isEdit && (
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Employee</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {!isEdit && (
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9 text-xs" />
            </div>
          )}
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Status</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {STATUSES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`text-[10px] font-medium px-2 py-1.5 rounded-lg border transition-all ${status === s ? STATUS_COLORS[s] + " border-current" : "border-border text-muted-foreground hover:bg-muted/50"}`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">Check In</Label>
              <Input type="time" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">Check Out</Label>
              <Input type="time" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Note</Label>
            <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note..." rows={2} className="text-xs" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="h-9 text-xs">Cancel</Button>
          <Button onClick={handleSave} disabled={upsert.isPending || update.isPending} className="h-9 text-xs">
            {isEdit ? "Update" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DailyRegisterTab = ({ officeId }: { officeId: string }) => {
  const [selectedDate, setSelectedDate] = useState(today());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttendanceRecord | null>(null);
  const [bulkStatus, setBulkStatus] = useState<AttendanceStatus>("present");
  const [bulkOpen, setBulkOpen] = useState(false);

  const { data: employees = [] } = useEmployees({ officeId: officeId !== "all" ? officeId : undefined });
  const { data: records = [], isLoading } = useAttendance({ date: selectedDate, officeId });
  const deleteAtt = useDeleteAttendance();
  const bulk = useBulkAttendance();

  const markedIds = new Set(records.map(r => r.employeeId));
  const unmarked = employees.filter(e => !markedIds.has(e.id));

  const summary = {
    present: records.filter(r => r.status === "present").length,
    absent: records.filter(r => r.status === "absent").length,
    late: records.filter(r => r.status === "late").length,
    half_day: records.filter(r => r.status === "half_day").length,
    on_leave: records.filter(r => r.status === "on_leave").length,
  };

  const handleBulkMark = async () => {
    if (!unmarked.length) { toast.error("All employees already marked"); return; }
    const oid = officeId !== "all" ? officeId : unmarked[0]?.officeId || "";
    try {
      await bulk.mutateAsync({ officeId: oid, date: selectedDate, status: bulkStatus, employeeIds: unmarked.map(e => e.id) });
      toast.success(`${unmarked.length} employees marked as ${STATUS_LABELS[bulkStatus]}`);
      setBulkOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Bulk mark failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAtt.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Record deleted");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-auto h-9 text-xs" />
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setBulkOpen(true)}>
            <Users className="w-3 h-3" /> Bulk Mark
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1" onClick={() => { setEditRecord(null); setDialogOpen(true); }}>
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {STATUSES.map(s => {
          const Icon = STATUS_ICONS[s];
          return (
            <div key={s} className="bg-card rounded-xl border border-border p-2.5 text-center shadow-sm">
              <Icon className="w-4 h-4 mx-auto mb-1 opacity-60" />
              <p className="text-[10px] text-muted-foreground">{STATUS_LABELS[s]}</p>
              <p className="text-base font-bold text-card-foreground">{summary[s]}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        {isLoading ? (
          <div className="h-32 animate-pulse" />
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No attendance recorded for {formatDate(selectedDate)}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Employee</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Check In</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Check Out</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Note</th>
                  <th className="px-4 py-3 w-20 text-center text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-card-foreground">
                      {r.employee?.fullName || employees.find(e => e.id === r.employeeId)?.fullName || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status]}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground hidden sm:table-cell">{r.checkIn || "—"}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground hidden sm:table-cell">{r.checkOut || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-[160px] truncate">{r.note || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditRecord(r); setDialogOpen(true); }}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => setDeleteTarget(r)}>
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

      {unmarked.length > 0 && (
        <div className="bg-stat-pending/10 border border-stat-pending/30 rounded-xl p-3 text-xs text-stat-pending">
          <strong>{unmarked.length}</strong> employee{unmarked.length > 1 ? "s" : ""} not yet marked: {unmarked.slice(0, 3).map(e => e.fullName).join(", ")}{unmarked.length > 3 ? ` +${unmarked.length - 3} more` : ""}
        </div>
      )}

      {/* Dialogs */}
      <AttendanceDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        record={editRecord}
        employees={employees}
        officeId={officeId}
        defaultDate={selectedDate}
      />

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Bulk Mark Attendance</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">Mark <strong>{unmarked.length}</strong> unmarked employees for <strong>{formatDate(selectedDate)}</strong></p>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Status for all</Label>
              <Select value={bulkStatus} onValueChange={v => setBulkStatus(v as AttendanceStatus)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)} className="h-9 text-xs">Cancel</Button>
            <Button onClick={handleBulkMark} disabled={bulk.isPending || !unmarked.length} className="h-9 text-xs">Apply to {unmarked.length}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-base flex items-center gap-2"><Trash2 className="w-4 h-4 text-destructive" /> Delete Record</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Delete this attendance record for <strong>{deleteTarget?.employee?.fullName}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="h-9 text-xs">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteAtt.isPending} className="h-9 text-xs">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AnalyticsTab = ({ officeId }: { officeId: string }) => {
  const [month, setMonth] = useState(currentMonth());
  const { data: records = [], isLoading } = useAttendance({ month, officeId });
  const { data: employees = [] } = useEmployees({ officeId: officeId !== "all" ? officeId : undefined });

  const employeeStats = useMemo(() => {
    const map: Record<string, Record<AttendanceStatus, number> & { name: string }> = {};
    employees.forEach(e => {
      map[e.id] = { name: e.fullName, present: 0, absent: 0, half_day: 0, late: 0, on_leave: 0 };
    });
    records.forEach(r => {
      if (map[r.employeeId]) {
        map[r.employeeId][r.status]++;
      }
    });
    return Object.values(map).filter(e => {
      const total = e.present + e.absent + e.half_day + e.late + e.on_leave;
      return total > 0;
    }).sort((a, b) => b.present - a.present);
  }, [records, employees]);

  const totals = useMemo(() => records.reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; },
    {} as Record<AttendanceStatus, number>
  ), [records]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-auto h-9 text-xs" />
        <span className="text-xs text-muted-foreground">{records.length} records</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {STATUSES.map(s => {
          const Icon = STATUS_ICONS[s];
          return (
            <div key={s} className="bg-card rounded-xl border border-border p-3 text-center shadow-sm">
              <Icon className="w-4 h-4 mx-auto mb-1 opacity-60" />
              <p className="text-[10px] text-muted-foreground">{STATUS_LABELS[s]}</p>
              <p className="text-lg font-bold text-card-foreground">{totals[s] || 0}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="px-4 py-3 border-b border-border bg-muted/50">
          <h3 className="text-xs md:text-sm font-semibold text-foreground flex items-center gap-2"><BarChart2 className="w-4 h-4 text-primary" /> Per-Employee Summary</h3>
        </div>
        {isLoading ? (
          <div className="h-32 animate-pulse" />
        ) : employeeStats.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">No attendance data for this month</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Employee</th>
                  <th className="text-center px-3 py-2.5 text-emerald-600 font-medium">P</th>
                  <th className="text-center px-3 py-2.5 text-red-600 font-medium">A</th>
                  <th className="text-center px-3 py-2.5 text-orange-600 font-medium">L</th>
                  <th className="text-center px-3 py-2.5 text-yellow-600 font-medium">H</th>
                  <th className="text-center px-3 py-2.5 text-blue-600 font-medium">OL</th>
                  <th className="text-center px-3 py-2.5 text-muted-foreground font-medium hidden sm:table-cell">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employeeStats.map(e => {
                  const total = e.present + e.absent + e.half_day + e.late + e.on_leave;
                  const rate = total > 0 ? Math.round((e.present / total) * 100) : 0;
                  return (
                    <tr key={e.name} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-medium text-card-foreground">{e.name}</td>
                      <td className="px-3 py-2.5 text-center text-emerald-600 font-semibold">{e.present}</td>
                      <td className="px-3 py-2.5 text-center text-red-600 font-semibold">{e.absent}</td>
                      <td className="px-3 py-2.5 text-center text-orange-600 font-semibold">{e.late}</td>
                      <td className="px-3 py-2.5 text-center text-yellow-600 font-semibold">{e.half_day}</td>
                      <td className="px-3 py-2.5 text-center text-blue-600 font-semibold">{e.on_leave}</td>
                      <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-12 bg-muted rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const Attendance = () => {
  const { selectedOfficeId } = useOffice();

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Attendance</h1>
        <p className="text-xs md:text-sm text-muted-foreground">Track and manage employee attendance records</p>
      </div>
      <Tabs defaultValue="daily">
        <TabsList className="mb-4 bg-muted/50 h-auto p-1">
          <TabsTrigger value="daily" className="gap-1.5 text-xs md:text-sm h-8 md:h-9">
            <CalendarDays className="w-3.5 h-3.5" /> Daily Register
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 text-xs md:text-sm h-8 md:h-9">
            <BarChart2 className="w-3.5 h-3.5" /> Analytics
          </TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
          <DailyRegisterTab officeId={selectedOfficeId || "all"} />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsTab officeId={selectedOfficeId || "all"} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Attendance;
