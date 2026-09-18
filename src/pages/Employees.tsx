import { useState } from "react";
import { fromSnakeCase } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { useOffice } from "@/contexts/OfficeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployees, useDeleteEmployee, Employee } from "@/hooks/useEmployees";
import { useCreateSalary } from "@/hooks/useSalaries";
import { useOffices } from "@/hooks/useOffices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Eye, Users, Briefcase, Pencil, Trash2, Banknote, CheckCircle2, LayoutGrid, List, X, Printer, FileWarning } from "lucide-react";
import { toast } from "sonner";

const missingDocs = (emp: Employee) => !emp.hasPhoto || !emp.hasNic || !emp.hasCv;

const Employees = () => {
  const navigate = useNavigate();
  const { selectedOfficeId } = useOffice();
  const { isFinanceManager } = useAuth();
  const { data: offices = [] } = useOffices();
  const { data: employees = [], isLoading } = useEmployees(
    selectedOfficeId && selectedOfficeId !== "all" ? { officeId: selectedOfficeId } : undefined
  );
  const deleteEmployee = useDeleteEmployee();
  const createSalary = useCreateSalary();

  const [search, setSearch] = useState("");
  const [dutyFilter, setDutyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [payTarget, setPayTarget] = useState<Employee | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [docFilter, setDocFilter] = useState(false);

  const [payType, setPayType] = useState<"salary" | "advance" | "commission" | "deduction">("salary");
  const [payAmount, setPayAmount] = useState("");
  const [payDeduction, setPayDeduction] = useState("0");
  const [payCommission, setPayCommission] = useState("0");
  const [payAdvance, setPayAdvance] = useState("0");
  const [payNote, setPayNote] = useState("");
  const [payLots, setPayLots] = useState("");

  const filtered = employees.filter((e) => {
    const matchesSearch = e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (e.cnic || "").includes(search) || e.phone.includes(search);
    const matchesDuty = dutyFilter === "all" || (e.designation?.title || e.dutyType || "").toLowerCase().includes(dutyFilter.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    if (docFilter && !missingDocs(e)) return false;
    return matchesSearch && matchesDuty && matchesStatus;
  });

  const totalSalary = employees.filter((e) => e.status === "active").reduce((s, e) => s + e.salary, 0);
  const activeCount = employees.filter((e) => e.status === "active").length;
  const onLeaveCount = employees.filter((e) => e.status === "on_leave").length;
  const incompleteDocCount = employees.filter(missingDocs).length;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEmployee.mutateAsync(deleteTarget.id);
      toast.success(`${deleteTarget.fullName} has been removed`);
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete employee");
    }
  };

  const openPayDialog = (emp: Employee) => {
    setPayTarget(emp);
    setPayType("salary");
    setPayAmount(String(emp.salary));
    setPayDeduction("0");
    setPayCommission("0");
    setPayAdvance("0");
    setPayNote("");
    setPayLots("");
  };

  const handlePaySalary = async () => {
    if (!payTarget) return;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const amount = Number(payAmount) || 0;
    const deduction = Number(payDeduction) || 0;
    const commission = Number(payCommission) || 0;
    const advance = Number(payAdvance) || 0;
    const netPaid = payType === "salary" ? amount - deduction - advance + commission : amount;

    try {
      await createSalary.mutateAsync({
        employeeId: payTarget.id,
        officeId: payTarget.officeId,
        month: currentMonth,
        type: payType,
        baseSalary: payTarget.salary,
        advance: payType === "salary" ? advance : payType === "advance" ? amount : 0,
        deduction: payType === "salary" ? deduction : payType === "deduction" ? amount : 0,
        commission: payType === "salary" ? commission : payType === "commission" ? amount : 0,
        netPaid: netPaid > 0 ? netPaid : amount,
        lots: payLots ? Number(payLots) : undefined,
        note: payNote || undefined,
        paidAt: now.toISOString(),
      });
      setPayTarget(null);
      toast.success(payType === "salary"
        ? `Salary paid to ${payTarget.fullName} — ₨ ${netPaid.toLocaleString()}`
        : `${payType.charAt(0).toUpperCase() + payType.slice(1)} of ₨ ${amount.toLocaleString()} recorded for ${payTarget.fullName}`
      );
    } catch (e: any) {
      toast.error(e.message || "Failed to record payment");
    }
  };

  const handlePrint = () => {
    const rows = filtered.map((e) => `<tr><td>${e.fullName}</td><td>${e.designation?.label || e.designation?.title || e.dutyType || "—"}</td><td>${e.department?.label || e.department?.name || "—"}</td><td>${e.phone}</td><td>₨ ${e.salary.toLocaleString()}</td><td>${e.status}</td><td style="color:${missingDocs(e) ? "#d97706" : "#16a34a"}">${missingDocs(e) ? "Incomplete" : "Complete"}</td></tr>`).join("");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Employee List</title><style>body{font-family:sans-serif;font-size:12px;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px 10px;text-align:left}th{background:#f3f4f6;font-weight:600}</style></head><body><h2>Employee List</h2><p>${filtered.length} employees · Printed ${new Date().toLocaleDateString()}</p><table><thead><tr><th>Name</th><th>Designation</th><th>Department</th><th>Phone</th><th>Salary</th><th>Status</th><th>Documents</th></tr></thead><tbody>${rows}</tbody></table><script>window.print();window.onafterprint=()=>window.close();</script></body></html>`);
    win.document.close();
  };

  const getOfficeRates = (officeId?: string) => {
    const o = offices.find(x => x.id === officeId);
    return { usdPerLot: o?.usdPerLot ?? 0, pkrPerUsd: o?.pkrPerUsd ?? 0 };
  };
  const { usdPerLot, pkrPerUsd } = getOfficeRates(payTarget?.officeId);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Manage employees across all office branches</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 md:h-10 text-xs md:text-sm gap-1.5" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Print List</span>
          </Button>
          {!isFinanceManager && (
            <Button asChild className="h-8 md:h-10 text-xs md:text-sm px-2 md:px-4">
              <Link to="/employees/add"><Plus className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-1" /> <span className="hidden sm:inline">Add Employee</span></Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
        {[
          { label: "Total Staff", value: employees.length, icon: Users, color: "bg-primary" },
          { label: "Active", value: activeCount, icon: Briefcase, color: "bg-stat-free" },
          { label: "On Leave", value: onLeaveCount, icon: Users, color: "bg-stat-pending" },
          { label: "Monthly Salary", value: `₨ ${totalSalary.toLocaleString()}`, icon: Banknote, color: "bg-stat-revenue" },
        ].map((c) => (
          <div key={c.label} className="bg-card rounded-xl border border-border p-3 md:p-4 flex items-center gap-2 md:gap-3 shadow-sm">
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${c.color} flex items-center justify-center shrink-0`}>
              <c.icon className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">{c.label}</p>
              <p className="text-sm md:text-lg font-bold text-card-foreground">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border p-3 md:p-4 shadow-sm mb-3 md:mb-4">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="relative flex-1 min-w-[150px] md:min-w-[200px]">
            <Search className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
            <Input placeholder="Search by name, CNIC, phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 md:pl-9 h-8 md:h-10 text-xs md:text-sm" />
          </div>
          <Input placeholder="Designation..." value={dutyFilter === "all" ? "" : dutyFilter} onChange={(e) => setDutyFilter(e.target.value || "all")} className="w-[130px] md:w-[160px] h-8 md:h-10 text-xs md:text-sm" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[100px] md:w-[130px] h-8 md:h-10 text-xs md:text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center border border-border rounded-lg overflow-hidden ml-auto">
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" className="rounded-none h-7 md:h-8 px-1.5 md:px-2" onClick={() => setViewMode("list")}><List className="w-3.5 h-3.5 md:w-4 md:h-4" /></Button>
            <Button variant={viewMode === "card" ? "default" : "ghost"} size="sm" className="rounded-none h-7 md:h-8 px-1.5 md:px-2" onClick={() => setViewMode("card")}><LayoutGrid className="w-3.5 h-3.5 md:w-4 md:h-4" /></Button>
          </div>
          <button
            onClick={() => setDocFilter(!docFilter)}
            className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium border transition-colors ${docFilter ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700" : "border-border text-muted-foreground hover:bg-muted"}`}
          >
            <FileWarning className="w-3.5 h-3.5" />
            Docs Incomplete {incompleteDocCount > 0 && <span className={`px-1 rounded-full text-[10px] font-bold ${docFilter ? "bg-amber-600 text-white" : "bg-muted-foreground/20"}`}>{incompleteDocCount}</span>}
          </button>
          {(search || dutyFilter !== "all" || statusFilter !== "all" || docFilter) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setDutyFilter("all"); setStatusFilter("all"); setDocFilter(false); }} className="h-8 text-xs md:text-sm px-2">
              <X className="w-3 h-3 md:w-4 md:h-4 mr-1" /> <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card rounded-xl border border-border h-40 animate-pulse" />
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 md:p-12 text-center shadow-sm">
          <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4">{employees.length === 0 ? "No employees registered yet" : "No employees match your filters"}</p>
          {employees.length === 0 && <Link to="/employees/add"><Button className="h-8 md:h-10 text-xs md:text-sm">Add First Employee</Button></Link>}
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filtered.map((emp) => (
            <div key={emp.id} className="bg-card rounded-xl border border-border shadow-sm p-3 md:p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2 md:mb-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center text-xs md:text-sm font-bold text-primary shrink-0">{emp.fullName.charAt(0)}</div>
                  <div><p className="text-sm md:text-base font-semibold text-card-foreground">{emp.fullName}</p><p className="text-[10px] md:text-xs text-muted-foreground">{emp.cnic}</p></div>
                </div>
              </div>
              <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm mb-3 md:mb-4">
                <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-[10px] font-medium text-primary">{emp.designation?.label || emp.designation?.title || emp.dutyType || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="text-card-foreground">{emp.phone}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span className="text-card-foreground font-medium">{emp.department?.label || emp.department?.name || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Salary</span><span className="text-card-foreground font-medium">₨ {emp.salary.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${emp.status === "active" ? "bg-stat-free/15 text-stat-free" : emp.status === "on_leave" ? "bg-stat-pending/15 text-stat-pending" : "bg-destructive/15 text-destructive"}`}>{emp.status}</span></div>
              </div>
              <div className="flex items-center gap-0.5 md:gap-1 border-t border-border pt-2 md:pt-3">
                <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8" asChild><Link to={`/employees/${emp.id}`}><Eye className="w-3.5 h-3.5 md:w-4 md:h-4" /></Link></Button>
                {!isFinanceManager && (
                  <>
                    <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8" onClick={() => navigate(`/employees/${emp.id}`)}><Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground" onClick={() => setDeleteTarget(emp)}><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:bg-stat-free hover:text-primary-foreground ml-auto" onClick={() => openPayDialog(emp)}><Banknote className="w-3.5 h-3.5 md:w-4 md:h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-muted-foreground font-medium">Employee</th>
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-muted-foreground font-medium hidden sm:table-cell">Role</th>
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-muted-foreground font-medium hidden md:table-cell">Phone</th>
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-muted-foreground font-medium hidden lg:table-cell">Department</th>
                  <th className="text-right px-3 md:px-4 py-2 md:py-3 text-muted-foreground font-medium">Salary</th>
                  <th className="text-center px-3 md:px-4 py-2 md:py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-muted-foreground font-medium hidden lg:table-cell">Branch</th>
                  <th className="text-center px-3 md:px-4 py-2 md:py-3 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 md:px-4 py-2 md:py-3">
                      <div className="flex items-center gap-2 md:gap-2.5">
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] md:text-xs font-bold text-primary shrink-0">{emp.fullName.charAt(0)}</div>
                        <div className="min-w-0">
                          <p className="font-medium text-card-foreground truncate">{emp.fullName}</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground sm:hidden">{emp.designation?.label || emp.designation?.title || emp.dutyType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3 hidden sm:table-cell">
                      <span className="px-1.5 md:px-2 py-0.5 rounded-md bg-primary/10 text-[10px] md:text-xs font-medium text-primary">{emp.designation?.label || emp.designation?.title || emp.dutyType || "—"}</span>
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-muted-foreground hidden md:table-cell text-nowrap">{emp.phone}</td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-card-foreground hidden lg:table-cell text-nowrap">{emp.department?.label || emp.department?.name || <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-right text-card-foreground font-medium text-nowrap">₨ {emp.salary.toLocaleString()}</td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-center">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${emp.status === "active" ? "bg-stat-free/15 text-stat-free" : emp.status === "on_leave" ? "bg-stat-pending/15 text-stat-pending" : "bg-destructive/15 text-destructive"}`}>
                        {emp.status === "on_leave" ? "On Leave" : emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3 hidden lg:table-cell text-xs text-muted-foreground">
                      {emp.office?.name ?? <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3">
                      <div className="flex items-center justify-center gap-0.5 md:gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-primary hover:text-primary-foreground" asChild>
                          <Link to={`/employees/${emp.id}`}><Eye className="w-3.5 h-3.5" /></Link>
                        </Button>
                        {!isFinanceManager && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-primary hover:text-primary-foreground" onClick={() => navigate(`/employees/${emp.id}`)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-stat-free hover:text-primary-foreground" onClick={() => openPayDialog(emp)} title="Pay Salary">
                          <Banknote className="w-3.5 h-3.5" />
                        </Button>
                        {!isFinanceManager && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground" onClick={() => setDeleteTarget(emp)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trash2 className="w-4 h-4 md:w-5 md:h-5 text-destructive" /> Delete Employee</DialogTitle>
            <DialogDescription>Are you sure you want to delete <span className="font-semibold">{deleteTarget?.fullName}</span>? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteEmployee.isPending}><Trash2 className="w-3.5 h-3.5 mr-1" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!payTarget} onOpenChange={(open) => !open && setPayTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Banknote className="w-4 h-4 md:w-5 md:h-5 text-stat-free" /> Pay Salary — {payTarget?.fullName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 md:space-y-4 py-2">
            <div>
              <Label className="text-xs md:text-sm font-medium mb-1.5 block">Payment Type</Label>
              <Select value={payType} onValueChange={(v) => { setPayType(v as any); if (v === "salary") setPayAmount(String(payTarget?.salary || 0)); else setPayAmount(""); }}>
                <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">Monthly Salary</SelectItem>
                  <SelectItem value="advance">Advance Payment</SelectItem>
                  <SelectItem value="commission">Commission</SelectItem>
                  <SelectItem value="deduction">Deduction</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {payType === "salary" && (
              <>
                <div>
                  <Label className="text-xs md:text-sm font-medium mb-1.5 block">Base Salary (₨)</Label>
                  <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="h-8 md:h-10 text-xs md:text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div>
                    <Label className="text-[10px] md:text-xs text-muted-foreground mb-1 block">Advance (₨)</Label>
                    <Input type="number" value={payAdvance} onChange={(e) => setPayAdvance(e.target.value)} placeholder="0" className="h-8 md:h-9 text-xs md:text-sm" />
                  </div>
                  <div>
                    <Label className="text-[10px] md:text-xs text-muted-foreground mb-1 block">Deduction (₨)</Label>
                    <Input type="number" value={payDeduction} onChange={(e) => setPayDeduction(e.target.value)} placeholder="0" className="h-8 md:h-9 text-xs md:text-sm" />
                  </div>
                </div>
                <div className="bg-muted/40 border border-border rounded-lg p-2.5 space-y-2">
                  <p className="text-[10px] md:text-xs font-medium text-muted-foreground">Commission from Lots (auto-fill)</p>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label className="text-[10px] text-muted-foreground mb-1 block">Number of Lots</Label>
                      <Input type="number" min="0" value={payLots} onChange={(e) => {
                        setPayLots(e.target.value);
                        const calc = (Number(e.target.value) || 0) * usdPerLot * pkrPerUsd;
                        setPayCommission(calc > 0 ? String(calc) : "0");
                      }} placeholder="e.g. 5" className="h-8 text-xs" />
                    </div>
                    <div className="text-center pb-1">
                      <p className="text-[10px] text-muted-foreground">{payLots || 0} × ${usdPerLot} × ₨{pkrPerUsd}</p>
                      <p className="text-xs font-bold text-stat-free">= ₨ {(Number(payCommission) || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2.5 md:p-3 text-center">
                  <p className="text-[10px] md:text-xs text-muted-foreground">Net Payable</p>
                  <p className="text-base md:text-lg font-bold text-card-foreground">₨ {Math.max(0, (Number(payAmount) || 0) - (Number(payDeduction) || 0) - (Number(payAdvance) || 0) + (Number(payCommission) || 0)).toLocaleString()}</p>
                </div>
              </>
            )}

            {payType !== "salary" && (
              <div>
                <Label className="text-xs md:text-sm font-medium mb-1.5 block">Amount (₨)</Label>
                <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Enter amount" className="h-8 md:h-10 text-xs md:text-sm" />
              </div>
            )}

            <div>
              <Label className="text-xs md:text-sm font-medium mb-1.5 block">Note (optional)</Label>
              <Textarea value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="Any remarks..." rows={2} className="text-xs md:text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayTarget(null)}>Cancel</Button>
            <Button onClick={handlePaySalary} disabled={!payAmount || Number(payAmount) <= 0 || createSalary.isPending}>
              <Banknote className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" /> Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
