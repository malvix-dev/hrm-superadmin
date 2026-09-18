export interface Office {
  id: string;
  name: string;
  location: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  managerName: string;
  managerId?: string; // staff id of the branch manager
  status: "active" | "inactive";
  createdAt: string;
}

const STORAGE_KEY = "team_offices";

export function getOffices(): Office[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveOffice(office: Office) {
  const offices = getOffices();
  offices.push(office);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(offices));
}

export function updateOffice(updated: Office) {
  const offices = getOffices().map((o) => (o.id === updated.id ? updated : o));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(offices));
}

export function deleteOffice(id: string) {
  const offices = getOffices().filter((o) => o.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(offices));
}

export function getOfficeById(id: string): Office | undefined {
  return getOffices().find((o) => o.id === id);
}

export const SELECTED_OFFICE_KEY = "selected_office_id";

export function getSelectedOfficeId(): string {
  return localStorage.getItem(SELECTED_OFFICE_KEY) || "all";
}

export function setSelectedOfficeId(id: string) {
  localStorage.setItem(SELECTED_OFFICE_KEY, id);
}
