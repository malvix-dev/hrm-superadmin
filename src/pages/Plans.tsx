import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  maxEmployees: number;
  maxBranches: number;
  maxStaff: number;
  features: string[];
  isActive: boolean;
  orgCount: number;
}

const emptyForm = { name: "", priceMonthly: "", priceYearly: "", maxEmployees: "", maxBranches: "", maxStaff: "", features: "", isActive: true };

export default function Plans() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: () => apiGet<Plan[]>("/plans"),
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (p: Plan) => {
    setEditing(p);
    setForm({
      name: p.name,
      priceMonthly: String(p.priceMonthly),
      priceYearly: String(p.priceYearly),
      maxEmployees: String(p.maxEmployees),
      maxBranches: String(p.maxBranches),
      maxStaff: String(p.maxStaff),
      features: p.features.join(", "),
      isActive: p.isActive,
    });
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (body: object) => editing
      ? apiPut(`/plans/${editing.id}`, body)
      : apiPost("/plans", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      setOpen(false);
      toast.success(editing ? "Plan updated" : "Plan created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/plans/${id}/status`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/plans/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plan deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      name: form.name,
      priceMonthly: Number(form.priceMonthly),
      priceYearly: Number(form.priceYearly) || Number(form.priceMonthly) * 10,
      maxEmployees: Number(form.maxEmployees) || 9999,
      maxBranches: Number(form.maxBranches) || 999,
      maxStaff: Number(form.maxStaff) || 999,
      features: form.features.split(",").map(f => f.trim()).filter(Boolean),
      isActive: form.isActive,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plans</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage subscription plans</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" /> New Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map(plan => (
            <Card key={plan.id} className={plan.isActive ? "" : "opacity-60"}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <p className="text-2xl font-bold mt-1">${plan.priceMonthly}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  </div>
                  <Badge variant={plan.isActive ? "default" : "secondary"} className="text-xs">
                    {plan.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>Employees: {plan.maxEmployees >= 9999 ? "Unlimited" : plan.maxEmployees}</span>
                  <span>Branches: {plan.maxBranches >= 999 ? "Unlimited" : plan.maxBranches}</span>
                  <span>Organizations: {plan.orgCount}</span>
                </div>
                {plan.features.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {plan.features.map(f => <Badge key={f} variant="outline" className="text-xs">{f}</Badge>)}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(plan)}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleMutation.mutate(plan.id)}>
                    {plan.isActive ? <ToggleRight className="w-3.5 h-3.5 mr-1" /> : <ToggleLeft className="w-3.5 h-3.5 mr-1" />}
                    {plan.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 ml-auto"
                    disabled={plan.orgCount > 0}
                    onClick={() => { if (confirm("Delete this plan?")) deleteMutation.mutate(plan.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Plan" : "Create Plan"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div>
              <Label className="text-sm mb-1.5 block">Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Starter" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1.5 block">Price/mo ($)</Label>
                <Input type="number" min="0" step="0.01" value={form.priceMonthly} onChange={e => setForm(f => ({ ...f, priceMonthly: e.target.value }))} placeholder="29" required />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Price/yr ($)</Label>
                <Input type="number" min="0" step="0.01" value={form.priceYearly} onChange={e => setForm(f => ({ ...f, priceYearly: e.target.value }))} placeholder="290" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-sm mb-1.5 block">Max Employees</Label>
                <Input type="number" min="1" value={form.maxEmployees} onChange={e => setForm(f => ({ ...f, maxEmployees: e.target.value }))} placeholder="100" />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Max Branches</Label>
                <Input type="number" min="1" value={form.maxBranches} onChange={e => setForm(f => ({ ...f, maxBranches: e.target.value }))} placeholder="5" />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Max Staff</Label>
                <Input type="number" min="1" value={form.maxStaff} onChange={e => setForm(f => ({ ...f, maxStaff: e.target.value }))} placeholder="20" />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Features (comma-separated)</Label>
              <Textarea value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} placeholder="Attendance tracking, Leave management, Reports" rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
