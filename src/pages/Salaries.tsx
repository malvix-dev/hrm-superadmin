import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useOffice } from "@/contexts/OfficeContext";
import { useEmployees } from "@/hooks/useEmployees";
import { useSalaries, useCreateSalary, useDeleteSalary, SalaryPayment } from "@/hooks/useSalaries";
import { useOffices } from "@/hooks/useOffices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Banknote, Search, CheckCircle2, Clock, Eye,
  TrendingUp, TrendingDown, ArrowUpCircle, Users, Trash2, Printer,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, fromSnakeCase } from "@/lib/utils";

const Salaries = () => {
  const { selectedOfficeId } = useOffice();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all");
  const todayMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(todayMonth);

  // Pay dialog
  const [payOpen, setPayOpen] = useState(false);
  const [targetEmp, setTargetEmp] = useState<any | null>(null);
  const [payType, setPayType] = useState<"salary" | "advance" | "commission" | "deduction">("salary");
  const [payAmount, setPayAmount] = useState("");
  const [payDeduction, setPayDeduction] = useState("0");
  const [payCommission, setPayCommission] = useState("0");
  const [payAdvance, setPayAdvance] = useState("0");
  const [payNote, setPayNote] = useState("");
  const [payLots, setPayLots] = useState("");

  // Bulk pay
  const [bulkPayOpen, setBulkPayOpen] = useState(false);

  // History dialog
  const [historyEmp, setHistoryEmp] = useState<any | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Invoice dialog
  const [invoicePayment, setInvoicePayment] = useState<SalaryPayment | null>(null);

  // Delete payment
  const [deleteTarget, setDeleteTarget] = useState<SalaryPayment | null>(null);

  const { data: employees = [], isLoading: empLoading } = useEmployees({ officeId: selectedOfficeId });
  const { data: monthSalaries = [], isLoading: salLoading } = useSalaries({ officeId: selectedOfficeId, month: selectedMonth });
  const { data: historyData = [] } = useSalaries({ employeeId: historyEmp?.id });
  const { data: offices = [] } = useOffices();
  const createSalary = useCreateSalary();
  const deleteSalary = useDeleteSalary();

  // Look up commission rates from the selected employee's branch office
  const getOfficeRates = (officeId?: string) => {
    const o = offices.find(x => x.id === officeId);
    return { usdPerLot: o?.usdPerLot ?? 0, pkrPerUsd: o?.pkrPerUsd ?? 0 };
  };
  const { usdPerLot, pkrPerUsd } = getOfficeRates(targetEmp?.officeId);

  const isPaidForMonth = (empId: string) =>
    monthSalaries.some(p => p.employeeId === empId && p.type === "salary");

  const paidCount = employees.filter(e => isPaidForMonth(e.id)).length;
  const pendingCount = employees.length - paidCount;
  const pendingEmployees = employees.filter(e => !isPaidForMonth(e.id));
  const totalMonthly = employees.reduce((s, e) => s + e.salary, 0);
  const paidAmount = monthSalaries.filter(p => p.type === "salary").reduce((s, p) => s + p.netPaid, 0);
  const totalCommission = monthSalaries.reduce((s, p) => s + (p.commission || 0), 0);
  const totalDeduction = monthSalaries.reduce((s, p) => s + (p.deduction || 0), 0);
  const totalAdvanceRecovered = monthSalaries.reduce((s, p) => s + (p.advance || 0), 0);

  const getEmpMonthStats = (empId: string) => {
    const payments = monthSalaries.filter(p => p.employeeId === empId);
    return {
      commission: payments.reduce((s, p) => s + (p.commission || 0), 0),
      deduction: payments.reduce((s, p) => s + (p.deduction || 0), 0),
      advance: payments.reduce((s, p) => s + (p.advance || 0), 0),
    };
  };

  const filtered = employees.filter(e => {
    const matchesSearch =
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (e.cnic || "").includes(search) ||
      (e.department?.name || "").toLowerCase().includes(search.toLowerCase());
    const paid = isPaidForMonth(e.id);
    if (statusFilter === "paid" && !paid) return false;
    if (statusFilter === "pending" && paid) return false;
    return matchesSearch;
  });

  const openPayDialog = (emp: any) => {
    setTargetEmp(emp);
    setPayType("salary");
    setPayAmount(String(emp.salary));
    setPayDeduction("0");
    setPayCommission("0");
    setPayAdvance("0");
    setPayNote("");
    setPayLots("");
    setPayOpen(true);
  };

  const handlePaySalary = async () => {
    if (!targetEmp) return;
    const amount = Number(payAmount) || 0;
    const deduction = Number(payDeduction) || 0;
    const commission = Number(payCommission) || 0;
    const advance = Number(payAdvance) || 0;
    const netPaid = payType === "salary" ? amount - deduction - advance + commission : amount;
    try {
      await createSalary.mutateAsync({
        employeeId: targetEmp.id,
        officeId: targetEmp.officeId,
        month: selectedMonth,
        type: payType,
        baseSalary: targetEmp.salary,
        commission,
        deduction,
        advance,
        netPaid: netPaid > 0 ? netPaid : amount,
        lots: Number(payLots) || undefined,
        note: payNote || undefined,
        paidAt: new Date().toISOString().split("T")[0],
      });
      toast.success(
        payType === "salary"
          ? `Salary paid — ₨ ${netPaid.toLocaleString()}`
          : `${payType.charAt(0).toUpperCase() + payType.slice(1)} of ₨ ${amount.toLocaleString()} recorded`
      );
      setPayOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to record payment");
    }
  };

  const handleBulkPay = async () => {
    let count = 0;
    for (const emp of pendingEmployees) {
      try {
        await createSalary.mutateAsync({
          employeeId: emp.id,
          officeId: emp.officeId,
          month: selectedMonth,
          type: "salary",
          baseSalary: emp.salary,
          commission: 0,
          deduction: 0,
          advance: 0,
          netPaid: emp.salary,
          note: "Bulk payment",
          paidAt: new Date().toISOString().split("T")[0],
        });
        count++;
      } catch {}
    }
    toast.success(`${count} salaries paid successfully`);
    setBulkPayOpen(false);
  };

  const handleDeletePayment = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSalary.mutateAsync(deleteTarget.id);
      toast.success("Payment deleted");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete payment");
    }
  };

  const netPayable = Math.max(0,
    (Number(payAmount) || 0) - (Number(payDeduction) || 0) - (Number(payAdvance) || 0) + (Number(payCommission) || 0)
  );

  const isLoading = empLoading || salLoading;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Salaries</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Manage and track monthly salary payments</p>
        </div>
        <div className="flex gap-1.5 md:gap-2">
          {pendingCount > 0 && (
            <Button onClick={() => setBulkPayOpen(true)} className="h-8 md:h-10 text-xs md:text-sm px-2 md:px-4 gap-1">
              <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Pay All Pending</span>
              <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Summary cards Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-3 md:mb-4">
        {[
          { label: "Total Monthly", value: `₨ ${totalMonthly.toLocaleString()}`, icon: Banknote, bg: "bg-primary", iconCls: "text-primary-foreground" },
          { label: "Paid This Month", value: `${paidCount} / ${employees.length}`, icon: CheckCircle2, bg: "bg-stat-free", iconCls: "text-primary-foreground" },
          { label: "Pending", value: String(pendingCount), icon: Clock, bg: "bg-stat-pending", iconCls: "text-primary-foreground" },
          { label: "Disbursed", value: `₨ ${paidAmount.toLocaleString()}`, icon: Banknote, bg: "bg-stat-revenue", iconCls: "text-primary-foreground" },
        ].map(c => (
          <div key={c.label} className="bg-card rounded-xl border border-border p-3 md:p-4 flex items-center gap-2 md:gap-3 shadow-sm">
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
              <c.icon className={`w-4 h-4 md:w-5 md:h-5 ${c.iconCls}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">{c.label}</p>
              <p className="text-sm md:text-lg font-bold text-card-foreground">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary cards Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-6">
        {[
          { label: "Total Commission", value: `₨ ${totalCommission.toLocaleString()}`, icon: TrendingUp, bg: "bg-stat-free/20", iconCls: "text-stat-free", valCls: "text-stat-free" },
          { label: "Total Deductions", value: `₨ ${totalDeduction.toLocaleString()}`, icon: TrendingDown, bg: "bg-destructive/15", iconCls: "text-destructive", valCls: "text-destructive" },
          { label: "Advance Recovered", value: `₨ ${totalAdvanceRecovered.toLocaleString()}`, icon: ArrowUpCircle, bg: "bg-stat-pending/20", iconCls: "text-stat-pending", valCls: "text-stat-pending" },
        ].map(c => (
          <div key={c.label} className="bg-card rounded-xl border border-border p-3 md:p-4 flex items-center gap-2 md:gap-3 shadow-sm">
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
              <c.icon className={`w-4 h-4 md:w-5 md:h-5 ${c.iconCls}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">{c.label}</p>
              <p className={`text-sm md:text-lg font-bold ${c.valCls}`}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-3 md:mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-7 md:pl-9 h-8 md:h-10 text-xs md:text-sm"
          />
        </div>
        <Input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="w-full sm:w-40 h-8 md:h-10 text-xs md:text-sm"
        />
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-36 h-8 md:h-10 text-xs md:text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="h-40 animate-pulse" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-muted-foreground font-medium">Employee</th>
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-muted-foreground font-medium hidden sm:table-cell">Department</th>
                  <th className="text-right px-3 md:px-4 py-2 md:py-3 text-muted-foreground font-medium">Salary</th>
                  <th className="text-right px-3 md:px-4 py-2 md:py-3 text-stat-free font-medium hidden lg:table-cell">Commission</th>
                  <th className="text-right px-3 md:px-4 py-2 md:py-3 text-destructive font-medium hidden lg:table-cell">Deduction</th>
                  <th className="text-right px-3 md:px-4 py-2 md:py-3 text-stat-pending font-medium hidden lg:table-cell">Advance</th>
                  <th className="text-center px-3 md:px-4 py-2 md:py-3 text-muted-foreground font-medium">This Month</th>
                  <th className="text-center px-3 md:px-4 py-2 md:py-3 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-muted-foreground">No employees found</td>
                  </tr>
                ) : filtered.map(emp => {
                  const paid = isPaidForMonth(emp.id);
                  const stats = getEmpMonthStats(emp.id);
                  return (
                    <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] md:text-xs font-bold text-primary shrink-0">
                            {emp.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">{emp.fullName}</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground">{emp.designation?.label || emp.designation?.title || emp.dutyType || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-muted-foreground hidden sm:table-cell">{emp.department?.label || emp.department?.name || "—"}</td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-right font-medium text-card-foreground text-nowrap">₨ {emp.salary.toLocaleString()}</td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-right text-nowrap hidden lg:table-cell">
                        {stats.commission > 0 ? <span className="text-stat-free font-medium">₨ {stats.commission.toLocaleString()}</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-right text-nowrap hidden lg:table-cell">
                        {stats.deduction > 0 ? <span className="text-destructive font-medium">₨ {stats.deduction.toLocaleString()}</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-right text-nowrap hidden lg:table-cell">
                        {stats.advance > 0 ? <span className="text-stat-pending font-medium">₨ {stats.advance.toLocaleString()}</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-center">
                        {paid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full bg-stat-free/15 text-stat-free">
                            <CheckCircle2 className="w-3 h-3" /> Paid
                          </span>
                        ) : (
                          <span className="text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full bg-stat-pending/15 text-stat-pending">Pending</span>
                        )}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <div className="flex items-center justify-center gap-0.5 md:gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-stat-free hover:text-primary-foreground" title="Pay Salary" onClick={() => openPayDialog(emp)}>
                            <Banknote className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-primary hover:text-primary-foreground" title="Payment History" onClick={() => { setHistoryEmp(emp); setHistoryOpen(true); }}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-primary/10" asChild>
                            <Link to={`/employees/${emp.id}`} title="Employee Profile">
                              <Search className="w-3.5 h-3.5" />
                            </Link>
                          </Button>
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

      {/* Pay Salary Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
              <Banknote className="w-4 h-4 md:w-5 md:h-5 text-stat-free" />
              Pay Salary — {targetEmp?.fullName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 md:space-y-4 py-2">
            <div>
              <Label className="text-xs md:text-sm font-medium mb-1.5 block">Payment Type</Label>
              <Select value={payType} onValueChange={v => {
                setPayType(v as any);
                if (v === "salary") setPayAmount(String(targetEmp?.salary || ""));
                else setPayAmount("");
              }}>
                <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">Monthly Salary</SelectItem>
                  <SelectItem value="advance">Advance Payment</SelectItem>
                  <SelectItem value="commission">Commission</SelectItem>
                  <SelectItem value="deduction">Deduction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs md:text-sm font-medium mb-1.5 block">
                {payType === "salary" ? "Base Salary (₨)" : "Amount (₨)"}
              </Label>
              <Input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="h-8 md:h-10 text-xs md:text-sm" />
            </div>
            {payType === "salary" && (
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <div>
                  <Label className="text-[10px] md:text-xs text-stat-pending mb-1 block font-medium">Advance (₨)</Label>
                  <Input type="number" value={payAdvance} onChange={e => setPayAdvance(e.target.value)} placeholder="0" className="h-8 md:h-9 text-xs md:text-sm" />
                </div>
                <div>
                  <Label className="text-[10px] md:text-xs text-destructive mb-1 block font-medium">Deduction (₨)</Label>
                  <Input type="number" value={payDeduction} onChange={e => setPayDeduction(e.target.value)} placeholder="0" className="h-8 md:h-9 text-xs md:text-sm" />
                </div>
              </div>
            )}
            {/* Commission from Lots calculator */}
            {usdPerLot > 0 && pkrPerUsd > 0 && (
              <div className="bg-muted/40 border border-border rounded-lg p-2.5 md:p-3 space-y-2">
                <p className="text-[10px] md:text-xs font-medium text-muted-foreground">Commission from Lots (auto-fill)</p>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="text-[10px] text-muted-foreground mb-1 block">Number of Lots</Label>
                    <Input
                      type="number"
                      min="0"
                      value={payLots}
                      onChange={e => {
                        setPayLots(e.target.value);
                        const calc = (Number(e.target.value) || 0) * usdPerLot * pkrPerUsd;
                        setPayCommission(calc > 0 ? String(calc) : "0");
                      }}
                      placeholder="e.g. 5"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="text-center pb-1">
                    <p className="text-[10px] text-muted-foreground">{payLots||0} × ${usdPerLot} × ₨{pkrPerUsd}</p>
                    <p className="text-xs font-bold text-stat-free">= ₨ {(Number(payCommission)||0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-muted/50 rounded-lg p-2.5 md:p-3 text-center">
              <p className="text-[10px] md:text-xs text-muted-foreground">Net Payable</p>
              <p className="text-base md:text-lg font-bold text-card-foreground">₨ {netPayable.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-xs md:text-sm font-medium mb-1.5 block">Note (optional)</Label>
              <Textarea value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="Any remarks..." rows={2} className="text-xs md:text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)} className="h-9 md:h-10 text-xs md:text-sm">Cancel</Button>
            <Button onClick={handlePaySalary} disabled={!payAmount || Number(payAmount) <= 0 || createSalary.isPending} className="h-9 md:h-10 text-xs md:text-sm">
              <Banknote className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" /> Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Pay Dialog */}
      <Dialog open={bulkPayOpen} onOpenChange={setBulkPayOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-4 h-4 text-stat-free" />
              Pay All Pending — {pendingEmployees.length} employees
            </DialogTitle>
            <DialogDescription>
              Each employee will receive their base salary with no adjustments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 max-h-64 overflow-y-auto border border-border rounded-lg divide-y divide-border">
            {pendingEmployees.map(emp => (
              <div key={emp.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-card-foreground">{emp.fullName}</p>
                  <p className="text-xs text-muted-foreground">{emp.designation?.label || emp.designation?.title || emp.dutyType}</p>
                </div>
                <span className="font-medium text-card-foreground text-nowrap">₨ {emp.salary.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center px-1 text-sm font-semibold text-card-foreground border-t border-border pt-2">
            <span>Total</span>
            <span>₨ {pendingEmployees.reduce((s, e) => s + e.salary, 0).toLocaleString()}</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkPayOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkPay} disabled={createSalary.isPending} className="gap-1">
              <Banknote className="w-4 h-4" /> Pay {pendingEmployees.length} Salaries
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              Payment History — {historyEmp?.fullName}
            </DialogTitle>
          </DialogHeader>
          {historyData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No payment history yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">Month</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Type</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Base</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Net Paid</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Date</th>
                    <th className="text-center py-2 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[...historyData].sort((a, b) => b.paidAt.localeCompare(a.paidAt)).map(p => (
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="py-2 text-card-foreground font-medium">{p.month}</td>
                      <td className="py-2">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          p.type === "salary" ? "bg-primary/10 text-primary" :
                          p.type === "advance" ? "bg-stat-pending/15 text-stat-pending" :
                          p.type === "commission" ? "bg-stat-free/15 text-stat-free" :
                          "bg-destructive/15 text-destructive"
                        }`}>
                          {p.type.charAt(0).toUpperCase() + p.type.slice(1)}
                        </span>
                      </td>
                      <td className="py-2 text-right text-muted-foreground">₨ {p.baseSalary.toLocaleString()}</td>
                      <td className="py-2 text-right font-medium text-card-foreground">₨ {p.netPaid.toLocaleString()}</td>
                      <td className="py-2 text-muted-foreground">{formatDate(p.paidAt)}</td>
                      <td className="py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setInvoicePayment(p); }}>
                            <Printer className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground" onClick={() => setDeleteTarget(p)}>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={!!invoicePayment} onOpenChange={open => !open && setInvoicePayment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Printer className="w-4 h-4" /> Salary Invoice</DialogTitle>
          </DialogHeader>
          {invoicePayment && (
            <div className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                <p className="font-bold text-primary text-base">Salary Slip</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Employee</span><span className="font-medium">{invoicePayment.employee?.fullName || historyEmp?.fullName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Month</span><span className="font-medium">{invoicePayment.month}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment Date</span><span className="font-medium">{formatDate(invoicePayment.paidAt)}</span></div>
              </div>
              <div className="border border-border rounded-lg overflow-hidden text-xs">
                <div className="bg-muted/50 px-3 py-2 font-semibold">Salary Breakdown</div>
                <div className="divide-y divide-border/50">
                  <div className="flex justify-between px-3 py-2"><span className="text-muted-foreground">Base Salary</span><span className="font-medium">₨ {invoicePayment.baseSalary.toLocaleString()}</span></div>
                  {invoicePayment.commission > 0 && <div className="flex justify-between px-3 py-2"><span className="text-stat-free">+ Commission</span><span className="font-medium text-stat-free">₨ {invoicePayment.commission.toLocaleString()}</span></div>}
                  {invoicePayment.advance > 0 && <div className="flex justify-between px-3 py-2"><span className="text-destructive">− Advance</span><span className="font-medium text-destructive">₨ {invoicePayment.advance.toLocaleString()}</span></div>}
                  {invoicePayment.deduction > 0 && <div className="flex justify-between px-3 py-2"><span className="text-destructive">− Deduction</span><span className="font-medium text-destructive">₨ {invoicePayment.deduction.toLocaleString()}</span></div>}
                  <div className="flex justify-between px-3 py-2.5 bg-primary/5 font-bold text-sm"><span className="text-primary">Net Paid</span><span className="text-primary">₨ {invoicePayment.netPaid.toLocaleString()}</span></div>
                </div>
              </div>
              {invoicePayment.note && <p className="text-xs text-muted-foreground italic border-t border-border pt-2">Note: {invoicePayment.note}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoicePayment(null)}>Close</Button>
            <Button onClick={() => window.print()} className="gap-2"><Printer className="w-4 h-4" /> Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Trash2 className="w-4 h-4 text-destructive" /> Delete Payment
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete this <strong>{deleteTarget?.type}</strong> payment of <strong>₨ {deleteTarget?.netPaid.toLocaleString()}</strong>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePayment} disabled={deleteSalary.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Salaries;
