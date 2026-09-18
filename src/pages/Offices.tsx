import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, MapPin, Phone, Mail, User, Pencil, Trash2, Building2, Users, ChevronsUpDown, Check, Navigation, Clock, X, Coffee } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { cn, fromSnakeCase } from "@/lib/utils";
import { useOffices, useCreateOffice, useUpdateOffice, useDeleteOffice, Office, OfficeInput } from "@/hooks/useOffices";
import { useEmployees } from "@/hooks/useEmployees";
import { useShifts, useCreateShift, useDeleteShift, Shift } from "@/hooks/useShifts";

interface PendingShift {
  name: string; startTime: string; endTime: string;
  breakStartTime: string; breakEndTime: string; breakDuration: number;
  gracePeriod: number; isDefault: boolean;
}
const SHIFT_PRESETS = [
  { label: "Morning",  name: "Morning",  startTime: "09:00", endTime: "17:00" },
  { label: "Evening",  name: "Evening",  startTime: "14:00", endTime: "22:00" },
  { label: "Night",    name: "Night",    startTime: "22:00", endTime: "06:00" },
  { label: "Custom",   name: "",         startTime: "08:00", endTime: "16:00" },
];
const blankShiftForm = (): PendingShift => ({
  name: "Morning", startTime: "09:00", endTime: "17:00",
  breakStartTime: "", breakEndTime: "", breakDuration: 0,
  gracePeriod: 15, isDefault: false,
});

const emptyForm = (): OfficeInput => ({
  name: "", city: "", address: "", phone: "", email: "", managerName: "", managerId: undefined, status: "active",
  latitude: undefined, longitude: undefined, geoRadius: 200,
});

const Offices = () => {
  const { data: offices = [], isLoading } = useOffices();
  const { data: employees = [] } = useEmployees();
  const { data: allShifts = [] } = useShifts();        // all shifts across branches
  const createOffice = useCreateOffice();
  const updateOffice = useUpdateOffice();
  const deleteOffice = useDeleteOffice();
  const createShift = useCreateShift();
  const deleteShift = useDeleteShift();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Office | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Office | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [managerPickerOpen, setManagerPickerOpen] = useState(false);
  const [latLngRaw, setLatLngRaw] = useState<{ latitude?: string; longitude?: string }>({});
  const [selectedShiftIds, setSelectedShiftIds] = useState<Set<string>>(new Set());

  // Shifts
  const { data: editOfficeShifts = [] } = useShifts(editTarget?.id);
  const [pendingShifts, setPendingShifts] = useState<PendingShift[]>([]);
  const [shiftForm, setShiftForm] = useState<PendingShift>(blankShiftForm());
  const [showShiftForm, setShowShiftForm] = useState(false);

  const activeEmployees = employees.filter((e) => e.status === "active");
  const activeCount = (officeId: string) => employees.filter((e) => e.officeId === officeId && e.status === "active").length;
  const totalCount = (officeId: string) => employees.filter((e) => e.officeId === officeId).length;

  const openAdd = () => {
    setEditTarget(null); setForm(emptyForm()); setLatLngRaw({});
    setPendingShifts([]); setShowShiftForm(false);
    setShiftForm(blankShiftForm()); setSelectedShiftIds(new Set());
    setFormOpen(true);
  };
  const openEdit = (office: Office) => {
    setEditTarget(office);
    setForm({
      name: office.name, city: office.city, address: office.address ?? "", phone: office.phone ?? "",
      email: office.email ?? "", managerName: office.managerName ?? "", managerId: office.managerId ?? undefined,
      status: office.status, latitude: office.latitude ?? undefined, longitude: office.longitude ?? undefined,
      geoRadius: office.geoRadius ?? 200,
    });
    setLatLngRaw({});
    setPendingShifts([]); setShowShiftForm(false);
    setShiftForm(blankShiftForm()); setSelectedShiftIds(new Set());
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.city.trim()) { toast.error("Office name and city are required"); return; }
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === null ? undefined : v])
    ) as typeof form;
    try {
      let officeId = editTarget?.id;
      if (editTarget) {
        await updateOffice.mutateAsync({ id: editTarget.id, ...payload });
        toast.success("Office updated");
      } else {
        const created = await createOffice.mutateAsync(payload) as any;
        officeId = created.id;
        toast.success("Office branch added");
      }
      // Create any pending shifts
      if (officeId && pendingShifts.length > 0) {
        await Promise.all(pendingShifts.map(s => createShift.mutateAsync({
          ...s,
          officeId,
          breakStartTime: s.breakStartTime || null,
          breakEndTime: s.breakEndTime || null,
        })));
      }
      // Clone selected existing shifts into the new branch
      if (officeId && selectedShiftIds.size > 0) {
        const toClone = allShifts.filter(s => selectedShiftIds.has(s.id));
        await Promise.all(toClone.map(s => createShift.mutateAsync({
          officeId,
          name: s.name,
          startTime: s.startTime,
          endTime: s.endTime,
          breakStartTime: s.breakStartTime ?? null,
          breakEndTime: s.breakEndTime ?? null,
          breakDuration: s.breakDuration,
          gracePeriod: s.gracePeriod,
          isDefault: s.isDefault,
        })));
        if (pendingShifts.length > 0 || selectedShiftIds.size > 0)
          toast.success(`${pendingShifts.length + selectedShiftIds.size} shift(s) added`);
      } else if (officeId && pendingShifts.length > 0) {
        toast.success(`${pendingShifts.length} shift(s) added`);
      }
      setFormOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save office");
    }
  };

  const addPendingShift = async () => {
    if (!shiftForm.name.trim()) { toast.error("Shift name is required"); return; }
    if (editTarget) {
      // When editing an existing branch, save the shift immediately
      try {
        await createShift.mutateAsync({
          ...shiftForm,
          officeId: editTarget.id,
          breakStartTime: shiftForm.breakStartTime || null,
          breakEndTime: shiftForm.breakEndTime || null,
        });
        toast.success("Shift added");
      } catch (e: any) { toast.error(e.message || "Failed to add shift"); return; }
    } else {
      setPendingShifts(prev => [...prev, { ...shiftForm }]);
    }
    setShiftForm(blankShiftForm());
    setShowShiftForm(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteOffice.mutateAsync(deleteTarget.id);
      toast.success("Office removed");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete office");
    }
  };

  const set = (field: keyof OfficeInput, value: string) => setForm((f) => ({ ...f, [field]: value }));
  const setNum = (field: "latitude" | "longitude", value: string) => {
    // Keep raw string in state so input stays exactly as typed (allows "24.", "24.86", etc.)
    setLatLngRaw((r) => ({ ...r, [field]: value === "" ? undefined : value }));
    if (value === "") { setForm((f) => ({ ...f, [field]: undefined })); return; }
    const n = parseFloat(value);
    if (!isNaN(n)) setForm((f) => ({ ...f, [field]: n }));
  };

  return (
    <div>
      <div className="mb-4 md:mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Office Branches</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Manage all your office locations</p>
        </div>
        <Button onClick={openAdd} size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Branch</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => <div key={i} className="bg-card rounded-xl border border-border h-40 animate-pulse" />)}
        </div>
      ) : offices.length === 0 ? (
        <div className="bg-card rounded-xl border border-border shadow-sm p-10 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No office branches added yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1 mb-4">Add your first office branch to get started</p>
          <Button onClick={openAdd} size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Branch</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {offices.map((office) => (
            <div key={office.id} className="bg-card rounded-xl border border-border shadow-sm p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-card-foreground truncate">{office.name}</h3>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${office.status === "active" ? "bg-stat-free/15 text-stat-free" : "bg-muted text-muted-foreground"}`}>
                      {office.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(office)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(office)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                {office.city && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{office.city}</span>
                  </div>
                )}
                {office.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0 opacity-0" /><span className="text-xs truncate">{office.address}</span>
                  </div>
                )}
                {office.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 shrink-0" /><span>{office.phone}</span>
                  </div>
                )}
                {office.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{office.email}</span>
                  </div>
                )}
                {office.managerName && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{office.managerName}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span><span className="font-semibold text-card-foreground">{activeCount(office.id)}</span> active / {totalCount(office.id)} total</span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/employees?office=${office.id}`}>View Employees</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Office Branch" : "Add Office Branch"}</DialogTitle>
            <DialogDescription>Enter the details for this office location</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2">
              <Label>Branch Name *</Label>
              <Input className="mt-1" placeholder="e.g. Downtown Office" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Street Address</Label>
              <Input className="mt-1" placeholder="Street address" value={form.address || ""} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>City *</Label>
              <Input className="mt-1" placeholder="City" value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input className="mt-1" placeholder="Office phone" value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-1" type="email" placeholder="office@company.com" value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Branch Manager</Label>
              <Popover open={managerPickerOpen} onOpenChange={setManagerPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="mt-1 w-full justify-between font-normal">
                    {form.managerName || <span className="text-muted-foreground">Select branch manager...</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search employee..." />
                    <CommandList>
                      <CommandEmpty>No employees found</CommandEmpty>
                      <CommandGroup>
                        {form.managerName && (
                          <CommandItem value="__clear__" onSelect={() => { setForm(f => ({ ...f, managerName: "", managerId: undefined })); setManagerPickerOpen(false); }} className="text-muted-foreground italic">
                            Clear selection
                          </CommandItem>
                        )}
                        {activeEmployees.map((emp) => (
                          <CommandItem key={emp.id} value={emp.fullName} onSelect={() => { setForm(f => ({ ...f, managerName: emp.fullName, managerId: emp.id })); setManagerPickerOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", form.managerId === emp.id ? "opacity-100" : "opacity-0")} />
                            <div>
                              <p className="text-sm font-medium">{emp.fullName}</p>
                              <p className="text-xs text-muted-foreground">{emp.designation?.label || emp.designation?.title || emp.dutyType} · {emp.department?.label || emp.department?.name}</p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="col-span-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-medium">Geo-Fencing (optional)</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Set the office GPS coordinates to restrict employee check-in by location.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Latitude</Label>
                  <Input className="mt-1" placeholder="e.g. 24.8607" inputMode="decimal" value={latLngRaw.latitude ?? (form.latitude != null ? String(form.latitude) : "")} onChange={(e) => setNum("latitude", e.target.value)} />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input className="mt-1" placeholder="e.g. 67.0011" inputMode="decimal" value={latLngRaw.longitude ?? (form.longitude != null ? String(form.longitude) : "")} onChange={(e) => setNum("longitude", e.target.value)} />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <Label>Allowed Radius</Label>
                  <span className="text-sm font-semibold text-primary">{form.geoRadius ?? 200} m</span>
                </div>
                <Slider
                  min={50} max={2000} step={50}
                  value={[form.geoRadius ?? 200]}
                  onValueChange={([v]) => setForm((f) => ({ ...f, geoRadius: v }))}
                  className="mt-1"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>50 m</span><span>2000 m</span>
                </div>
              </div>
            </div>
            {/* ── Shifts Section ───────────────────────────────── */}
            <div className="col-span-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm font-medium">Shifts</span>
                </div>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary" onClick={() => setShowShiftForm(v => !v)}>
                  <Plus className="w-3 h-3" /> Add Shift
                </Button>
              </div>

              {/* Preset buttons */}
              {showShiftForm && (
                <div className="bg-muted/40 rounded-lg p-3 space-y-2 mb-3 border border-border">
                  <div className="flex gap-1.5 flex-wrap">
                    {SHIFT_PRESETS.map(p => (
                      <Button key={p.label} type="button" size="sm" variant={shiftForm.name === p.name && p.name ? "default" : "outline"}
                        className="h-7 text-xs"
                        onClick={() => setShiftForm(f => ({ ...f, name: p.name || f.name, startTime: p.startTime, endTime: p.endTime }))}
                      >{p.label}</Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <Label className="text-xs">Shift Name</Label>
                      <Input className="mt-1 h-8 text-xs" placeholder="e.g. Morning" value={shiftForm.name} onChange={e => setShiftForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs">Start Time</Label>
                      <Input type="time" className="mt-1 h-8 text-xs" value={shiftForm.startTime} onChange={e => setShiftForm(f => ({ ...f, startTime: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs">End Time</Label>
                      <Input type="time" className="mt-1 h-8 text-xs" value={shiftForm.endTime} onChange={e => setShiftForm(f => ({ ...f, endTime: e.target.value }))} />
                    </div>
                  </div>
                  {/* Break time */}
                  <div className="border border-border rounded-lg p-2.5 space-y-2">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
                      <Coffee className="w-3 h-3" /> Break (optional)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Break Start</Label>
                        <Input type="time" className="mt-1 h-8 text-xs" value={shiftForm.breakStartTime} onChange={e => setShiftForm(f => ({ ...f, breakStartTime: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Break End</Label>
                        <Input type="time" className="mt-1 h-8 text-xs" value={shiftForm.breakEndTime} onChange={e => setShiftForm(f => ({ ...f, breakEndTime: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Break Duration (min)</Label>
                      <Input type="number" className="mt-1 h-8 text-xs" min="0" value={shiftForm.breakDuration} onChange={e => setShiftForm(f => ({ ...f, breakDuration: Number(e.target.value) }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Grace Period (min)</Label>
                      <Input type="number" className="mt-1 h-8 text-xs" value={shiftForm.gracePeriod} onChange={e => setShiftForm(f => ({ ...f, gracePeriod: Number(e.target.value) }))} />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={shiftForm.isDefault} onChange={e => setShiftForm(f => ({ ...f, isDefault: e.target.checked }))} className="w-3.5 h-3.5 rounded" />
                        Default shift
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button type="button" size="sm" className="h-7 text-xs" onClick={addPendingShift} disabled={createShift.isPending}>
                      {editTarget ? "Save Shift" : "Add"}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowShiftForm(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              {/* Existing shifts picker (when adding new branch) */}
              {!editTarget && allShifts.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground mb-1.5">Select from existing shifts to copy to this branch:</p>
                  <div className="space-y-1">
                    {allShifts.map(s => (
                      <label key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/20 cursor-pointer hover:bg-muted/40 text-xs">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded"
                          checked={selectedShiftIds.has(s.id)}
                          onChange={e => {
                            setSelectedShiftIds(prev => {
                              const next = new Set(prev);
                              e.target.checked ? next.add(s.id) : next.delete(s.id);
                              return next;
                            });
                          }}
                        />
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground">{s.startTime} – {s.endTime}</span>
                        {s.isDefault && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Default</span>}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending new shifts (when creating) */}
              {pendingShifts.length > 0 && (
                <div className="space-y-1 mb-2">
                  {pendingShifts.map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground">{s.startTime} – {s.endTime}</span>
                        {s.isDefault && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Default</span>}
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => setPendingShifts(prev => prev.filter((_, j) => j !== i))}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Existing shifts when editing */}
              {editTarget && editOfficeShifts.length > 0 && (
                <div className="space-y-1">
                  {editOfficeShifts.map((s: Shift) => (
                    <div key={s.id} className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2 text-xs border border-border">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground">{s.startTime} – {s.endTime}</span>
                        {(s.breakStartTime || s.breakDuration > 0) && (
                          <span className="flex items-center gap-0.5 text-muted-foreground"><Coffee className="w-2.5 h-2.5" />{s.breakDuration}m</span>
                        )}
                        {s.isDefault && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Default</span>}
                        {s._count?.employees != null && <span className="text-muted-foreground">{s._count.employees} emp</span>}
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive"
                        onClick={async () => { try { await deleteShift.mutateAsync(s.id); toast.success("Shift removed"); } catch { toast.error("Failed"); } }}
                      ><X className="w-3 h-3" /></Button>
                    </div>
                  ))}
                </div>
              )}
              {editTarget && editOfficeShifts.length === 0 && !showShiftForm && (
                <p className="text-xs text-muted-foreground">No shifts yet. Click "Add Shift" to create one.</p>
              )}
              {!editTarget && pendingShifts.length === 0 && !showShiftForm && (
                <p className="text-xs text-muted-foreground">Add shifts like Morning, Evening, or Night for this branch.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createOffice.isPending || updateOffice.isPending || createShift.isPending}>{editTarget ? "Update" : "Add Branch"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Office Branch</DialogTitle>
            <DialogDescription>Are you sure you want to remove <strong>{deleteTarget?.name}</strong>? Employees assigned will lose their branch assignment.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteOffice.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Offices;
