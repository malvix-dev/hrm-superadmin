const STORAGE_KEY = "tm_leave_types";

export interface LeaveType {
  id: string;
  name: string;
  description: string;
  maxDaysPerYear: string;
  isPaid: boolean;
  color: string;
  createdAt: string;
}

const DEFAULT_TYPES: LeaveType[] = [
  { id: "lt-1", name: "Annual Leave", description: "Yearly paid leave entitlement", maxDaysPerYear: "20", isPaid: true, color: "#10b981", createdAt: new Date(2026, 0, 1).toISOString() },
  { id: "lt-2", name: "Sick Leave", description: "Medical / health-related absence", maxDaysPerYear: "10", isPaid: true, color: "#f59e0b", createdAt: new Date(2026, 0, 1).toISOString() },
  { id: "lt-3", name: "Casual Leave", description: "Short-notice personal leave", maxDaysPerYear: "12", isPaid: true, color: "#6366f1", createdAt: new Date(2026, 0, 1).toISOString() },
  { id: "lt-4", name: "Emergency Leave", description: "Unforeseen urgent situations", maxDaysPerYear: "5", isPaid: true, color: "#ef4444", createdAt: new Date(2026, 0, 1).toISOString() },
  { id: "lt-5", name: "Unpaid Leave", description: "Leave without salary", maxDaysPerYear: "", isPaid: false, color: "#94a3b8", createdAt: new Date(2026, 0, 1).toISOString() },
  { id: "lt-6", name: "Maternity Leave", description: "Leave for new mothers", maxDaysPerYear: "90", isPaid: true, color: "#ec4899", createdAt: new Date(2026, 0, 1).toISOString() },
  { id: "lt-7", name: "Paternity Leave", description: "Leave for new fathers", maxDaysPerYear: "10", isPaid: true, color: "#3b82f6", createdAt: new Date(2026, 0, 1).toISOString() },
  { id: "lt-8", name: "Study Leave", description: "Leave for educational purposes", maxDaysPerYear: "10", isPaid: false, color: "#8b5cf6", createdAt: new Date(2026, 0, 1).toISOString() },
];

export function getLeaveTypes(): LeaveType[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TYPES));
    return DEFAULT_TYPES;
  }
  return JSON.parse(data);
}

export function saveLeaveType(lt: LeaveType) {
  const all = getLeaveTypes();
  all.push(lt);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function updateLeaveType(updated: LeaveType) {
  const all = getLeaveTypes().map((lt) => (lt.id === updated.id ? updated : lt));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteLeaveType(id: string) {
  const all = getLeaveTypes().filter((lt) => lt.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
