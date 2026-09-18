import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Users, BadgeCheck, Globe, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useDesignations, useCreateDesignation, useUpdateDesignation, useDeleteDesignation, Designation, DesigInput } from "@/hooks/useDesignations";
import { useDepartments } from "@/hooks/useDepartments";
import { useOffices } from "@/hooks/useOffices";
import { useAuth } from "@/contexts/AuthContext";

const Designations = () => {
  const { isSuperAdmin, isAreaManager, isBranchManager, staff } = useAuth();
  const { data: designations = [], isLoading } = useDesignations();
  const { data: departments = [] } = useDepartments();
  const { data: offices = [] } = useOffices();
  const createDesig = useCreateDesignation();
  const updateDesig = useUpdateDesignation();
  const deleteDesig = useDeleteDesignation();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Designation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Designation | null>(null);
  const [form, setForm] = useState<DesigInput>({ title: "", departmentId: "", description: "", scope: "global" });
  const [search, setSearch] = useState("");

  const availableBranches = isSuperAdmin
    ? offices
    : isAreaManager
    ? offices.filter((o) => (staff?.branchIds ?? []).includes(o.id))
    : offices.filter((o) => o.id === staff?.branchId);

  const canEdit = (d: Designation) => {
    if (isSuperAdmin) return true;
    if (d.scope === "global") return false;
    if (isAreaManager) return (staff?.branchIds ?? []).includes(d.officeId ?? "");
    if (isBranchManager) return d.officeId === staff?.branchId;
    return false;
  };

  const filtered = designations.filter((d) =>
    (d.label || d.title).toLowerCase().includes(search.toLowerCase()) ||
    (d.department?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditTarget(null);
    const defaultScope = isSuperAdmin ? "global" : "branch";
    const defaultOfficeId = isBranchManager ? (staff?.branchId ?? "") : "";
    setForm({ title: "", departmentId: "", description: "", scope: defaultScope, officeId: defaultOfficeId });
    setFormOpen(true);
  };

  const openEdit = (d: Designation) => {
    setEditTarget(d);
    setForm({
      title: d.label || d.title,
      departmentId: d.departmentId || "",
      description: d.description || "",
      scope: d.scope ?? "global",
      officeId: d.officeId ?? "",
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Designation title is required"); return; }
    if (form.scope === "branch" && !form.officeId && !isBranchManager) {
      toast.error("Please select a branch");
      return;
    }
    const payload: DesigInput = {
      ...form,
      departmentId: form.departmentId || undefined,
      officeId: form.scope === "branch"
        ? (isBranchManager ? (staff?.branchId ?? undefined) : form.officeId || undefined)
        : undefined,
    };
    try {
      if (editTarget) {
        await updateDesig.mutateAsync({ id: editTarget.id, ...payload });
        toast.success("Designation updated");
      } else {
        await createDesig.mutateAsync(payload);
        toast.success("Designation added");
      }
      setFormOpen(false);
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.message || "Failed to save designation");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDesig.mutateAsync(deleteTarget.id);
      toast.success("Designation deleted");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.message || "Failed to delete designation");
    }
  };

  return (
    <div>
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Designations</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Manage job titles and roles in your organization</p>
        </div>
        <Button onClick={openAdd} className="gap-2 shrink-0"><Plus className="w-4 h-4" /> Add Designation</Button>
      </div>

      <div className="mb-4">
        <Input placeholder="Search by title or department…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      {isLoading ? (
        <div className="bg-card rounded-xl border border-border h-40 animate-pulse" />
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center shadow-sm">
          <BadgeCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">{search ? "No designations match your search" : "No designations yet"}</p>
          {!search && <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Designation</Button>}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Title</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Department</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Scope</th>
                <th className="text-center px-4 py-3 text-muted-foreground font-medium">Employees</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((d) => {
                const isGlobal = d.scope === "global";
                const editable = canEdit(d);
                return (
                  <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <BadgeCheck className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-card-foreground">{d.label || d.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {d.department ? (d.department.label || d.department.name) : <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {isGlobal
                        ? <Badge variant="secondary" className="gap-1 text-xs"><Globe className="w-3 h-3" />Global</Badge>
                        : <Badge variant="outline" className="gap-1 text-xs"><Building2 className="w-3 h-3" />{d.office?.name ?? "Branch"}</Badge>
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        <Users className="w-3 h-3" /> {d._count?.employees ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {editable && (
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-primary/10" onClick={() => openEdit(d)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground" onClick={() => setDeleteTarget(d)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Designation" : "Add Designation"}</DialogTitle>
            <DialogDescription>{editTarget ? "Update designation details." : "Create a new job title."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Developer" />
            </div>

            {!editTarget && isSuperAdmin && (
              <div className="space-y-1.5">
                <Label>Scope</Label>
                <RadioGroup
                  value={form.scope ?? "global"}
                  onValueChange={(v) => setForm({ ...form, scope: v as "global" | "branch", officeId: v === "global" ? "" : form.officeId })}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="global" id="desig-scope-global" />
                    <Label htmlFor="desig-scope-global" className="cursor-pointer">Global (all branches)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="branch" id="desig-scope-branch" />
                    <Label htmlFor="desig-scope-branch" className="cursor-pointer">Specific branch</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {!editTarget && form.scope === "branch" && !isBranchManager && (
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
              <Label>Department</Label>
              <Select value={form.departmentId || "__none__"} onValueChange={(v) => setForm({ ...form, departmentId: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select department (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {departments.map((dep) => <SelectItem key={dep.id} value={dep.id}>{dep.label || dep.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of this role" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createDesig.isPending || updateDesig.isPending}>{editTarget ? "Save Changes" : "Add Designation"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Designation</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{deleteTarget?.label || deleteTarget?.title}</strong>?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteDesig.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Designations;
