import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOffices } from "@/hooks/useOffices";
import { useEmployees } from "@/hooks/useEmployees";
import { useStaffList, useCreateStaff, useUpdateStaff, useDeleteStaff, StaffMember, StaffRole, StaffInput } from "@/hooks/useStaff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, Users, ShieldCheck, Eye, EyeOff, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<StaffRole, string> = { super_admin: "Super Admin", org_owner: "Org Owner", area_manager: "Area Manager", branch_manager: "Branch Manager", finance_manager: "Finance Manager", hr_manager: "HR Manager" };
const ROLE_COLORS: Record<StaffRole, string> = { super_admin: "bg-red-100 text-red-700", org_owner: "bg-violet-100 text-violet-700", area_manager: "bg-purple-100 text-purple-700", branch_manager: "bg-blue-100 text-blue-700", finance_manager: "bg-amber-100 text-amber-700", hr_manager: "bg-green-100 text-green-700" };
const ROLE_ORDER: StaffRole[] = ["super_admin", "org_owner", "area_manager", "branch_manager", "finance_manager", "hr_manager"];

const Staff = () => {
  const { staff: currentUser, isSuperAdmin, isAreaManager, isBranchManager } = useAuth();
  const { data: allStaff = [], isLoading } = useStaffList();
  const { data: offices = [] } = useOffices();
  const { data: employees = [] } = useEmployees();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [empSearch, setEmpSearch] = useState("");
  const [form, setForm] = useState<StaffInput & { password: string }>({
    name: "", email: "", password: "", role: "branch_manager", branchId: "", branchIds: [], employeeId: null,
  });

  const existingStaffEmails = useMemo(() => new Set(allStaff.map((s) => s.email.toLowerCase())), [allStaff]);
  const linkedEmployeeIds = useMemo(() => new Set(allStaff.map((s) => s.employeeId).filter(Boolean)), [allStaff]);
  const availableEmployees = useMemo(
    () => employees.filter((e) => {
      const emailTaken = e.email && existingStaffEmails.has(e.email.toLowerCase());
      const alreadyLinked = linkedEmployeeIds.has(e.id);
      return !emailTaken && !alreadyLinked;
    }),
    [employees, existingStaffEmails, linkedEmployeeIds]
  );
  const filteredEmployees = useMemo(() => {
    const q = empSearch.trim().toLowerCase();
    if (!q) return availableEmployees;
    return availableEmployees.filter((e) => e.fullName.toLowerCase().includes(q));
  }, [availableEmployees, empSearch]);

  const visible = useMemo(() => {
    if (isSuperAdmin) return allStaff;
    if (isAreaManager) return allStaff; // backend already scopes to their branches
    if (isBranchManager) return allStaff.filter((s) => s.role === "finance_manager" && s.branch?.id === currentUser?.branchId);
    return [];
  }, [allStaff, isSuperAdmin, isAreaManager, isBranchManager, currentUser]);

  const byRole: Record<string, StaffMember[]> = {};
  visible.forEach((s) => { if (!byRole[s.role]) byRole[s.role] = []; byRole[s.role].push(s); });

  const getBranchName = (branchId?: string) => {
    if (!branchId || branchId === "all") return "All Branches";
    return offices.find((o) => o.id === branchId)?.name || branchId;
  };

  const openAdd = () => {
    setEditTarget(null);
    setSelectedEmployeeId("");
    setEmpSearch("");
    setForm({ name: "", email: "", password: "", role: "branch_manager", branchId: "", branchIds: [], employeeId: null });
    setShowPwd(true);
    setFormOpen(true);
  };

  const handleEmployeeSelect = (empId: string) => {
    setSelectedEmployeeId(empId);
    setEmpSearch("");
    const emp = employees.find((e) => e.id === empId);
    if (emp) setForm((f) => ({ ...f, name: emp.fullName, email: emp.email || "", employeeId: emp.id }));
  };

  const openEdit = (s: StaffMember) => {
    setEditTarget(s);
    setSelectedEmployeeId(s.employeeId || "");
    setForm({
      name: s.name, email: s.email, password: "", role: s.role,
      branchId: s.branch?.id || "",
      branchIds: s.branches?.map(b => b.id) || [],
      employeeId: s.employeeId || null,
    });
    setShowPwd(false);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!editTarget && !selectedEmployeeId) return toast.error("Please select an employee to link this staff account to");
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.email.trim()) return toast.error("Email is required");
    if (!editTarget && !form.password) return toast.error("Password is required");
    if (form.role === "area_manager" && (!form.branchIds || form.branchIds.length === 0))
      return toast.error("Please select at least one branch");
    if (form.role !== "super_admin" && form.role !== "org_owner" && form.role !== "area_manager" && !form.branchId)
      return toast.error("Please select a branch");
    try {
      if (editTarget) {
        const payload: Partial<StaffInput> & { id: string } = {
          id: editTarget.id, name: form.name, email: form.email, role: form.role,
          branchId: form.role !== "area_manager" ? (form.branchId || undefined) : undefined,
          branchIds: form.role === "area_manager" ? form.branchIds : undefined,
          employeeId: form.employeeId ?? null,
        };
        if (form.password) (payload as any).password = form.password;
        await updateStaff.mutateAsync(payload);
        toast.success("Staff updated");
      } else {
        await createStaff.mutateAsync({
          ...form,
          branchId: form.role !== "area_manager" ? (form.branchId || undefined) : undefined,
          branchIds: form.role === "area_manager" ? form.branchIds : undefined,
          employeeId: form.employeeId ?? null,
        });
        toast.success("Staff account created");
      }
      setSelectedEmployeeId("");
      setEmpSearch("");
      setFormOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save staff");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStaff.mutateAsync(deleteTarget.id);
      toast.success("Staff account removed");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete staff");
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground text-sm">
            {isSuperAdmin ? "Manage all staff accounts and role assignments" : "Manage staff accounts for your branch"}
          </p>
        </div>
        {(isSuperAdmin || isAreaManager) && (
          <Button onClick={openAdd} size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Staff</Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Staff", value: visible.length, color: "text-primary" },
          ...(isSuperAdmin ? [{ label: "Super Admins", value: (byRole["super_admin"] || []).length, color: "text-red-600" }] : []),
          { label: "Branch Managers", value: (byRole["branch_manager"] || []).length, color: "text-blue-600" },
          { label: "Finance Managers", value: (byRole["finance_manager"] || []).length, color: "text-amber-600" },
        ].map((c) => (
          <div key={c.label} className="bg-card rounded-xl border border-border shadow-sm p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="bg-card rounded-xl border border-border h-40 animate-pulse" />
      ) : (
        ROLE_ORDER.filter((r) => byRole[r]?.length && (r !== "super_admin" || isSuperAdmin)).map((role) => (
          <div key={role} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">{ROLE_LABELS[role]}s</h2>
              <span className="text-xs text-muted-foreground">({byRole[role].length})</span>
            </div>
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Name</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Email</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Role</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Branch</th>
                    <th className="text-center px-4 py-3 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {byRole[role].map((s) => (
                    <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{s.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-card-foreground">{s.name}</span>
                              {s.id === currentUser?.id && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">You</span>}
                              {s.employeeId && <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">Linked</span>}
                            </div>
                            {s.employee && <p className="text-[10px] text-muted-foreground mt-0.5">{[s.employee.designation?.label || s.employee.designation?.title, s.employee.phone].filter(Boolean).join(" · ")}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", ROLE_COLORS[s.role])}>{ROLE_LABELS[s.role]}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {s.role === "area_manager" && s.branches?.length
                          ? s.branches.map(b => b.name).join(", ")
                          : getBranchName(s.branch?.id)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {(isSuperAdmin || s.id !== currentUser?.id) && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil className="w-3.5 h-3.5" /></Button>
                          )}
                          {s.id !== currentUser?.id && isSuperAdmin && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive hover:text-destructive-foreground" onClick={() => setDeleteTarget(s)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {!isLoading && visible.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No staff accounts yet</p>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) { setSelectedEmployeeId(""); setEmpSearch(""); } setFormOpen(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Staff Account" : "Add Staff Account"}</DialogTitle>
            <DialogDescription>{editTarget ? "Update the details for this staff member." : "Create a new staff account."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Employee link picker — shown on add; shown on edit too so you can change/unlink */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{editTarget ? "Linked Employee" : "Select Employee *"}</Label>
                {editTarget && form.employeeId && (
                  <button type="button" className="text-[10px] text-destructive hover:underline" onClick={() => { setSelectedEmployeeId(""); setForm(f => ({ ...f, employeeId: null })); }}>
                    Unlink
                  </button>
                )}
              </div>
              {form.employeeId && editTarget ? (
                <div className="border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 rounded-md px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{editTarget.employee?.fullName ?? form.name}</p>
                    <p className="text-[10px] text-muted-foreground">{[editTarget.employee?.designation?.label || editTarget.employee?.designation?.title, editTarget.employee?.phone].filter(Boolean).join(" · ")}</p>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">Linked</span>
                </div>
              ) : (
                <div className="border border-border rounded-md p-2 space-y-1.5 bg-muted/30">
                  <Input
                    placeholder="Search employee by name…"
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <div className="max-h-40 overflow-y-auto space-y-0.5">
                    {filteredEmployees.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">
                        {employees.length === 0 ? "No employees found. Add an employee first." : "No matching employees"}
                      </p>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => handleEmployeeSelect(emp.id)}
                          className={cn(
                            "w-full text-left px-2.5 py-1.5 rounded text-sm flex items-center justify-between transition-colors",
                            selectedEmployeeId === emp.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                          )}
                        >
                          <span className="font-medium">{emp.fullName}</span>
                          {emp.email && <span className="text-xs opacity-70 ml-2 truncate">{emp.email}</span>}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={!editTarget && !selectedEmployeeId ? "Select an employee above" : "e.g. Ahmad Raza"}
                readOnly={!editTarget && !!selectedEmployeeId}
                className={!editTarget && !!selectedEmployeeId ? "bg-muted/50 cursor-default" : ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@company.com"
                readOnly={!editTarget && !!selectedEmployeeId}
                className={!editTarget && !!selectedEmployeeId ? "bg-muted/50 cursor-default" : ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{editTarget ? "New Password (leave blank to keep)" : "Password *"}</Label>
              <div className="relative">
                <Input type={showPwd ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editTarget ? "Leave blank to keep current" : "Set a password"} className="pr-10" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as StaffRole, branchId: v === "super_admin" ? "" : form.branchId, branchIds: v === "area_manager" ? (form.branchIds || []) : [] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(isSuperAdmin
                    ? (["branch_manager", "finance_manager", "hr_manager", "area_manager"] as StaffRole[])
                    : (["branch_manager", "finance_manager", "hr_manager"] as StaffRole[])
                  ).map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.role === "area_manager" && (
              <div className="space-y-1.5">
                <Label>Branches * <span className="text-muted-foreground font-normal text-xs">(select all that apply)</span></Label>
                <div className="border border-border rounded-md p-2.5 space-y-1.5 max-h-44 overflow-y-auto bg-muted/30">
                  {offices.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">No branches found</p>
                  ) : (
                    offices.map((o) => {
                      const checked = (form.branchIds || []).includes(o.id);
                      return (
                        <label key={o.id} className="flex items-center gap-2.5 px-1.5 py-1 rounded hover:bg-muted cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const current = form.branchIds || [];
                              setForm({
                                ...form,
                                branchIds: checked
                                  ? current.filter(id => id !== o.id)
                                  : [...current, o.id],
                              });
                            }}
                            className="rounded border-border"
                          />
                          <span className="text-sm text-foreground">{o.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
                {(form.branchIds?.length ?? 0) > 0 && (
                  <p className="text-xs text-muted-foreground">{form.branchIds!.length} branch{form.branchIds!.length !== 1 ? "es" : ""} selected</p>
                )}
              </div>
            )}
            {form.role !== "super_admin" && form.role !== "area_manager" && (
              <div className="space-y-1.5">
                <Label>Branch *</Label>
                <Select value={form.branchId || ""} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {(isAreaManager
                      ? offices.filter(o => (currentUser?.branchIds ?? []).includes(o.id))
                      : offices
                    ).map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createStaff.isPending || updateStaff.isPending}>
              {editTarget ? "Save Changes" : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Staff Account</DialogTitle>
            <DialogDescription>Remove <strong>{deleteTarget?.name}</strong>? They will no longer be able to log in.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteStaff.isPending}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Staff;
