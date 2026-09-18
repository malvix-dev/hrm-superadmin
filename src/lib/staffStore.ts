export type StaffRole = "super_admin" | "org_owner" | "area_manager" | "branch_manager" | "finance_manager" | "hr_manager";

export const ROLE_LABELS: Record<StaffRole, string> = {
  super_admin:     "Super Admin",
  org_owner:       "Organization Owner",
  area_manager:    "Area Manager",
  branch_manager:  "Branch Manager",
  finance_manager: "Finance Manager",
  hr_manager:      "HR Manager",
};

export const ROLE_COLORS: Record<StaffRole, string> = {
  super_admin:     "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  org_owner:       "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  area_manager:    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  branch_manager:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  finance_manager: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  hr_manager:      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export interface Staff {
  id: string;
  name: string;
  email: string;
  password: string;
  role: StaffRole;
  branchId: string;
  createdAt: string;
  createdBy?: string;
}

const KEY = "tm_staff";
const SESSION_KEY = "tm_current_staff";

export function getStaff(): Staff[] {
  const data = localStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

export function saveStaffMember(s: Staff) {
  const all = getStaff();
  all.push(s);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function updateStaffMember(updated: Staff) {
  const all = getStaff().map(s => s.id === updated.id ? updated : s);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteStaffMember(id: string) {
  const all = getStaff().filter(s => s.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function getCurrentStaff(): Staff | null {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
}

export function logoutStaff() {
  localStorage.removeItem(SESSION_KEY);
}
