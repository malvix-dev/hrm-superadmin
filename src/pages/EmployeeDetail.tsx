import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEmployee, useUpdateEmployee, useSalaryHistory, useUpdateEmployeeSalary, useAdvances, useCreateAdvance, useDeleteAdvance, useUploadDocument, useEmployeeSessions, useUnlockEmployee, EmployeeSession } from "@/hooks/useEmployees";
import { useSalaries, useCreateSalary, useUpdateSalary, useDeleteSalary, SalaryPayment } from "@/hooks/useSalaries";
import { useLeaves, useLeaveTypes, useCreateLeave, useUpdateLeaveStatus, useDeleteLeave, useLeaveBalance, LeaveRequest } from "@/hooks/useLeaves";
import { useAttendance, AttendanceStatus } from "@/hooks/useAttendance";
import { useOffices } from "@/hooks/useOffices";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, User, FileText, Briefcase, Heart, DollarSign, Pencil, Banknote,
  Trash2, Plus, Calendar, CheckCircle, XCircle, Clock, Printer, CalendarDays,
  UserX, AlarmClock, TrendingUp, Upload, FolderOpen, Smartphone, LogIn, LogOut, LockKeyhole, LockOpen,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, fromSnakeCase } from "@/lib/utils";

const ATT_STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  absent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  half_day: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  late: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  on_leave: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const ATT_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present", absent: "Absent", half_day: "Half Day", late: "Late", on_leave: "On Leave",
};

const InfoRow = ({ label, value }: { label: string; value?: string | number | boolean }) => {
  if (value === undefined || value === null || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  return (
    <div className="flex justify-between py-2 md:py-2.5 border-b border-border/50 last:border-0">
      <span className="text-xs md:text-sm text-muted-foreground">{label}</span>
      <span className="text-xs md:text-sm font-medium text-card-foreground text-right max-w-[60%]">{display}</span>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-card rounded-xl border border-border p-3 md:p-5 shadow-sm">
    <h3 className="text-xs md:text-sm font-semibold text-primary mb-2 md:mb-3 pb-1.5 md:pb-2 border-b border-primary/20">{title}</h3>
    {children}
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    active: "bg-stat-free/15 text-stat-free",
    on_leave: "bg-stat-pending/15 text-stat-pending",
    terminated: "bg-destructive/15 text-destructive",
    inactive: "bg-muted text-muted-foreground",
  };
  const labels: Record<string, string> = {
    active: "Active", on_leave: "On Leave", terminated: "Terminated", inactive: "Inactive",
  };
  return (
    <span className={`text-[10px] md:text-xs font-medium px-2 md:px-3 py-0.5 md:py-1 rounded-full ${styles[status] || styles.active}`}>
      {labels[status] || status}
    </span>
  );
};

const FinanceBox = ({ label, value, variant = "default" }: { label: string; value: string; variant?: "default" | "success" | "danger" }) => {
  const colors = { default: "border-border bg-muted/30", success: "border-stat-free/30 bg-stat-free/10", danger: "border-destructive/30 bg-destructive/10" };
  const textColors = { default: "text-card-foreground", success: "text-stat-free", danger: "text-destructive" };
  return (
    <div className={`rounded-xl border-2 ${colors[variant]} p-3 md:p-4 text-center`}>
      <p className="text-[10px] md:text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-sm md:text-lg font-bold ${textColors[variant]}`}>{value}</p>
    </div>
  );
};

const AttendanceTab = ({ employeeId }: { employeeId: string }) => {
  const currentDate = new Date();
  const defaultMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  const { data: records = [] } = useAttendance({ employeeId, month: selectedMonth });
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));

  const summary = {
    present: sorted.filter(r => r.status === "present").length,
    absent: sorted.filter(r => r.status === "absent").length,
    late: sorted.filter(r => r.status === "late").length,
    halfDay: sorted.filter(r => r.status === "half_day").length,
    onLeave: sorted.filter(r => r.status === "on_leave").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input type="month" className="w-auto h-9" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
        <span className="text-xs text-muted-foreground">{sorted.length} record{sorted.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3">
        {[
          { label: "Present", value: summary.present, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: CheckCircle },
          { label: "Absent", value: summary.absent, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20", icon: XCircle },
          { label: "Late", value: summary.late, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20", icon: AlarmClock },
          { label: "Half Day", value: summary.halfDay, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20", icon: CalendarDays },
          { label: "On Leave", value: summary.onLeave, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", icon: UserX },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-3 md:p-4 flex items-center gap-2 shadow-sm">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-sm md:text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm">
        {sorted.length === 0 ? (
          <div className="py-14 text-center text-muted-foreground text-sm">
            <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
            No attendance records for this month
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">Check In</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">Check Out</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map(r => (
                  <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-card-foreground">{formatDate(r.date)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${ATT_STATUS_COLORS[r.status]}`}>
                        {ATT_STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{r.checkIn || "—"}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{r.checkOut || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate hidden md:table-cell">{r.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const EmployeeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFinanceManager } = useAuth();

  const { data: emp, isLoading } = useEmployee(id!);
  const { data: offices = [] } = useOffices();
  const { data: payments = [] } = useSalaries({ employeeId: id });
  const { data: salaryHistory = [] } = useSalaryHistory(id!);
  const { data: sessions = [] } = useEmployeeSessions(id!);
  const { data: leaveRecords = [] } = useLeaves({ employeeId: id });
  const { data: leaveTypes = [] } = useLeaveTypes();
  const { data: leaveBalance = [] } = useLeaveBalance(id!);
  const { data: advances = [] } = useAdvances(id!);
  const createSalary = useCreateSalary();
  const updateSalary = useUpdateSalary();
  const deleteSalary = useDeleteSalary();
  const createLeave = useCreateLeave();
  const updateLeaveStatus = useUpdateLeaveStatus();
  const deleteLeave = useDeleteLeave();
  const updateEmployee = useUpdateEmployee();
  const updateEmployeeSalary = useUpdateEmployeeSalary();
  const createAdvance = useCreateAdvance();
  const deleteAdvance = useDeleteAdvance();
  const uploadDocument = useUploadDocument();
  const unlockEmployee = useUnlockEmployee();

  const isOnCooldown = !!(emp?.lockedUntil && new Date(emp.lockedUntil) > new Date());
  const handleEndCooldown = async () => {
    if (!emp) return;
    try {
      await unlockEmployee.mutateAsync(emp.id);
      toast.success(`Cooldown ended for ${emp.fullName}`);
    } catch { toast.error("Failed to end cooldown"); }
  };

  const [payOpen, setPayOpen] = useState(false);
  const [invoicePayment, setInvoicePayment] = useState<SalaryPayment | null>(null);
  const [editingPayment, setEditingPayment] = useState<SalaryPayment | null>(null);
  const [deletePayTarget, setDeletePayTarget] = useState<SalaryPayment | null>(null);
  const [payType, setPayType] = useState<"salary" | "advance" | "commission" | "deduction">("salary");
  const [payAmount, setPayAmount] = useState("");
  const [payDeduction, setPayDeduction] = useState("0");
  const [payCommission, setPayCommission] = useState("0");
  const [payAdvance, setPayAdvance] = useState("0");
  const [payNote, setPayNote] = useState("");
  const [payLots, setPayLots] = useState("");

  const [salaryUpdateOpen, setSalaryUpdateOpen] = useState(false);
  const [newSalaryAmount, setNewSalaryAmount] = useState("");
  const [salaryUpdateNote, setSalaryUpdateNote] = useState("");

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);
  const [deleteLeaveTarget, setDeleteLeaveTarget] = useState<LeaveRequest | null>(null);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveStatus, setLeaveStatus] = useState<"pending" | "approved" | "rejected">("approved");

  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceReason, setAdvanceReason] = useState("");
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [deleteAdvanceTarget, setDeleteAdvanceTarget] = useState<string | null>(null);

  if (isLoading) return <div className="h-40 bg-card rounded-xl border animate-pulse" />;
  if (!emp) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Employee not found</p>
        <Button variant="outline" onClick={() => navigate("/employees")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Employees
        </Button>
      </div>
    );
  }

  const totalPaidAll = payments.filter(p => p.type === "salary").reduce((s, p) => s + p.netPaid, 0);
  const totalAdvanceAll = payments.reduce((s, p) => s + (p.advance || 0), 0);
  const totalCommissionAll = payments.reduce((s, p) => s + (p.commission || 0), 0);
  const totalDeductionsAll = payments.reduce((s, p) => s + (p.deduction || 0), 0);

  const openPayDialog = (existing?: SalaryPayment) => {
    if (existing) {
      setEditingPayment(existing);
      setPayType(existing.type);
      setPayAmount(String(existing.type === "salary" ? existing.baseSalary : (existing.advance || existing.deduction || existing.commission || existing.netPaid)));
      setPayDeduction(String(existing.deduction));
      setPayCommission(String(existing.commission));
      setPayAdvance(String(existing.advance));
      setPayNote(existing.note || "");
    } else {
      setEditingPayment(null);
      setPayType("salary");
      setPayAmount(String(emp.salary));
      setPayDeduction("0");
      setPayCommission("0");
      setPayAdvance("0");
      setPayNote("");
      setPayLots("");
    }
    setPayOpen(true);
  };

  const empOffice = offices.find(o => o.id === emp?.officeId);
  const usdPerLot = empOffice?.usdPerLot ?? 0;
  const pkrPerUsd = empOffice?.pkrPerUsd ?? 0;

  const handlePaySalary = async () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const amount = Number(payAmount) || 0;
    const deduction = Number(payDeduction) || 0;
    const commission = Number(payCommission) || 0;
    const advance = Number(payAdvance) || 0;
    const netPaid = payType === "salary" ? amount - deduction - advance + commission : amount;
    try {
      if (editingPayment) {
        await updateSalary.mutateAsync({
          id: editingPayment.id,
          baseSalary: amount,
          advance: payType === "salary" ? advance : 0,
          deduction: payType === "salary" ? deduction : 0,
          commission: payType === "salary" ? commission : 0,
          netPaid: netPaid > 0 ? netPaid : amount,
          note: payNote || undefined,
        });
        toast.success("Payment updated");
      } else {
        await createSalary.mutateAsync({
          employeeId: emp.id,
          officeId: emp.officeId,
          month: currentMonth,
          type: payType,
          baseSalary: emp.salary,
          advance: payType === "salary" ? advance : payType === "advance" ? amount : 0,
          deduction: payType === "salary" ? deduction : payType === "deduction" ? amount : 0,
          commission: payType === "salary" ? commission : payType === "commission" ? amount : 0,
          netPaid: netPaid > 0 ? netPaid : amount,
          note: payNote || undefined,
          paidAt: now.toISOString().split("T")[0],
        });
        toast.success(
          payType === "salary"
            ? `Salary paid — ₨ ${netPaid.toLocaleString()}`
            : `${payType.charAt(0).toUpperCase() + payType.slice(1)} of ₨ ${amount.toLocaleString()} recorded`
        );
      }
      setPayOpen(false);
      setEditingPayment(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to record payment");
    }
  };

  const handleDeletePayment = async () => {
    if (!deletePayTarget) return;
    try {
      await deleteSalary.mutateAsync(deletePayTarget.id);
      setDeletePayTarget(null);
      toast.success("Payment deleted");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete payment");
    }
  };

  const handleSalaryUpdate = async () => {
    const newSalary = Number(newSalaryAmount);
    if (!newSalary || newSalary <= 0) { toast.error("Enter a valid salary amount"); return; }
    if (newSalary === emp.salary) { toast.error("New salary is same as current salary"); return; }
    try {
      await updateEmployeeSalary.mutateAsync({ id: emp.id, newSalary, reason: salaryUpdateNote || undefined });
      toast.success(`Salary updated to ₨ ${newSalary.toLocaleString()}`);
      setSalaryUpdateOpen(false);
      setNewSalaryAmount("");
      setSalaryUpdateNote("");
    } catch (e: any) {
      toast.error(e.message || "Failed to update salary");
    }
  };

  const calculateLeaveDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const openLeaveDialog = (existing?: LeaveRequest) => {
    if (existing) {
      setEditingLeave(existing);
      setLeaveTypeId(existing.leaveTypeId);
      setLeaveStartDate(existing.startDate);
      setLeaveEndDate(existing.endDate);
      setLeaveReason(existing.reason || "");
      setLeaveStatus(existing.status as any);
    } else {
      setEditingLeave(null);
      setLeaveTypeId(leaveTypes[0]?.id || "");
      setLeaveStartDate("");
      setLeaveEndDate("");
      setLeaveReason("");
      setLeaveStatus("approved");
    }
    setLeaveOpen(true);
  };

  const handleSaveLeave = async () => {
    if (!leaveStartDate || !leaveEndDate) { toast.error("Please select start and end dates"); return; }
    if (!leaveTypeId) { toast.error("Please select a leave type"); return; }
    const days = calculateLeaveDays(leaveStartDate, leaveEndDate);
    try {
      if (editingLeave) {
        await updateLeaveStatus.mutateAsync({ id: editingLeave.id, status: leaveStatus === "approved" ? "approved" : "rejected" });
        toast.success("Leave updated");
      } else {
        const created = await createLeave.mutateAsync({
          employeeId: emp.id,
          leaveTypeId,
          startDate: leaveStartDate,
          endDate: leaveEndDate,
          days,
          reason: leaveReason || undefined,
        });
        if (leaveStatus !== "pending") {
          await updateLeaveStatus.mutateAsync({ id: created.id, status: leaveStatus === "approved" ? "approved" : "rejected" });
        }
        toast.success(`Leave ${leaveStatus === "approved" ? "approved" : "recorded"} — ${days} day(s)`);
      }
      setLeaveOpen(false);
      setEditingLeave(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to save leave");
    }
  };

  const handleDeleteLeave = async () => {
    if (!deleteLeaveTarget) return;
    try {
      await deleteLeave.mutateAsync(deleteLeaveTarget.id);
      setDeleteLeaveTarget(null);
      toast.success("Leave record deleted");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete leave");
    }
  };

  const handleSaveAdvance = async () => {
    const amount = Number(advanceAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    try {
      await createAdvance.mutateAsync({ employeeId: emp!.id, amount, reason: advanceReason || undefined, date: advanceDate });
      toast.success("Advance recorded");
      setAdvanceOpen(false);
      setAdvanceAmount(""); setAdvanceReason(""); setAdvanceDate(new Date().toISOString().split("T")[0]);
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const handleDeleteAdvance = async () => {
    if (!deleteAdvanceTarget) return;
    try {
      await deleteAdvance.mutateAsync({ employeeId: emp!.id, advanceId: deleteAdvanceTarget });
      setDeleteAdvanceTarget(null);
      toast.success("Advance deleted");
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const handleUploadDoc = async (docType: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
    input.onchange = async (e: any) => {
      const file: File = e.target.files[0];
      if (!file) return;
      try {
        await uploadDocument.mutateAsync({ employeeId: emp!.id, file, docType });
        toast.success("Document uploaded");
      } catch (err: any) { toast.error(err.message || "Upload failed"); }
    };
    input.click();
  };

  const displayHistory = [...payments].sort((a, b) => b.paidAt.localeCompare(a.paidAt));

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate("/employees")} className="h-8 w-8 md:h-10 md:w-10">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center text-base md:text-xl font-bold text-primary shrink-0">
              {emp.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-bold text-foreground flex items-center gap-1.5 md:gap-2 flex-wrap">
                <span className="truncate">{emp.fullName}</span>
                <StatusBadge status={emp.status} />
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground truncate">
                {emp.designation?.label || emp.designation?.title || emp.dutyType} · ₨ {emp.salary.toLocaleString()}/mo
                {emp.joinDate && <> · <span className="hidden sm:inline">Since {formatDate(emp.joinDate)}</span></>}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 w-full sm:w-auto">
          <Button onClick={() => openPayDialog()} className="gap-1 md:gap-1.5 h-8 md:h-10 text-xs md:text-sm flex-1 sm:flex-none">
            <Banknote className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline">Pay Salary</span><span className="sm:hidden">Pay</span>
          </Button>
          {!isFinanceManager && (
            <Button variant="outline" asChild className="h-8 md:h-10 text-xs md:text-sm px-2 md:px-4">
              <Link to={`/employees/${emp.id}/edit`}>
                <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-1" /> <span className="hidden sm:inline">Edit</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-6">
        <div className="bg-card rounded-xl border border-border p-3 md:p-4 shadow-sm text-center">
          <p className="text-[10px] md:text-xs text-muted-foreground">Monthly Salary</p>
          <p className="text-sm md:text-lg font-bold text-card-foreground">₨ {emp.salary.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 md:p-4 shadow-sm text-center">
          <p className="text-[10px] md:text-xs text-muted-foreground">Designation</p>
          <p className="text-sm md:text-lg font-bold text-primary truncate">{emp.designation?.label || emp.designation?.title || emp.dutyType || "—"}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 md:p-4 shadow-sm text-center">
          <p className="text-[10px] md:text-xs text-muted-foreground">Department</p>
          <p className="text-sm md:text-lg font-bold text-card-foreground truncate">{emp.department?.label || emp.department?.name || "—"}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={isFinanceManager ? "finance" : "personal"} className="w-full">
        <TabsList className="w-full justify-start mb-3 md:mb-4 bg-muted/50 h-auto p-1 flex-wrap">
          {!isFinanceManager && <TabsTrigger value="personal" className="gap-1 md:gap-1.5 text-xs md:text-sm h-8 md:h-9"><User className="w-3 h-3 md:w-3.5 md:h-3.5" /> Personal</TabsTrigger>}
          {!isFinanceManager && <TabsTrigger value="duty" className="gap-1 md:gap-1.5 text-xs md:text-sm h-8 md:h-9"><Briefcase className="w-3 h-3 md:w-3.5 md:h-3.5" /> Duty</TabsTrigger>}
          <TabsTrigger value="finance" className="gap-1 md:gap-1.5 text-xs md:text-sm h-8 md:h-9"><DollarSign className="w-3 h-3 md:w-3.5 md:h-3.5" /> Finance</TabsTrigger>
          {!isFinanceManager && <TabsTrigger value="leaves" className="gap-1 md:gap-1.5 text-xs md:text-sm h-8 md:h-9"><Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" /> Leaves</TabsTrigger>}
          <TabsTrigger value="attendance" className="gap-1 md:gap-1.5 text-xs md:text-sm h-8 md:h-9"><CalendarDays className="w-3 h-3 md:w-3.5 md:h-3.5" /> Attendance</TabsTrigger>
          {!isFinanceManager && <TabsTrigger value="medical" className="gap-1 md:gap-1.5 text-xs md:text-sm h-8 md:h-9"><Heart className="w-3 h-3 md:w-3.5 md:h-3.5" /> Medical</TabsTrigger>}
          {!isFinanceManager && <TabsTrigger value="documents" className="gap-1 md:gap-1.5 text-xs md:text-sm h-8 md:h-9"><FolderOpen className="w-3 h-3 md:w-3.5 md:h-3.5" /> Documents</TabsTrigger>}
          {!isFinanceManager && <TabsTrigger value="sessions" className="gap-1 md:gap-1.5 text-xs md:text-sm h-8 md:h-9"><Smartphone className="w-3 h-3 md:w-3.5 md:h-3.5" /> Sessions</TabsTrigger>}
        </TabsList>

        {/* Personal Tab */}
        <TabsContent value="personal">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section title="Personal Information">
              <InfoRow label="Full Name" value={emp.fullName} />
              <InfoRow label="Father's Name" value={emp.fatherName} />
              <InfoRow label="CNIC" value={emp.cnic} />
              <InfoRow label="Phone" value={emp.phone} />
              <InfoRow label="Email" value={emp.email} />
              <InfoRow label="Date of Birth" value={formatDate(emp.dateOfBirth)} />
              <InfoRow label="Gender" value={emp.gender} />
              <InfoRow label="Marital Status" value={emp.maritalStatus} />
              <InfoRow label="Address" value={emp.address} />
              <InfoRow label="City" value={emp.city} />
              <InfoRow label="State" value={emp.state} />
              <InfoRow label="Country" value={emp.country} />
            </Section>
            <div className="space-y-4">
              <Section title="Emergency Contact">
                <InfoRow label="Name" value={emp.emergencyName} />
                <InfoRow label="Relation" value={emp.emergencyRelation} />
                <InfoRow label="Phone" value={emp.emergencyPhone} />
                <InfoRow label="Alternate Phone" value={emp.emergencyAltPhone} />
              </Section>
              <Section title="Guardian Information">
                <InfoRow label="Name" value={emp.guardianName} />
                <InfoRow label="CNIC" value={emp.guardianCnic} />
                <InfoRow label="Phone" value={emp.guardianPhone} />
                <InfoRow label="Address" value={emp.guardianAddress} />
              </Section>
            </div>
          </div>
          {(emp.lastEducation || emp.educationInstitute || emp.educationYear || emp.totalExperience || emp.previousEmployer || emp.previousDesignation) && (
            <div className="mt-4">
              <Section title="Education & Experience">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
                  <div>
                    <InfoRow label="Last Education" value={emp.lastEducation} />
                    <InfoRow label="Institution" value={emp.educationInstitute} />
                    <InfoRow label="Passing Year" value={emp.educationYear} />
                  </div>
                  <div>
                    <InfoRow label="Total Experience" value={emp.totalExperience} />
                    <InfoRow label="Previous Employer" value={emp.previousEmployer} />
                    <InfoRow label="Previous Designation" value={emp.previousDesignation} />
                  </div>
                </div>
              </Section>
            </div>
          )}
        </TabsContent>

        {/* Duty Tab */}
        <TabsContent value="duty">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section title="Position Details">
              <InfoRow label="Designation" value={emp.designation?.label || emp.designation?.title || emp.dutyType} />
              <InfoRow label="Department" value={emp.department?.label || emp.department?.name} />
              <InfoRow label="Office Branch" value={emp.office?.name} />
              <InfoRow label="Joining Date" value={formatDate(emp.joinDate)} />
              <InfoRow label="Status" value={emp.status} />
            </Section>
            <Section title="Compensation">
              <InfoRow label="Monthly Salary" value={`₨ ${emp.salary.toLocaleString()}`} />
            </Section>
          </div>
        </TabsContent>

        {/* Finance Tab */}
        <TabsContent value="finance">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-3 md:mb-4">
            <FinanceBox label="Monthly Salary" value={`₨ ${emp.salary.toLocaleString()}`} />
            <FinanceBox label="Total Paid" value={`₨ ${totalPaidAll.toLocaleString()}`} variant="success" />
            <FinanceBox label="Total Advance" value={`₨ ${totalAdvanceAll.toLocaleString()}`} variant={totalAdvanceAll > 0 ? "danger" : "default"} />
            <FinanceBox label="Total Commission" value={`₨ ${totalCommissionAll.toLocaleString()}`} variant={totalCommissionAll > 0 ? "success" : "default"} />
          </div>

          {/* Payment history */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
            <Section title="Salary Breakdown">
              <InfoRow label="Base Salary" value={`₨ ${emp.salary.toLocaleString()}`} />
              <InfoRow label="Total Deductions" value={totalDeductionsAll > 0 ? `₨ ${totalDeductionsAll.toLocaleString()}` : "None"} />
              <InfoRow label="Total Advance" value={totalAdvanceAll > 0 ? `₨ ${totalAdvanceAll.toLocaleString()}` : "None"} />
              <InfoRow label="Total Commission" value={totalCommissionAll > 0 ? `₨ ${totalCommissionAll.toLocaleString()}` : "None"} />
            </Section>
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl border border-border p-3 md:p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2 md:mb-3 pb-1.5 md:pb-2 border-b border-primary/20">
                  <h3 className="text-xs md:text-sm font-semibold text-primary">Payment History</h3>
                  <Button size="sm" variant="outline" onClick={() => openPayDialog()} className="h-7 md:h-8 text-xs gap-1">
                    <Plus className="w-3 h-3" /> <span className="hidden sm:inline">Add Payment</span>
                  </Button>
                </div>
                {displayHistory.length === 0 ? (
                  <p className="text-xs md:text-sm text-muted-foreground py-4 text-center">No payment history yet</p>
                ) : (
                  <div className="overflow-x-auto -mx-3 md:-mx-5 px-3 md:px-5">
                    <table className="w-full text-xs md:text-sm min-w-[700px]">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-1.5 md:py-2 text-muted-foreground font-medium">Month</th>
                          <th className="text-left py-1.5 md:py-2 text-muted-foreground font-medium">Type</th>
                          <th className="text-right py-1.5 md:py-2 text-muted-foreground font-medium">Base</th>
                          <th className="text-right py-1.5 md:py-2 text-stat-free font-medium hidden md:table-cell">Comm.</th>
                          <th className="text-right py-1.5 md:py-2 text-destructive font-medium hidden md:table-cell">Deduct.</th>
                          <th className="text-right py-1.5 md:py-2 text-stat-pending font-medium hidden md:table-cell">Advance</th>
                          <th className="text-right py-1.5 md:py-2 text-muted-foreground font-medium">Net Paid</th>
                          <th className="text-center py-1.5 md:py-2 text-muted-foreground font-medium w-20">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {displayHistory.map(p => (
                          <tr key={p.id} className="hover:bg-muted/30">
                            <td className="py-1.5 md:py-2 font-medium text-card-foreground whitespace-nowrap">
                              <div>{p.month}</div>
                              <div className="text-[10px] text-muted-foreground">{formatDate(p.paidAt)}</div>
                            </td>
                            <td className="py-1.5 md:py-2">
                              <span className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full ${
                                p.type === "salary" ? "bg-primary/10 text-primary" :
                                p.type === "advance" ? "bg-stat-pending/15 text-stat-pending" :
                                p.type === "commission" ? "bg-stat-free/15 text-stat-free" :
                                "bg-destructive/15 text-destructive"
                              }`}>
                                {p.type.charAt(0).toUpperCase() + p.type.slice(1)}
                              </span>
                              {p.note && <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[120px] truncate" title={p.note}>{p.note}</p>}
                            </td>
                            <td className="py-1.5 md:py-2 text-right text-muted-foreground whitespace-nowrap">₨ {p.baseSalary.toLocaleString()}</td>
                            <td className="py-1.5 md:py-2 text-right whitespace-nowrap hidden md:table-cell">
                              {p.commission > 0 ? <span className="text-stat-free font-medium">₨ {p.commission.toLocaleString()}</span> : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="py-1.5 md:py-2 text-right whitespace-nowrap hidden md:table-cell">
                              {p.deduction > 0 ? <span className="text-destructive font-medium">₨ {p.deduction.toLocaleString()}</span> : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="py-1.5 md:py-2 text-right whitespace-nowrap hidden md:table-cell">
                              {p.advance > 0 ? <span className="text-stat-pending font-medium">₨ {p.advance.toLocaleString()}</span> : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="py-1.5 md:py-2 text-right text-card-foreground font-medium whitespace-nowrap">₨ {p.netPaid.toLocaleString()}</td>
                            <td className="py-1.5 md:py-2 text-center">
                              <div className="flex items-center justify-center gap-0.5 md:gap-1">
                                {p.netPaid > 0 && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:bg-primary/10 hover:text-primary" title="View Invoice" onClick={() => setInvoicePayment(p)}>
                                    <Printer className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:bg-primary hover:text-primary-foreground" onClick={() => openPayDialog(p)}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                {!isFinanceManager && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground" onClick={() => setDeletePayTarget(p)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Advance Records */}
          <div className="bg-card rounded-xl border border-border p-3 md:p-5 shadow-sm mt-3 md:mt-4">
            <div className="flex items-center justify-between mb-2 md:mb-3 pb-1.5 md:pb-2 border-b border-primary/20">
              <h3 className="text-xs md:text-sm font-semibold text-primary flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5" /> Advance Records
              </h3>
              {!isFinanceManager && (
                <Button size="sm" variant="outline" className="h-7 md:h-8 text-xs gap-1" onClick={() => setAdvanceOpen(true)}>
                  <Plus className="w-3 h-3" /> Add Advance
                </Button>
              )}
            </div>
            {advances.length === 0 ? (
              <p className="text-xs md:text-sm text-muted-foreground py-3 text-center">No advance records yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm min-w-[400px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1.5 md:py-2 text-muted-foreground font-medium">Date</th>
                      <th className="text-right py-1.5 md:py-2 text-muted-foreground font-medium">Amount</th>
                      <th className="text-left py-1.5 md:py-2 text-muted-foreground font-medium hidden md:table-cell">Reason</th>
                      {!isFinanceManager && <th className="text-center py-1.5 md:py-2 w-12"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {advances.map(a => (
                      <tr key={a.id} className="hover:bg-muted/30">
                        <td className="py-1.5 md:py-2 text-card-foreground whitespace-nowrap">{formatDate(a.date)}</td>
                        <td className="py-1.5 md:py-2 text-right font-medium text-stat-pending whitespace-nowrap">₨ {Number(a.amount).toLocaleString()}</td>
                        <td className="py-1.5 md:py-2 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{a.reason || "—"}</td>
                        {!isFinanceManager && (
                          <td className="py-1.5 md:py-2 text-center">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground" onClick={() => setDeleteAdvanceTarget(a.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Salary change history */}
          <div className="bg-card rounded-xl border border-border p-3 md:p-5 shadow-sm mt-3 md:mt-4">
            <div className="flex items-center justify-between mb-2 md:mb-3 pb-1.5 md:pb-2 border-b border-primary/20">
              <h3 className="text-xs md:text-sm font-semibold text-primary flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Salary Change History
              </h3>
              {!isFinanceManager && (
                <Button size="sm" variant="outline" className="h-7 md:h-8 text-xs gap-1" onClick={() => { setNewSalaryAmount(String(emp.salary)); setSalaryUpdateNote(""); setSalaryUpdateOpen(true); }}>
                  <TrendingUp className="w-3 h-3" /> Update Salary
                </Button>
              )}
            </div>
            {salaryHistory.length === 0 ? (
              <p className="text-xs md:text-sm text-muted-foreground py-3 text-center">No salary changes recorded yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1.5 md:py-2 text-muted-foreground font-medium">Date</th>
                      <th className="text-right py-1.5 md:py-2 text-muted-foreground font-medium">Previous</th>
                      <th className="text-right py-1.5 md:py-2 text-muted-foreground font-medium">New</th>
                      <th className="text-right py-1.5 md:py-2 text-muted-foreground font-medium hidden sm:table-cell">Change</th>
                      <th className="text-left py-1.5 md:py-2 text-muted-foreground font-medium hidden md:table-cell">Reason</th>
                      <th className="text-left py-1.5 md:py-2 text-muted-foreground font-medium hidden md:table-cell">By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {salaryHistory.map(h => {
                      const diff = h.newSalary - h.oldSalary;
                      return (
                        <tr key={h.id} className="hover:bg-muted/30">
                          <td className="py-1.5 md:py-2 text-card-foreground whitespace-nowrap">{formatDate(h.createdAt)}</td>
                          <td className="py-1.5 md:py-2 text-right text-muted-foreground whitespace-nowrap">₨ {h.oldSalary.toLocaleString()}</td>
                          <td className="py-1.5 md:py-2 text-right font-medium text-card-foreground whitespace-nowrap">₨ {h.newSalary.toLocaleString()}</td>
                          <td className="py-1.5 md:py-2 text-right whitespace-nowrap hidden sm:table-cell">
                            <span className={`text-[10px] md:text-xs font-medium px-1.5 py-0.5 rounded-full ${diff > 0 ? "bg-stat-free/15 text-stat-free" : "bg-destructive/15 text-destructive"}`}>
                              {diff > 0 ? "+" : ""}₨ {diff.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-1.5 md:py-2 text-muted-foreground hidden md:table-cell max-w-[180px] truncate" title={h.reason}>{h.reason || "—"}</td>
                          <td className="py-1.5 md:py-2 text-muted-foreground hidden md:table-cell">{h.changedBy || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Leaves Tab */}
        <TabsContent value="leaves">
          <div className="space-y-3 md:space-y-4">
            {/* Leave Balance */}
            {leaveBalance.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-3 md:p-5 shadow-sm">
                <h3 className="text-xs md:text-sm font-semibold text-primary mb-3 pb-1.5 border-b border-primary/20">Leave Balance (This Year)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                  {leaveBalance.map(lb => (
                    <div key={lb.leaveTypeId} className="rounded-xl border border-border p-3 text-center bg-muted/20">
                      <p className="text-[10px] md:text-xs text-muted-foreground mb-1">{lb.name}</p>
                      <p className="text-sm md:text-lg font-bold text-card-foreground">{lb.remainingDays}</p>
                      <p className="text-[10px] text-muted-foreground">/ {lb.daysAllowed} days</p>
                      <div className="mt-1.5 h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: lb.daysAllowed > 0 ? `${Math.min(100, (lb.usedDays / lb.daysAllowed) * 100)}%` : "0%" }}
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1">{lb.usedDays} used</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
              <div className="bg-card rounded-xl border border-border p-3 md:p-4 shadow-sm text-center">
                <p className="text-[10px] md:text-xs text-muted-foreground">Total Records</p>
                <p className="text-sm md:text-lg font-bold text-primary">{leaveRecords.length}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-3 md:p-4 shadow-sm text-center">
                <p className="text-[10px] md:text-xs text-muted-foreground">Approved</p>
                <p className="text-sm md:text-lg font-bold text-stat-free">{leaveRecords.filter(r => r.status === "approved").length}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-3 md:p-4 shadow-sm text-center">
                <p className="text-[10px] md:text-xs text-muted-foreground">Pending</p>
                <p className="text-sm md:text-lg font-bold text-stat-pending">{leaveRecords.filter(r => r.status === "pending").length}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-3 md:p-4 shadow-sm text-center">
                <p className="text-[10px] md:text-xs text-muted-foreground">Unpaid Deductions</p>
                <p className="text-sm md:text-lg font-bold text-destructive">
                  Rs {leaveRecords.filter(r => r.status === "approved" && r.deductionAmount).reduce((s, r) => s + (r.deductionAmount || 0), 0).toFixed(0)}
                </p>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-3 md:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2 md:mb-3 pb-1.5 md:pb-2 border-b border-primary/20">
                <h3 className="text-xs md:text-sm font-semibold text-primary">Leave History</h3>
                <Button size="sm" onClick={() => openLeaveDialog()} className="h-7 md:h-8 text-xs gap-1">
                  <Plus className="w-3 h-3" /> <span className="hidden sm:inline">Add Leave</span>
                </Button>
              </div>
              {leaveRecords.length === 0 ? (
                <div className="text-center py-6 md:py-8">
                  <Calendar className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground/40 mx-auto mb-2 md:mb-3" />
                  <p className="text-xs md:text-sm text-muted-foreground">No leave records yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-3 md:-mx-5 px-3 md:px-5">
                  <table className="w-full text-xs md:text-sm min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1.5 md:py-2 text-muted-foreground font-medium">Type</th>
                        <th className="text-left py-1.5 md:py-2 text-muted-foreground font-medium">Start Date</th>
                        <th className="text-left py-1.5 md:py-2 text-muted-foreground font-medium">End Date</th>
                        <th className="text-center py-1.5 md:py-2 text-muted-foreground font-medium">Days</th>
                        <th className="text-center py-1.5 md:py-2 text-muted-foreground font-medium">Deduction</th>
                        <th className="text-left py-1.5 md:py-2 text-muted-foreground font-medium">Reason</th>
                        <th className="text-center py-1.5 md:py-2 text-muted-foreground font-medium">Status</th>
                        <th className="text-center py-1.5 md:py-2 text-muted-foreground font-medium w-16 md:w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {[...leaveRecords].sort((a, b) => b.startDate.localeCompare(a.startDate)).map(leave => (
                        <tr key={leave.id} className="hover:bg-muted/30">
                          <td className="py-1.5 md:py-2">
                            <span className="text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {leave.leaveType?.name || "—"}
                            </span>
                          </td>
                          <td className="py-1.5 md:py-2 text-card-foreground">{formatDate(leave.startDate)}</td>
                          <td className="py-1.5 md:py-2 text-card-foreground">{formatDate(leave.endDate)}</td>
                          <td className="py-1.5 md:py-2 text-center font-medium text-card-foreground">
                            {leave.days}
                            {leave.isHalfDay && <span className="ml-1 text-[9px] bg-primary/10 text-primary px-1 rounded">Half</span>}
                          </td>
                          <td className="py-1.5 md:py-2 text-center text-destructive font-medium">
                            {(leave.leaveType?.name === "Unpaid Leave" || leave.leaveType?.name === "Unpaid") && leave.deductionAmount
                              ? `Rs ${leave.deductionAmount.toFixed(0)}`
                              : "—"}
                          </td>
                          <td className="py-1.5 md:py-2 text-muted-foreground max-w-[200px] truncate" title={leave.reason}>{leave.reason || "—"}</td>
                          <td className="py-1.5 md:py-2 text-center">
                            <span className={`inline-flex items-center gap-1 text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full ${
                              leave.status === "approved" ? "bg-stat-free/15 text-stat-free" :
                              leave.status === "rejected" ? "bg-destructive/15 text-destructive" :
                              "bg-stat-pending/15 text-stat-pending"
                            }`}>
                              {leave.status === "approved" && <CheckCircle className="w-3 h-3" />}
                              {leave.status === "rejected" && <XCircle className="w-3 h-3" />}
                              {leave.status === "pending" && <Clock className="w-3 h-3" />}
                              {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-1.5 md:py-2 text-center">
                            <div className="flex items-center justify-center gap-0.5 md:gap-1">
                              {leave.status === "pending" && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:bg-stat-free hover:text-white" onClick={() => updateLeaveStatus.mutateAsync({ id: leave.id, status: "approved" }).then(() => toast.success("Leave approved"))}>
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground" onClick={() => setDeleteLeaveTarget(leave)}>
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
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <AttendanceTab employeeId={emp.id} />
        </TabsContent>

        {/* Medical Tab */}
        <TabsContent value="medical">
          <div className="max-w-lg">
            <Section title="Medical Information">
              <InfoRow label="Blood Group" value={emp.bloodGroup} />
              <InfoRow label="Medical History" value={emp.medicalHistory || "None"} />
              <InfoRow label="Disabilities" value={emp.disabilities || "None"} />
            </Section>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <div className="bg-card rounded-xl border border-border p-3 md:p-5 shadow-sm">
            <h3 className="text-xs md:text-sm font-semibold text-primary mb-3 pb-1.5 border-b border-primary/20">Employee Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { key: "hasCv", label: "CV / Resume" },
                { key: "hasNic", label: "NIC Copy" },
                { key: "hasDegree", label: "Degree / Certificate" },
                { key: "hasContract", label: "Employment Contract" },
                { key: "hasPoliceVerification", label: "Police Verification" },
              ].map(doc => {
                const uploaded = !!(emp as any)[doc.key];
                return (
                  <div key={doc.key} className={`rounded-xl border-2 p-4 flex items-center justify-between ${uploaded ? "border-stat-free/30 bg-stat-free/5" : "border-border bg-muted/20"}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${uploaded ? "bg-stat-free/15" : "bg-muted"}`}>
                        <FileText className={`w-4 h-4 ${uploaded ? "text-stat-free" : "text-muted-foreground"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm font-medium text-card-foreground truncate">{doc.label}</p>
                        <p className={`text-[10px] ${uploaded ? "text-stat-free" : "text-muted-foreground"}`}>
                          {uploaded ? "Uploaded" : "Not uploaded"}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={uploaded ? "outline" : "default"}
                      className="h-7 text-xs gap-1 shrink-0 ml-2"
                      onClick={() => handleUploadDoc(doc.key)}
                      disabled={uploadDocument.isPending}
                    >
                      <Upload className="w-3 h-3" />
                      {uploaded ? "Replace" : "Upload"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          {/* Cooldown banner */}
          {isOnCooldown && emp.lockedUntil && (
            <div className="mb-3 flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
              <LockKeyhole className="w-4 h-4 text-destructive shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-destructive">Employee is on cooldown</p>
                <p className="text-[10px] text-destructive/70">Locked until {new Date(emp.lockedUntil).toLocaleString()}</p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs gap-1.5 shrink-0"
                onClick={handleEndCooldown}
                disabled={unlockEmployee.isPending}
              >
                <LockOpen className="w-3 h-3" /> End Cooldown
              </Button>
            </div>
          )}
          <div className="bg-card rounded-xl border border-border shadow-sm">
            <div className="p-3 md:p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-xs md:text-sm font-semibold text-primary">Session History</h3>
              <div className="flex items-center gap-3">
                <span className="text-[10px] md:text-xs text-muted-foreground">{sessions.length} event{sessions.length !== 1 ? "s" : ""}</span>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" asChild>
                  <Link to={`/employees/${emp.id}/sessions`}>
                    <Smartphone className="w-3 h-3" /> View All Sessions
                  </Link>
                </Button>
              </div>
            </div>
            {sessions.length === 0 ? (
              <div className="py-14 text-center text-muted-foreground text-sm">
                <Smartphone className="w-10 h-10 mx-auto mb-2 opacity-30" />
                No session events recorded yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sessions.slice(0, 10).map((s: EmployeeSession) => {
                  const eventConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
                    login: { icon: LogIn, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", label: "Logged In" },
                    logout: { icon: LogOut, color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800/30", label: "Logged Out" },
                    cooldown_started: { icon: LockKeyhole, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20", label: "Cooldown Started" },
                    cooldown_ended: { icon: LockOpen, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", label: "Cooldown Ended" },
                  };
                  const cfg = eventConfig[s.event] ?? { icon: Clock, color: "text-muted-foreground", bg: "bg-muted/30", label: s.event };
                  const Icon = cfg.icon;
                  const device = s.deviceInfo as any;
                  const deviceLabel = device ? [device.manufacturer, device.model, device.os].filter(Boolean).join(" ") : null;
                  const ts = new Date(s.createdAt);
                  return (
                    <div key={s.id} className="flex items-start gap-3 p-3 md:p-4 hover:bg-muted/20 transition-colors">
                      <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                          {deviceLabel && (
                            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md font-mono">{deviceLabel}</span>
                          )}
                        </div>
                        {s.event === "cooldown_ended" && s.performedBy && (
                          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
                            Ended by <span className="font-medium text-card-foreground">{s.performedBy}</span>
                            {s.performedByRole && <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{s.performedByRole.replace("_", " ")}</span>}
                          </p>
                        )}
                        {s.note && s.event !== "cooldown_ended" && (
                          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 truncate">{s.note}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                          {ts.toLocaleDateString()} at {ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {sessions.length > 10 && (
                  <div className="p-3 text-center border-t border-border">
                    <Button variant="ghost" size="sm" className="text-xs gap-1.5" asChild>
                      <Link to={`/employees/${emp.id}/sessions`}>
                        View all {sessions.length} events →
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Pay Salary Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
              <Banknote className="w-4 h-4 md:w-5 md:h-5 text-stat-free" />
              {editingPayment ? "Edit Payment" : "Pay Salary"} — {emp.fullName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 md:space-y-4 py-2">
            <div>
              <Label className="text-xs md:text-sm font-medium mb-1.5 block">Payment Type</Label>
              <Select value={payType} onValueChange={v => { setPayType(v as any); if (v === "salary") setPayAmount(String(emp.salary)); else setPayAmount(""); }}>
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
              <>
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
                  <p className="text-base md:text-lg font-bold text-card-foreground">
                    ₨ {Math.max(0, (Number(payAmount)||0) - (Number(payDeduction)||0) - (Number(payAdvance)||0) + (Number(payCommission)||0)).toLocaleString()}
                  </p>
                </div>
              </>
            )}
            <div>
              <Label className="text-xs md:text-sm font-medium mb-1.5 block">Note (optional)</Label>
              <Textarea value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="Any remarks..." rows={2} className="text-xs md:text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)} className="h-9 md:h-10 text-xs md:text-sm">Cancel</Button>
            <Button onClick={handlePaySalary} disabled={!payAmount || Number(payAmount) <= 0 || createSalary.isPending || updateSalary.isPending} className="h-9 md:h-10 text-xs md:text-sm">
              <Banknote className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" /> {editingPayment ? "Update Payment" : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Confirmation */}
      <Dialog open={!!deletePayTarget} onOpenChange={open => !open && setDeletePayTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
              <Trash2 className="w-4 h-4 md:w-5 md:h-5 text-destructive" /> Delete Payment
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs md:text-sm text-muted-foreground">
            Delete this <strong>{deletePayTarget?.type}</strong> payment of <strong>₨ {deletePayTarget?.netPaid.toLocaleString()}</strong>? Cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePayTarget(null)} className="h-9 md:h-10 text-xs md:text-sm">Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePayment} disabled={deleteSalary.isPending} className="h-9 md:h-10 text-xs md:text-sm">
              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Leave Dialog */}
      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              {editingLeave ? "Edit Leave Status" : "Add Leave Record"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 md:space-y-4 py-2">
            {!editingLeave && (
              <>
                <div>
                  <Label className="text-xs md:text-sm font-medium mb-1.5 block">Leave Type</Label>
                  <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                    <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm"><SelectValue placeholder="Select leave type" /></SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map(lt => <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div>
                    <Label className="text-xs md:text-sm font-medium mb-1.5 block">Start Date</Label>
                    <Input type="date" value={leaveStartDate} onChange={e => setLeaveStartDate(e.target.value)} className="h-8 md:h-10 text-xs md:text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs md:text-sm font-medium mb-1.5 block">End Date</Label>
                    <Input type="date" value={leaveEndDate} onChange={e => setLeaveEndDate(e.target.value)} className="h-8 md:h-10 text-xs md:text-sm" />
                  </div>
                </div>
                {leaveStartDate && leaveEndDate && (
                  <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] md:text-xs text-muted-foreground">Total Days</p>
                    <p className="text-base md:text-lg font-bold text-card-foreground">{calculateLeaveDays(leaveStartDate, leaveEndDate)} day(s)</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs md:text-sm font-medium mb-1.5 block">Reason</Label>
                  <Textarea value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="Reason for leave..." rows={3} className="text-xs md:text-sm" />
                </div>
              </>
            )}
            <div>
              <Label className="text-xs md:text-sm font-medium mb-1.5 block">Status</Label>
              <Select value={leaveStatus} onValueChange={v => setLeaveStatus(v as any)}>
                <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveOpen(false)} className="h-9 md:h-10 text-xs md:text-sm">Cancel</Button>
            <Button onClick={handleSaveLeave} disabled={createLeave.isPending || updateLeaveStatus.isPending} className="h-9 md:h-10 text-xs md:text-sm">
              {editingLeave ? "Update Status" : "Add Leave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Leave Confirmation */}
      <Dialog open={!!deleteLeaveTarget} onOpenChange={open => !open && setDeleteLeaveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
              <Trash2 className="w-4 h-4 md:w-5 md:h-5 text-destructive" /> Delete Leave Record
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs md:text-sm text-muted-foreground">
            Delete this <strong>{deleteLeaveTarget?.leaveType?.name}</strong> leave for <strong>{deleteLeaveTarget?.days} day(s)</strong>? Cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteLeaveTarget(null)} className="h-9 md:h-10 text-xs md:text-sm">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteLeave} disabled={deleteLeave.isPending} className="h-9 md:h-10 text-xs md:text-sm">
              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Advance Dialog */}
      <Dialog open={advanceOpen} onOpenChange={setAdvanceOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Banknote className="w-4 h-4 text-stat-pending" /> Add Advance Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs md:text-sm font-medium mb-1.5 block">Amount (₨)</Label>
              <Input type="number" value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} placeholder="Enter amount" className="h-9" />
            </div>
            <div>
              <Label className="text-xs md:text-sm font-medium mb-1.5 block">Date</Label>
              <Input type="date" value={advanceDate} onChange={e => setAdvanceDate(e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs md:text-sm font-medium mb-1.5 block">Reason (optional)</Label>
              <Input value={advanceReason} onChange={e => setAdvanceReason(e.target.value)} placeholder="e.g. Medical emergency..." className="h-9" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdvanceOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAdvance} disabled={createAdvance.isPending}>Record Advance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Advance Confirmation */}
      <Dialog open={!!deleteAdvanceTarget} onOpenChange={open => !open && setDeleteAdvanceTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trash2 className="w-4 h-4 text-destructive" /> Delete Advance</DialogTitle>
          </DialogHeader>
          <p className="text-xs md:text-sm text-muted-foreground">Delete this advance record? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAdvanceTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAdvance} disabled={deleteAdvance.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Salary Dialog */}
      <Dialog open={salaryUpdateOpen} onOpenChange={setSalaryUpdateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Update Salary</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground text-xs">Current Salary</p>
              <p className="font-bold text-card-foreground">₨ {emp.salary.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-xs md:text-sm font-medium mb-1.5 block">New Salary (₨)</Label>
              <Input type="number" value={newSalaryAmount} onChange={e => setNewSalaryAmount(e.target.value)} placeholder="Enter new salary" className="h-9" />
            </div>
            <div>
              <Label className="text-xs md:text-sm font-medium mb-1.5 block">Note (optional)</Label>
              <Input value={salaryUpdateNote} onChange={e => setSalaryUpdateNote(e.target.value)} placeholder="e.g. Annual increment, promotion..." className="h-9" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSalaryUpdateOpen(false)}>Cancel</Button>
            <Button onClick={handleSalaryUpdate} disabled={updateEmployee.isPending}>Update Salary</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Salary Invoice Dialog */}
      <Dialog open={!!invoicePayment} onOpenChange={open => !open && setInvoicePayment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Printer className="w-4 h-4" /> Salary Invoice</DialogTitle>
          </DialogHeader>
          {invoicePayment && (
            <div className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                <p className="font-bold text-primary text-base">Salary Slip</p>
                <p className="text-xs text-muted-foreground mt-0.5">{emp.office?.name}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Employee</span><span className="font-medium">{emp.fullName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Designation</span><span className="font-medium">{emp.designation?.label || emp.designation?.title || emp.dutyType}</span></div>
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
              <div className="text-center text-[10px] text-muted-foreground border-t border-border pt-2">
                Generated by Team Manager · {new Date().toLocaleDateString()}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoicePayment(null)}>Close</Button>
            <Button onClick={() => window.print()} className="gap-2"><Printer className="w-4 h-4" /> Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeDetail;
