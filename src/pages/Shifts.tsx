import { useState, useEffect } from "react";
import { useOffice } from "@/contexts/OfficeContext";
import { useOffices } from "@/hooks/useOffices";
import { useEmployees } from "@/hooks/useEmployees";
import {
  useShifts, useCreateShift, useUpdateShift, useDeleteShift, useAssignShift,
  Shift,
} from "@/hooks/useShifts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Clock, Plus, Pencil, Trash2, Users, Star, Coffee } from "lucide-react";
import { toast } from "sonner";

const fmtTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
};

const shiftHours = (s: Shift) => {
  const [sh, sm] = s.startTime.split(":").map(Number);
  const [eh, em] = s.endTime.split(":").map(Number);
  const total = (eh * 60 + em) - (sh * 60 + sm) - s.breakDuration;
  return Math.max(0, total / 60).toFixed(1);
};

// ── Shift Form ────────────────────────────────────────────────────────────────
const ShiftFormDialog = ({
  open, onClose, editing, officeId,
}: { open: boolean; onClose: () => void; editing: Shift | null; officeId: string }) => {
  const { data: offices = [] } = useOffices();
  const create = useCreateShift();
  const update = useUpdateShift();

  const [name, setName] = useState(editing?.name || "");
  const [selectedOffice, setSelectedOffice] = useState(editing?.officeId || officeId || "");
  const [startTime, setStartTime] = useState(editing?.startTime || "09:00");
  const [endTime, setEndTime] = useState(editing?.endTime || "17:00");
  const [breakStart, setBreakStart] = useState(editing?.breakStartTime || "");
  const [breakEnd, setBreakEnd] = useState(editing?.breakEndTime || "");
  const [breakDuration, setBreakDuration] = useState(String(editing?.breakDuration ?? 0));
  const [gracePeriod, setGracePeriod] = useState(String(editing?.gracePeriod ?? 15));
  const [isDefault, setIsDefault] = useState(editing?.isDefault ?? false);

  // Reset full form only when dialog opens or editing target changes
  useEffect(() => {
    if (open) {
      setName(editing?.name || "");
      setSelectedOffice(editing?.officeId || officeId || "");
      setStartTime(editing?.startTime || "09:00");
      setEndTime(editing?.endTime || "17:00");
      setBreakStart(editing?.breakStartTime || "");
      setBreakEnd(editing?.breakEndTime || "");
      setBreakDuration(String(editing?.breakDuration ?? 0));
      setGracePeriod(String(editing?.gracePeriod ?? 15));
      setIsDefault(editing?.isDefault ?? false);
    }
  }, [open, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Once offices load, fill selectedOffice only if still empty
  useEffect(() => {
    if (open && !selectedOffice && offices.length > 0) {
      setSelectedOffice(offices[0].id);
    }
  }, [open, offices, selectedOffice]);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Shift name is required"); return; }
    if (!selectedOffice) { toast.error("Select an office"); return; }
    try {
      const payload = {
        name: name.trim(),
        officeId: selectedOffice,
        startTime,
        endTime,
        breakStartTime: breakStart || null,
        breakEndTime: breakEnd || null,
        breakDuration: Number(breakDuration) || 0,
        gracePeriod: Number(gracePeriod) ?? 15,
        isDefault,
      };
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...payload });
        toast.success("Shift updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Shift created");
      }
      onClose();
    } catch (e: any) { toast.error(e.message || "Failed to save shift"); }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> {editing ? "Edit" : "New"} Shift
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Shift Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Morning Shift" className="h-9 text-xs" />
          </div>
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Office Branch</Label>
            <Select value={selectedOffice} onValueChange={setSelectedOffice}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select office" /></SelectTrigger>
              <SelectContent>
                {offices.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
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
          <div className="border border-border rounded-lg p-3 space-y-2">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
              <Coffee className="w-3 h-3" /> Break Time (optional)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Break Start</Label>
                <Input type="time" value={breakStart} onChange={e => setBreakStart(e.target.value)} className="h-9 text-xs" />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Break End</Label>
                <Input type="time" value={breakEnd} onChange={e => setBreakEnd(e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Break Duration (minutes)</Label>
              <Input type="number" value={breakDuration} onChange={e => setBreakDuration(e.target.value)} min="0" className="h-9 text-xs" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Grace Period (minutes)</Label>
              <Input type="number" value={gracePeriod} onChange={e => setGracePeriod(e.target.value)} min="0" className="h-9 text-xs" />
            </div>
            <div className="flex flex-col justify-end pb-1">
              <div className="flex items-center gap-2 h-9">
                <input type="checkbox" id="defaultShift" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="w-4 h-4 rounded" />
                <Label htmlFor="defaultShift" className="text-xs font-medium cursor-pointer">Default Shift</Label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="h-9 text-xs">Cancel</Button>
          <Button onClick={handleSave} disabled={create.isPending || update.isPending} className="h-9 text-xs">
            {editing ? "Update" : "Create"} Shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Shifts List Tab ───────────────────────────────────────────────────────────
const ShiftsListTab = ({ officeId }: { officeId: string }) => {
  const { data: shifts = [], isLoading } = useShifts(officeId !== "all" ? officeId : undefined);
  const delShift = useDeleteShift();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null);

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (s: Shift) => { setEditing(s); setOpen(true); };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await delShift.mutateAsync(deleteTarget.id); setDeleteTarget(null); toast.success("Shift deleted"); }
    catch (e: any) { toast.error(e.message || "Failed to delete"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{shifts.length} shift{shifts.length !== 1 ? "s" : ""}</p>
        <Button size="sm" className="h-8 text-xs gap-1" onClick={openNew}><Plus className="w-3 h-3" /> New Shift</Button>
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-xl bg-muted/30" />
      ) : shifts.length === 0 ? (
        <div className="bg-card rounded-xl border border-border py-14 text-center text-muted-foreground">
          <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No shifts defined yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {shifts.map(s => (
            <div key={s.id} className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-card-foreground">{s.name}</p>
                    {s.isDefault && <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Star className="w-2 h-2" /> Default</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{shiftHours(s)}h working day</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(s)}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => setDeleteTarget(s)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-muted/40 rounded-lg p-2 text-center">
                  <p className="text-muted-foreground text-[9px] mb-0.5">Start</p>
                  <p className="font-semibold text-card-foreground">{fmtTime(s.startTime)}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2 text-center">
                  <p className="text-muted-foreground text-[9px] mb-0.5">End</p>
                  <p className="font-semibold text-card-foreground">{fmtTime(s.endTime)}</p>
                </div>
              </div>

              {(s.breakStartTime || s.breakDuration > 0) && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Coffee className="w-3 h-3" />
                  {s.breakStartTime && s.breakEndTime
                    ? `Break: ${fmtTime(s.breakStartTime)} – ${fmtTime(s.breakEndTime)}`
                    : `Break: ${s.breakDuration} min`}
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-2">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {s._count?.employees ?? 0} employees</span>
                <span>Grace: {s.gracePeriod} min</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ShiftFormDialog open={open} onClose={() => { setOpen(false); setEditing(null); }} editing={editing} officeId={officeId !== "all" ? officeId : ""} />

      <Dialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-base flex items-center gap-2"><Trash2 className="w-4 h-4 text-destructive" /> Delete Shift</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Delete shift <strong>{deleteTarget?.name}</strong>? Employees assigned to this shift will be unassigned.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="h-9 text-xs">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={delShift.isPending} className="h-9 text-xs">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Assign Employees Tab ──────────────────────────────────────────────────────
const AssignTab = ({ officeId }: { officeId: string }) => {
  const { data: shifts = [] } = useShifts(officeId !== "all" ? officeId : undefined);
  const { data: employees = [] } = useEmployees({ officeId: officeId !== "all" ? officeId : undefined });
  const assignShift = useAssignShift();

  const [selectedShift, setSelectedShift] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<string[]>([]);

  const handleAssign = async () => {
    if (!selectedShift) { toast.error("Select a shift"); return; }
    if (selectedEmp.length === 0) { toast.error("Select at least one employee"); return; }
    try {
      await assignShift.mutateAsync({ shiftId: selectedShift, employeeIds: selectedEmp });
      toast.success(`Assigned ${selectedEmp.length} employee(s) to shift`);
      setSelectedEmp([]);
    } catch (e: any) { toast.error(e.message || "Failed to assign"); }
  };

  const toggleEmp = (id: string) => {
    setSelectedEmp(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const shiftEmployees = employees.filter(e => (e as any).shiftId === selectedShift);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-medium mb-1.5 block">Select Shift</Label>
        <Select value={selectedShift} onValueChange={v => { setSelectedShift(v); setSelectedEmp([]); }}>
          <SelectTrigger className="h-9 text-xs w-64"><SelectValue placeholder="Choose a shift" /></SelectTrigger>
          <SelectContent>
            {shifts.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({fmtTime(s.startTime)} – {fmtTime(s.endTime)})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedShift && (
        <>
          {shiftEmployees.length > 0 && (
            <div className="bg-primary/5 rounded-lg p-3 text-xs text-primary">
              {shiftEmployees.length} employee(s) already on this shift: {shiftEmployees.map(e => e.fullName).join(", ")}
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-medium">Select Employees to Assign</Label>
              <span className="text-[10px] text-muted-foreground">{selectedEmp.length} selected</span>
            </div>
            <div className="bg-card border border-border rounded-xl divide-y divide-border max-h-72 overflow-y-auto">
              {employees.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No employees in this office</p>
              ) : employees.map(e => (
                <label key={e.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 cursor-pointer">
                  <input type="checkbox" checked={selectedEmp.includes(e.id)} onChange={() => toggleEmp(e.id)} className="w-4 h-4 rounded" />
                  <div>
                    <p className="text-xs font-medium text-card-foreground">{e.fullName}</p>
                    <p className="text-[10px] text-muted-foreground">{(e as any).shiftId ? `On: ${shifts.find(s => s.id === (e as any).shiftId)?.name || "Other shift"}` : "No shift assigned"}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <Button onClick={handleAssign} disabled={assignShift.isPending || selectedEmp.length === 0} className="h-9 text-xs gap-1">
            <Users className="w-3.5 h-3.5" /> Assign {selectedEmp.length > 0 ? `(${selectedEmp.length})` : ""} to Shift
          </Button>
        </>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const Shifts = () => {
  const { selectedOfficeId } = useOffice();
  const officeId = selectedOfficeId || "all";

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Shifts</h1>
        <p className="text-xs md:text-sm text-muted-foreground">Manage office shifts, working hours, and employee assignments</p>
      </div>
      <Tabs defaultValue="shifts">
        <TabsList className="mb-4 bg-muted/50 h-auto p-1">
          <TabsTrigger value="shifts" className="gap-1.5 text-xs md:text-sm h-8 md:h-9">
            <Clock className="w-3.5 h-3.5" /> Shifts
          </TabsTrigger>
          <TabsTrigger value="assign" className="gap-1.5 text-xs md:text-sm h-8 md:h-9">
            <Users className="w-3.5 h-3.5" /> Assign Employees
          </TabsTrigger>
        </TabsList>
        <TabsContent value="shifts"><ShiftsListTab officeId={officeId} /></TabsContent>
        <TabsContent value="assign"><AssignTab officeId={officeId} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Shifts;
