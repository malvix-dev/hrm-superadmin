const STORAGE_KEY = "tm_departments";

export interface Department {
  id: string;
  name: string;
  description: string;
  headName: string;
  headEmployeeId: string;
  createdAt: string;
}

const DEFAULT_DEPARTMENTS: Department[] = [
  "Engineering", "Marketing", "Sales", "HR", "Finance",
  "Operations", "Customer Support", "Design", "Product", "Legal", "IT", "Admin",
].map((name, i) => ({
  id: `dept-${i + 1}`,
  name,
  description: "",
  headName: "",
  headEmployeeId: "",
  createdAt: new Date(2026, 0, 1).toISOString(),
}));

export function getDepartments(): Department[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DEPARTMENTS));
    return DEFAULT_DEPARTMENTS;
  }
  return JSON.parse(data);
}

export function saveDepartment(dept: Department) {
  const all = getDepartments();
  all.push(dept);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function updateDepartment(updated: Department) {
  const all = getDepartments().map((d) => (d.id === updated.id ? updated : d));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteDepartment(id: string) {
  const all = getDepartments().filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
