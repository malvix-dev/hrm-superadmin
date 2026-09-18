import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Users, Layers, ChevronsUpDown, Check, Globe, Building2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment, Department, DeptInput } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { useOffices } from "@/hooks/useOffices";
import { useAuth } from "@/contexts/AuthContext";

const Departments = () => {
  const { isSuperAdmin, isAreaManager, isBranchManager, staff } = useAuth();
  const { data: departments = [], isLoading } = useDepartments();
  const { data: employees = [] } = useEmployees();
  const { data: offices = [] } = useOffices();
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [form, setForm] = useState<DeptInput>({ name: "", description: "", headName: "", headId: "", scope: "global" });
  const [headOpen, setHeadOpen] = useState(false);

  const activeEmployees = employees.filter((e) => e.status !== "terminated");
  const countByDept = (deptId: string) => employees.filter((e) => e.departmentId === deptId && e.status !== "terminated").length;

  // Branches the current user can pick from
  const availableBranches = isSuperAdmin
    ? offices
    : isAreaManager
    ? offices.filter((o) => (staff?.branchIds ?? []).includes(o.id))
    : offices.filter((o) => o.id === staff?.branchId);

  const canEdit = (dept: Department) => {
    if (isSuperAdmin) return true;
    if (dept.scope === "global") return false;
    if (isAreaManager) return (staff?.branchIds ?? []).includes(dept.officeId ?? "");
    if (isBranchManager) return dept.officeId === staff?.branchId;
    return false;
  };

  const openAdd = () => {
    setEditTarget(null);
    const defaultScope = isSuperAdmin ? "global" : "branch";
    const defaultOfficeId = isBranchManager ? (staff?.branchId ?? "") : "";
    setForm({ name: "", description: "", headName: "", headId: "", scope: defaultScope, officeId: defaultOfficeId });
    setFormOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditTarget(dept);
    setForm({
      name: dept.label || dept.name,
      description: dept.description,
      headName: dept.headName,
      headId: dept.headId,
      scope: dept.scope ?? "global",
      officeId: dept.officeId ?? "",
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Department name is required"); return; }
    if (form.scope === "branch" && !form.officeId && !isBranchManager) {
      toast.error("Please select a branch");
      return;
    }
    const payload: DeptInput = {
      ...form,
      officeId: form.scope === "branch" ? (isBranchManager ? (staff?.branchId ?? undefined) : form.officeId || undefined) : undefined,
    };
    try {
      if (editTarget) {
        await updateDept.mutateAsync({ id: editTarget.id, ...payload });
        toast.success("Department updated");
      } else {
        await createDept.mutateAsync(payload);
        toast.success("Department added");
      }
      setFormOpen(false);
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.message || "Failed to save department");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDept.mutateAsync(deleteTarget.id);
      toast.success("Department deleted");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.message || "Failed to delete department");
    }
  };

  return (
    <div>
      <div className="mb-4 md:mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Departments</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Manage your organization's departments</p>
        </div>
        <Button onClick={openAdd} className="gap-2 shrink-0"><Plus className="w-4 h-4" /> Add Department</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {Array(3).fill(0).map((_, i) => <div key={i} className="bg-card rounded-xl border border-border h-36 animate-pulse" />)}
        </div>
      ) : departments.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center shadow-sm">
          <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No departments yet</p>
          <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Department</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {departments.map((dept) => {
            const empCount = dept._count?.employees ?? countByDept(dept.id);
            const isGlobal = dept.scope === "global";
            const editable = canEdit(dept);
            return (
              <div key={dept.id} className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/departments/${dept.id}`} className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-card-foreground truncate">{dept.label || dept.name}</p>
                        {isGlobal
                          ? <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0"><Globe className="w-2.5 h-2.5" />Global</Badge>
                          : <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0"><Building2 className="w-2.5 h-2.5" />{dept.office?.name ?? "Branch"}</Badge>
                        }
                      </div>
                      {dept.headName && <p className="text-xs text-muted-foreground truncate">Head: {dept.headName}</p>}
                    </div>
                  </Link>
                  {editable && (
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-primary/10" onClick={() => openEdit(dept)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground" onClick={() => setDeleteTarget(dept)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  )}
                </div>
                {dept.description && <p className="text-xs text-muted-foreground line-clamp-2">{dept.description}</p>}
                <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-border">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    <span className="font-semibold text-card-foreground">{empCount}</span> employee{empCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Department" : "Add Department"}</DialogTitle>
            <DialogDescription>{editTarget ? "Update department details." : "Create a new department."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Department Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Engineering" />
            </div>

            {/* Scope — only shown on create or if super_admin */}
            {!editTarget && isSuperAdmin && (
              <div className="space-y-1.5">
                <Label>Scope</Label>
                <RadioGroup
                  value={form.scope ?? "global"}
                  onValueChange={(v) => setForm({ ...form, scope: v as "global" | "branch", officeId: v === "global" ? "" : form.officeId })}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="global" id="scope-global" />
                    <Label htmlFor="scope-global" className="cursor-pointer">Global (all branches)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="branch" id="scope-branch" />
                    <Label htmlFor="scope-branch" className="cursor-pointer">Specific branch</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Branch picker for area_manager or super_admin when scope=branch */}
            {!editTarget && (form.scope === "branch") && !isBranchManager && (
              <div className="space-y-1.5">
                <Label>Branch *</Label>
                <Select value={form.officeId ?? ""} onValueChange={(v) => setForm({ ...form, officeId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select branch…" /></SelectTrigger>
                  <SelectContent>
                    {availableBranches.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name} — {o.city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Department Head</Label>
              <Popover open={headOpen} onOpenChange={setHeadOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    {form.headName || <span className="text-muted-foreground">Select employee…</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search employee…" />
                    <CommandList>
                      <CommandEmpty>No employee found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="none" onSelect={() => { setForm({ ...form, headName: "", headId: "" }); setHeadOpen(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", !form.headId ? "opacity-100" : "opacity-0")} />
                          None
                        </CommandItem>
                        {activeEmployees.map((emp) => (
                          <CommandItem key={emp.id} value={emp.fullName} onSelect={() => { setForm({ ...form, headName: emp.fullName, headId: emp.id }); setHeadOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", form.headId === emp.id ? "opacity-100" : "opacity-0")} />
                            <span>{emp.fullName}</span>
                            <span className="ml-1.5 text-xs text-muted-foreground">{emp.designation?.label || emp.designation?.title || emp.dutyType}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of this department" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createDept.isPending || updateDept.isPending}>{editTarget ? "Save Changes" : "Add Department"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{deleteTarget?.label || deleteTarget?.name}</strong>?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteDept.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Departments;
