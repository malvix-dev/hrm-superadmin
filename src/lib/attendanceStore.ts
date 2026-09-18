export type AttendanceStatus = "present" | "absent" | "half-day" | "late" | "on-leave";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  officeId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string;
  note: string;
  createdAt: string;
}

const STORAGE_KEY = "team_attendance";

export function getAttendanceRecords(): AttendanceRecord[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveAttendance(record: AttendanceRecord) {
  const records = getAttendanceRecords();
  records.push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function updateAttendance(updated: AttendanceRecord) {
  const records = getAttendanceRecords().map((r) => (r.id === updated.id ? updated : r));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function deleteAttendance(id: string) {
  const records = getAttendanceRecords().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function getAttendanceByDate(date: string, officeId?: string): AttendanceRecord[] {
  const records = getAttendanceRecords().filter((r) => r.date === date);
  if (officeId && officeId !== "all") return records.filter((r) => r.officeId === officeId);
  return records;
}

export function getEmployeeAttendance(employeeId: string, month?: string): AttendanceRecord[] {
  const records = getAttendanceRecords().filter((r) => r.employeeId === employeeId);
  if (month) return records.filter((r) => r.date.startsWith(month));
  return records.sort((a, b) => b.date.localeCompare(a.date));
}

export function getAttendanceSummary(date: string, officeId?: string) {
  const records = getAttendanceByDate(date, officeId);
  return {
    present: records.filter((r) => r.status === "present").length,
    absent: records.filter((r) => r.status === "absent").length,
    halfDay: records.filter((r) => r.status === "half-day").length,
    late: records.filter((r) => r.status === "late").length,
    onLeave: records.filter((r) => r.status === "on-leave").length,
    total: records.length,
  };
}

export function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}
