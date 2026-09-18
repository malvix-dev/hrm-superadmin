const STORAGE_KEY = "tm_designations";

export interface Designation {
  id: string;
  title: string;
  department: string;
  description: string;
  createdAt: string;
}

const DEFAULT_DESIGNATIONS: Designation[] = [
  "CEO", "COO", "CTO", "CFO",
  "General Manager", "Manager", "Assistant Manager",
  "Senior Engineer", "Engineer", "Junior Engineer",
  "Senior Developer", "Developer", "Junior Developer",
  "HR Manager", "HR Executive",
  "Sales Manager", "Sales Executive",
  "Accountant", "Finance Manager",
  "Designer", "Senior Designer",
  "Product Manager", "Project Manager",
  "Receptionist", "Admin Officer",
  "Security Guard", "Driver", "Cleaner", "Cook", "Cook Helper",
].map((title, i) => ({
  id: `desig-${i + 1}`,
  title,
  department: "",
  description: "",
  createdAt: new Date(2026, 0, 1).toISOString(),
}));

export function getDesignations(): Designation[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DESIGNATIONS));
    return DEFAULT_DESIGNATIONS;
  }
  return JSON.parse(data);
}

export function saveDesignation(d: Designation) {
  const all = getDesignations();
  all.push(d);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function updateDesignation(updated: Designation) {
  const all = getDesignations().map((d) => (d.id === updated.id ? updated : d));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteDesignation(id: string) {
  const all = getDesignations().filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
