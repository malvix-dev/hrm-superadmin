import { useState } from "react";
import { useOffice } from "@/contexts/OfficeContext";
import { useEmployees } from "@/hooks/useEmployees";
import {
  useOvertime, useCreateOvertime, useUpdateOvertimeStatus, useEditOvertime, useDeleteOvertime,
  OvertimeRecord,
} from "@/hooks/useOvertime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Plus, Clock, CheckCircle, XCircle, Pencil, Trash2, Timer, ChevronsUpDown, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusStyle = (s: string) =>
  s === "approved" ? "bg-stat-free/15 text-stat-free"
  : s === "rejected" ? "bg-destructive/15 text-destructive"
  : "bg-stat-pending/15 text-stat-pending";

const fmtTime = (t?: string | null) => {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
};

// ── Initiate Overtime Dialog ──────────────────────────────────────────────────
const InitiateDialog = ({ open, onClose, officeId }: { open: boolean; onClose: () => void; officeId: string }) => {
  const { data: employees = [] } = useEmployees({ officeId: officeId !== "all" ? officeId : undefined });
  const create = useCreateOvertime();

  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [empPickerOpen, setEmpPickerOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("19:00");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const handleSave = async () => {
    if (!employeeId) { toast.error("Select an employee"); return; }
    if (!startTime || !endTime) { toast.error("Set start and end times"); return; }
    try {
      await create.mutateAsync({ employeeId, date, startTime, endTime, reason: reason || undefined, note: note || undefined });
      toast.success("Overtime recorded and approved");
      onClose();
      setEmployeeId(""); setEmployeeName(""); setReason(""); setNote("");
    } catch (e: any) { toast.error(e.message || "Failed to create overtime"); }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Timer className="w-4 h-4 text-primary" /> Initiate Overtime
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Employee</Label>
            <Popover open={empPickerOpen} onOpenChange={setEmpPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full h-9 justify-between text-xs font-normal">
                  {employeeName || <span className="text-muted-foreground">Search employee…</span>}
                  <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Type name to search…" className="h-8 text-xs" />
                  <CommandList>
                    <CommandEmpty className="text-xs py-4 text-center text-muted-foreground">No employees found</CommandEmpty>
                    <CommandGroup>
                      {employees.map(e => (
                        <CommandItem
                          key={e.id}
                          value={e.fullName}
                          onSelect={() => {
                            setEmployeeId(e.id);
                            setEmployeeName(e.fullName);
                            setEmpPickerOpen(false);
                          }}
                          className="text-xs"
                        >
                          <Check className={cn("mr-2 h-3.5 w-3.5", employeeId === e.id ? "opacity-100" : "opacity-0")} />
                          <div>
                            <p className="font-medium">{e.fullName}</p>
                            {(e.designation?.title || e.department?.name) && (
                              <p className="text-[10px] text-muted-foreground">{e.designation?.title}{e.designation?.title && e.department?.name ? " · " : ""}{e.department?.name}</p>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9 text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Start Time</Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">End Time</Label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Reason (optional)</Label>
            <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for overtime..." className="h-9 text-xs" />
          </div>
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Note (optional)</Label>
            <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Admin note..." rows={2} className="text-xs" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="h-9 text-xs">Cancel</Button>
          <Button onClick={handleSave} disabled={create.isPending} className="h-9 text-xs">Record Overtime</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Edit Times Dialog ─────────────────────────────────────────────────────────
const EditTimesDialog = ({ record, onClose }: { record: OvertimeRecord | null; onClose: () => void }) => {
  const edit = useEditOvertime();
  const [startTime, setStartTime] = useState(record?.startTime || "");
  const [endTime, setEndTime] = useState(record?.endTime || "");
  const [note, setNote] = useState(record?.note || "");

  const handleSave = async () => {
    if (!record) return;
    try {
      await edit.mutateAsync({ id: record.id, startTime, endTime: endTime || undefined, note: note || undefined });
      toast.success("Overtime times updated");
      onClose();
    } catch (e: any) { toast.error(e.message || "Failed to update"); }
  };

  return (
    <Dialog open={!!record} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Pencil className="w-4 h-4 text-primary" /> Edit Overtime Times
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Start Time</Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">End Time</Label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Note</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Note..." className="h-9 text-xs" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="h-9 text-xs">Cancel</Button>
          <Button onClick={handleSave} disabled={edit.isPending} className="h-9 text-xs">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Reject Dialog ─────────────────────────────────────────────────────────────
const RejectDialog = ({ record, onClose }: { record: OvertimeRecord | null; onClose: () => void }) => {
  const updateStatus = useUpdateOvertimeStatus();
  const [reason, setReason] = useState("");

  const handleReject = async () => {
    if (!record) return;
    try {
      await updateStatus.mutateAsync({ id: record.id, status: "rejected", rejectedReason: reason || undefined });
      toast.success("Overtime rejected");
      onClose();
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  return (
    <Dialog open={!!record} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <XCircle className="w-4 h-4 text-destructive" /> Reject Overtime
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-xs text-muted-foreground">
            Reject overtime for <strong>{record?.employee?.fullName}</strong> on {record?.date}?
          </p>
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Reason (optional)</Label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for rejection..." rows={2} className="text-xs" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="h-9 text-xs">Cancel</Button>
          <Button variant="destructive" onClick={handleReject} disabled={updateStatus.isPending} className="h-9 text-xs">Reject</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const Overtime = () => {
  const { selectedOfficeId } = useOffice();
  const officeId = selectedOfficeId || "all";

  const [filterStatus, setFilterStatus] = useState("all");
  const [initiateOpen, setInitiateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OvertimeRecord | null>(null);
  const [rejectTarget, setRejectTarget] = useState<OvertimeRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OvertimeRecord | null>(null);

  const { data: records = [], isLoading } = useOvertime({
    officeId: officeId !== "all" ? officeId : undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
  });
  const updateStatus = useUpdateOvertimeStatus();
  const deleteOT = useDeleteOvertime();

  const handleApprove = async (id: string) => {
    try { await updateStatus.mutateAsync({ id, status: "approved" }); toast.success("Overtime approved"); }
    catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteOT.mutateAsync(deleteTarget.id); setDeleteTarget(null); toast.success("Overtime deleted"); }
    catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const pending = records.filter(r => r.status === "pending").length;
  const approved = records.filter(r => r.status === "approved").length;
  const rejected = records.filter(r => r.status === "rejected").length;
  const totalPay = records.filter(r => r.status === "approved").reduce((sum, r) => sum + (r.payAmount || 0), 0);

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Overtime</h1>
        <p className="text-xs md:text-sm text-muted-foreground">Track and manage employee overtime requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4">
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
        <div className="bg-card rounded-xl border border-border p-3 md:p-4 shadow-sm text-center">
          <Timer className="w-4 h-4 mx-auto mb-1 text-primary opacity-70" />
          <p className="text-[10px] text-muted-foreground">Total Pay</p>
          <p className="text-base font-bold text-card-foreground">Rs {totalPay.toFixed(0)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-9 w-40 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Records</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" className="h-8 text-xs gap-1" onClick={() => setInitiateOpen(true)}>
          <Plus className="w-3 h-3" /> Initiate Overtime
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm">
        {isLoading ? (
          <div className="h-32 animate-pulse" />
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Timer className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No overtime records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Employee</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Time</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">Hours</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Pay</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Type</th>
                  <th className="px-4 py-3 w-28 text-center text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-card-foreground">{r.employee?.fullName || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{r.date}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {fmtTime(r.startTime)}{r.endTime ? ` – ${fmtTime(r.endTime)}` : " (running…)"}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-card-foreground">
                      {r.hours != null ? `${r.hours}h` : "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-card-foreground hidden md:table-cell">
                      {r.payAmount != null ? `Rs ${r.payAmount.toFixed(0)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyle(r.status)}`}>
                        {r.status === "approved" && <CheckCircle className="w-2.5 h-2.5" />}
                        {r.status === "rejected" && <XCircle className="w-2.5 h-2.5" />}
                        {r.status === "pending" && <Clock className="w-2.5 h-2.5" />}
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-medium">{r.type === "admin" ? "Admin" : r.type === "wfh" ? "WFH" : "Self"}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        {r.status === "pending" && (
                          <>
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-stat-free hover:bg-stat-free/10" title="Approve" onClick={() => handleApprove(r.id)}>
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive hover:bg-destructive/10" title="Reject" onClick={() => setRejectTarget(r)}>
                              <XCircle className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6" title="Edit times" onClick={() => setEditTarget(r)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" title="Delete" onClick={() => setDeleteTarget(r)}>
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

      <InitiateDialog open={initiateOpen} onClose={() => setInitiateOpen(false)} officeId={officeId} />
      <EditTimesDialog record={editTarget} onClose={() => setEditTarget(null)} />
      <RejectDialog record={rejectTarget} onClose={() => setRejectTarget(null)} />

      <Dialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-base flex items-center gap-2"><Trash2 className="w-4 h-4 text-destructive" /> Delete Overtime</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">
            Delete overtime for <strong>{deleteTarget?.employee?.fullName}</strong> on {deleteTarget?.date}?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="h-9 text-xs">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteOT.isPending} className="h-9 text-xs">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Overtime;
