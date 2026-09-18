export interface SalaryPayment {
  id: string;
  employeeId: string;
  month: string; // e.g. "2026-04"
  baseSalary: number;
  advance: number;
  deduction: number;
  commission: number;
  netPaid: number;
  note: string;
  paidDate: string;
  type: "salary" | "advance" | "commission" | "deduction";
}

export interface LeaveRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvalNote?: string;
  reportingToId?: string;
  reportingToName?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  // Office
  officeId: string;
  department: string;
  // Personal
  fullName: string;
  fatherName: string;
  cnic: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  country: string;
  // Emergency
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  emergencyAltPhone: string;
  // Guardian
  guardianName: string;
  guardianCnic: string;
  guardianPhone: string;
  guardianAddress: string;
  // Medical
  bloodGroup: string;
  medicalConditions: string;
  allergies: string;
  // Documents
  selfImage: string;
  idCardFront: string;
  idCardBack: string;
  policeCharacterCert: string;
  // Personal extra
  maritalStatus: string;
  // Education & Experience
  lastEducation: string;
  educationInstitute: string;
  educationYear: string;
  totalExperience: string;
  previousEmployer: string;
  previousDesignation: string;
  // Hiring
  hiringDesignation: string;
  // Duty
  dutyType: string;
  salary: number;
  totalLeaves: number;
  leavesTaken: number;
  joiningDate: string;
  // Meta
  status: "active" | "on-leave" | "terminated";
  createdAt: string;
}

export const DEPARTMENTS = [
  "Engineering",
  "Marketing",
  "Sales",
  "HR",
  "Finance",
  "Operations",
  "Customer Support",
  "Design",
  "Product",
  "Legal",
  "IT",
  "Admin",
  "Other",
];

export const DUTY_TYPES = [
  "Cook",
  "Cook Helper",
  "Cleaner",
  "Laundry Man",
  "Security Guard",
  "Manager",
  "Warden",
  "Electrician",
  "Plumber",
  "Gardener",
  "Driver",
  "Receptionist",
  "Other",
];

const STORAGE_KEY = "hostel_employees";
const PAYMENTS_KEY = "hostel_salary_payments";
const LEAVES_KEY = "hostel_employee_leaves";
const INCREMENTS_KEY = "hostel_salary_increments";

export interface SalaryIncrement {
  id: string;
  employeeId: string;
  previousSalary: number;
  newSalary: number;
  changedAt: string;
  note?: string;
}

export function getSalaryIncrements(employeeId: string): SalaryIncrement[] {
  const data = localStorage.getItem(INCREMENTS_KEY);
  const all: SalaryIncrement[] = data ? JSON.parse(data) : [];
  return all.filter((r) => r.employeeId === employeeId).sort((a, b) => b.changedAt.localeCompare(a.changedAt));
}

export function saveSalaryIncrement(record: SalaryIncrement) {
  const data = localStorage.getItem(INCREMENTS_KEY);
  const all: SalaryIncrement[] = data ? JSON.parse(data) : [];
  all.push(record);
  localStorage.setItem(INCREMENTS_KEY, JSON.stringify(all));
}

export function getEmployees(): Employee[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveEmployee(employee: Employee) {
  const employees = getEmployees();
  employees.push(employee);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}

export function updateEmployee(updated: Employee) {
  const employees = getEmployees().map((e) => (e.id === updated.id ? updated : e));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}

export function deleteEmployee(id: string) {
  const employees = getEmployees().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}

// Salary payments
export function getSalaryPayments(): SalaryPayment[] {
  const data = localStorage.getItem(PAYMENTS_KEY);
  if (!data) return [];
  // Migrate legacy "bonus" field/type to "commission"
  return (JSON.parse(data) as any[]).map((p) => ({
    ...p,
    commission: p.commission ?? p.bonus ?? 0,
    type: p.type === "bonus" ? "commission" : p.type,
  }));
}

export function getEmployeePayments(employeeId: string): SalaryPayment[] {
  return getSalaryPayments().filter((p) => p.employeeId === employeeId);
}

export function saveSalaryPayment(payment: SalaryPayment) {
  const payments = getSalaryPayments();
  payments.push(payment);
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}

export function updateSalaryPayment(updated: SalaryPayment) {
  const payments = getSalaryPayments().map((p) => (p.id === updated.id ? updated : p));
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}

export function deleteSalaryPayment(id: string) {
  const payments = getSalaryPayments().filter((p) => p.id !== id);
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}

// Outstanding advance balance = total advances given (type="advance") - total advance recovered in salary payments
export function getEmployeeAdvanceBalance(employeeId: string): number {
  const payments = getEmployeePayments(employeeId);
  const given = payments.filter((p) => p.type === "advance").reduce((s, p) => s + p.netPaid, 0);
  const recovered = payments.filter((p) => p.type === "salary").reduce((s, p) => s + (p.advance || 0), 0);
  return Math.max(0, given - recovered);
}

export function isCurrentMonthPaid(employeeId: string): boolean {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return getSalaryPayments().some(
    (p) => p.employeeId === employeeId && p.month === currentMonth && p.type === "salary"
  );
}

// Leave management
export function getLeaveRecords(): LeaveRecord[] {
  const data = localStorage.getItem(LEAVES_KEY);
  return data ? JSON.parse(data) : [];
}

export function getEmployeeLeaves(employeeId: string): LeaveRecord[] {
  return getLeaveRecords().filter((l) => l.employeeId === employeeId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveLeaveRecord(leave: LeaveRecord) {
  const leaves = getLeaveRecords();
  leaves.push(leave);
  localStorage.setItem(LEAVES_KEY, JSON.stringify(leaves));
  
  // Update employee's leavesTaken count if approved
  if (leave.status === "approved") {
    const employee = getEmployees().find(e => e.id === leave.employeeId);
    if (employee) {
      employee.leavesTaken += leave.totalDays;
      updateEmployee(employee);
    }
  }
}

export function updateLeaveRecord(updated: LeaveRecord) {
  const leaves = getLeaveRecords();
  const oldLeave = leaves.find(l => l.id === updated.id);
  
  // Update leaves array
  const newLeaves = leaves.map((l) => (l.id === updated.id ? updated : l));
  localStorage.setItem(LEAVES_KEY, JSON.stringify(newLeaves));
  
  // Update employee's leavesTaken count
  const employee = getEmployees().find(e => e.id === updated.employeeId);
  if (employee && oldLeave) {
    // Subtract old count if it was approved
    if (oldLeave.status === "approved") {
      employee.leavesTaken -= oldLeave.totalDays;
    }
    // Add new count if now approved
    if (updated.status === "approved") {
      employee.leavesTaken += updated.totalDays;
    }
    updateEmployee(employee);
  }
}

export function deleteLeaveRecord(id: string) {
  const leaves = getLeaveRecords();
  const leave = leaves.find(l => l.id === id);
  
  // Update employee's leavesTaken if the leave was approved
  if (leave && leave.status === "approved") {
    const employee = getEmployees().find(e => e.id === leave.employeeId);
    if (employee) {
      employee.leavesTaken -= leave.totalDays;
      updateEmployee(employee);
    }
  }
  
  const filteredLeaves = leaves.filter((l) => l.id !== id);
  localStorage.setItem(LEAVES_KEY, JSON.stringify(filteredLeaves));
}
