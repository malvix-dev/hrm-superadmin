import { useState } from "react";
import { useOffice } from "@/contexts/OfficeContext";
import { useExpenses, useExpenseTypes, useCreateExpense, useUpdateExpense, useDeleteExpense, useCreateExpenseType, useDeleteExpenseType, Expense, ExpenseInput } from "@/hooks/useExpenses";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormSelect } from "@/components/form/FormSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Settings, Receipt, Tag, DollarSign, Globe, Building2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useOffices } from "@/hooks/useOffices";

const Expenses = () => {
  const { isSuperAdmin, isAreaManager, isBranchManager, staff } = useAuth();
  const { data: offices = [] } = useOffices();
  const { selectedOfficeId } = useOffice();
  const { data: expenses = [], isLoading } = useExpenses(
    selectedOfficeId && selectedOfficeId !== "all" ? { officeId: selectedOfficeId } : undefined
  );
  const { data: expenseTypes = [] } = useExpenseTypes();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const createExpenseType = useCreateExpenseType();
  const deleteExpenseType = useDeleteExpenseType();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [expenseDialog, setExpenseDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expTypeId, setExpTypeId] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(new Date().toISOString().split("T")[0]);
  const [expPaidTo, setExpPaidTo] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const [typeDialog, setTypeDialog] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeScope, setNewTypeScope] = useState<"global" | "branch">("global");
  const [newTypeOfficeId, setNewTypeOfficeId] = useState("");
  const [deleteTypeTarget, setDeleteTypeTarget] = useState<string | null>(null);

  const availableBranches = isSuperAdmin
    ? offices
    : isAreaManager
    ? offices.filter((o) => (staff?.branchIds ?? []).includes(o.id))
    : offices.filter((o) => o.id === staff?.branchId);

  const filtered = expenses
    .filter((e) => {
      const matchesSearch = (e.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.paidTo || "").toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || e.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const thisMonth = new Date().toISOString().slice(0, 7);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const monthlyExpenses = expenses.filter((e) => e.date.startsWith(thisMonth)).reduce((s, e) => s + e.amount, 0);

  const openAddExpense = () => {
    setEditingExpense(null);
    setExpTypeId(expenseTypes[0]?.id || "");
    setExpDesc("");
    setExpAmount("");
    setExpDate(new Date().toISOString().split("T")[0]);
    setExpPaidTo("");
    setExpenseDialog(true);
  };

  const openEditExpense = (exp: Expense) => {
    setEditingExpense(exp);
    const et = expenseTypes.find((t) => t.name === exp.type);
    setExpTypeId(et?.id || "");
    setExpDesc(exp.description || "");
    setExpAmount(String(exp.amount));
    setExpDate(exp.date);
    setExpPaidTo(exp.paidTo || "");
    setExpenseDialog(true);
  };

  const handleSaveExpense = async () => {
    const amount = Number(expAmount);
    if (!expTypeId || !expAmount || amount <= 0) { toast.error("Please fill in type and amount"); return; }
    const typeName = expenseTypes.find((t) => t.id === expTypeId)?.name || expTypeId;
    const payload: ExpenseInput = {
      type: typeName,
      description: expDesc || undefined,
      amount,
      date: expDate,
      paidTo: expPaidTo || undefined,
      officeId: selectedOfficeId && selectedOfficeId !== "all" ? selectedOfficeId : undefined,
    };
    try {
      if (editingExpense) {
        await updateExpense.mutateAsync({ id: editingExpense.id, ...payload });
        toast.success("Expense updated");
      } else {
        await createExpense.mutateAsync(payload);
        toast.success("Expense added");
      }
      setExpenseDialog(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save expense");
    }
  };

  const handleDeleteExpense = async () => {
    if (!deleteTarget) return;
    try {
      await deleteExpense.mutateAsync(deleteTarget.id);
      toast.success("Expense deleted");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete expense");
    }
  };

  const handleAddType = async () => {
    if (!newTypeName.trim()) return;
    if (newTypeScope === "branch" && !newTypeOfficeId && !isBranchManager) {
      toast.error("Please select a branch");
      return;
    }
    try {
      await createExpenseType.mutateAsync({
        name: newTypeName.trim(),
        scope: isSuperAdmin ? newTypeScope : "branch",
        officeId: (newTypeScope === "branch" && !isBranchManager) ? newTypeOfficeId : undefined,
      });
      setNewTypeName("");
      setNewTypeOfficeId("");
      toast.success("Expense type added");
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.message || "Failed to add type");
    }
  };

  const handleDeleteType = async () => {
    if (!deleteTypeTarget) return;
    try {
      await deleteExpenseType.mutateAsync(deleteTypeTarget);
      setDeleteTypeTarget(null);
      toast.success("Expense type removed");
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.message || "Failed to remove type");
    }
  };

  const typeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      Salary: "bg-stat-revenue/15 text-stat-revenue",
      Utilities: "bg-stat-pending/15 text-stat-pending",
      Maintenance: "bg-destructive/15 text-destructive",
      Groceries: "bg-stat-free/15 text-stat-free",
    };
    return colors[type] || "bg-primary/15 text-primary";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Expenses</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Track and manage office expenses</p>
        </div>
        <div className="flex gap-1.5 md:gap-2">
          <Button variant="outline" onClick={() => setTypeDialog(true)} className="h-8 md:h-10 text-xs md:text-sm px-2 md:px-4">
            <Settings className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-1" /> <span className="hidden sm:inline">Manage Types</span>
          </Button>
          <Button onClick={openAddExpense} className="h-8 md:h-10 text-xs md:text-sm px-2 md:px-4">
            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-1" /> <span className="hidden md:inline">Add Expense</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        {[
          { label: "Total Expenses", value: `₨ ${totalExpenses.toLocaleString()}`, icon: DollarSign, color: "bg-destructive" },
          { label: "This Month", value: `₨ ${monthlyExpenses.toLocaleString()}`, icon: Receipt, color: "bg-stat-pending" },
          { label: "Expense Types", value: expenseTypes.length, icon: Tag, color: "bg-stat-revenue" },
        ].map((c) => (
          <div key={c.label} className="bg-card rounded-xl border border-border p-3 md:p-4 flex items-center gap-2 md:gap-3 shadow-sm">
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${c.color} flex items-center justify-center shrink-0`}>
              <c.icon className="w-4 h-4 md:w-5 md:h-5 text-destructive-foreground" />
            </div>
            <div className="min-w-0"><p className="text-[10px] md:text-xs text-muted-foreground truncate">{c.label}</p><p className="text-sm md:text-lg font-bold text-card-foreground">{c.value}</p></div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-3 md:mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
          <Input placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 md:pl-9 h-8 md:h-10 text-xs md:text-sm" />
        </div>
        <FormSelect
          value={typeFilter}
          onValueChange={setTypeFilter}
          placeholder="All Types"
          searchable
          options={[{ label: "All Types", value: "all" }, ...expenseTypes.map((t) => ({ label: t.name, value: t.name }))]}
          className="w-full sm:w-44 h-8 md:h-10 text-xs md:text-sm"
        />
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs md:text-sm">Date</TableHead>
                <TableHead className="text-xs md:text-sm">Type</TableHead>
                <TableHead className="text-xs md:text-sm">Description</TableHead>
                <TableHead className="text-xs md:text-sm">Paid To</TableHead>
                <TableHead className="text-right text-xs md:text-sm">Amount</TableHead>
                <TableHead className="text-right text-xs md:text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 md:py-12 text-xs md:text-sm text-muted-foreground">No expenses found</TableCell></TableRow>
              ) : (
                filtered.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell className="font-medium text-xs md:text-sm">{formatDate(exp.date)}</TableCell>
                    <TableCell><span className={`text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full ${typeBadgeColor(exp.type)}`}>{exp.type}</span></TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs md:text-sm">{exp.description || "—"}</TableCell>
                    <TableCell className="text-xs md:text-sm">{exp.paidTo || "—"}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive text-xs md:text-sm">₨ {exp.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-0.5 md:gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8" onClick={() => openEditExpense(exp)}><Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(exp)}><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={expenseDialog} onOpenChange={setExpenseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">{editingExpense ? "Edit Expense" : "Add Expense"}</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">Fill in the expense details below</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 md:gap-4 py-2">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div>
                <Label className="text-xs md:text-sm text-muted-foreground mb-1.5 block">Type</Label>
                <Select value={expTypeId} onValueChange={setExpTypeId}>
                  <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {expenseTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs md:text-sm text-muted-foreground mb-1.5 block">Amount (₨)</Label>
                <Input type="number" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="0" className="h-8 md:h-10 text-xs md:text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div>
                <Label className="text-xs md:text-sm text-muted-foreground mb-1.5 block">Date</Label>
                <Input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} className="h-8 md:h-10 text-xs md:text-sm" />
              </div>
              <div>
                <Label className="text-xs md:text-sm text-muted-foreground mb-1.5 block">Paid To</Label>
                <Input value={expPaidTo} onChange={(e) => setExpPaidTo(e.target.value)} placeholder="Recipient name" className="h-8 md:h-10 text-xs md:text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs md:text-sm text-muted-foreground mb-1.5 block">Description</Label>
              <Textarea value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder="Expense details..." rows={2} className="text-xs md:text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialog(false)} className="h-9 md:h-10 text-xs md:text-sm">Cancel</Button>
            <Button onClick={handleSaveExpense} disabled={createExpense.isPending || updateExpense.isPending} className="h-9 md:h-10 text-xs md:text-sm">{editingExpense ? "Update" : "Add"} Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Delete Expense</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">Are you sure you want to delete this expense of ₨ {deleteTarget?.amount.toLocaleString()}?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteExpense} disabled={deleteExpense.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={typeDialog} onOpenChange={setTypeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Manage Expense Types</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">Add or remove expense categories</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 md:space-y-3 py-2">
            {isSuperAdmin && (
              <div className="space-y-1">
                <Label className="text-xs">Scope</Label>
                <RadioGroup value={newTypeScope} onValueChange={(v) => setNewTypeScope(v as "global" | "branch")} className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="global" id="et-scope-global" />
                    <Label htmlFor="et-scope-global" className="cursor-pointer text-xs">Global</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="branch" id="et-scope-branch" />
                    <Label htmlFor="et-scope-branch" className="cursor-pointer text-xs">Branch</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            {newTypeScope === "branch" && !isBranchManager && (
              <Select value={newTypeOfficeId} onValueChange={setNewTypeOfficeId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select branch…" /></SelectTrigger>
                <SelectContent>
                  {availableBranches.map((o) => <SelectItem key={o.id} value={o.id}>{o.name} — {o.city}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <div className="flex gap-1.5 md:gap-2">
              <Input value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} placeholder="New type name..." onKeyDown={(e) => e.key === "Enter" && handleAddType()} className="h-8 md:h-10 text-xs md:text-sm" />
              <Button onClick={handleAddType} size="sm" disabled={createExpenseType.isPending} className="h-8 md:h-10 px-2 md:px-3"><Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /></Button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {expenseTypes.map((type) => {
                const isGlobal = type.scope === "global";
                const canDelete = isSuperAdmin || (
                  type.scope === "branch" && (
                    isAreaManager ? (staff?.branchIds ?? []).includes(type.officeId ?? "") :
                    isBranchManager ? type.officeId === staff?.branchId : false
                  )
                );
                return (
                  <div key={type.id} className="flex items-center justify-between px-2 md:px-3 py-1.5 md:py-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs md:text-sm font-medium text-foreground truncate">{type.name}</span>
                      {isGlobal
                        ? <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0 shrink-0"><Globe className="w-2.5 h-2.5" />Global</Badge>
                        : <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 shrink-0"><Building2 className="w-2.5 h-2.5" />{type.office?.name ?? "Branch"}</Badge>
                      }
                    </div>
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 md:h-7 md:w-7 text-destructive hover:text-destructive shrink-0" onClick={() => setDeleteTypeTarget(type.id)}>
                        <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTypeTarget} onOpenChange={() => setDeleteTypeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Remove Expense Type</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">Are you sure? Existing expenses of this type won't be affected.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTypeTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteType} disabled={deleteExpenseType.isPending}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expenses;
