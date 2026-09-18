const STORAGE_KEY = "tm_official_leaves";

export type OfficialLeaveType = "religious" | "national" | "event" | "other";

export interface OfficialLeave {
  id: string;
  name: string;
  type: OfficialLeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  description: string;
  createdAt: string;
}

const D = (s: string) => new Date(2026, 0, 1).toISOString(); // placeholder

const DEFAULT: OfficialLeave[] = [
  { id: "ol-1",  name: "Eid ul-Fitr",          type: "religious", startDate: "2026-03-20", endDate: "2026-03-22", description: "End of Ramadan — 3 days",           createdAt: "2026-01-01T00:00:00Z" },
  { id: "ol-2",  name: "Pakistan Day",           type: "national",  startDate: "2026-03-23", endDate: "2026-03-23", description: "Adoption of the first constitution", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ol-3",  name: "Labour Day",             type: "national",  startDate: "2026-05-01", endDate: "2026-05-01", description: "International Workers' Day",         createdAt: "2026-01-01T00:00:00Z" },
  { id: "ol-4",  name: "Eid ul-Adha",            type: "religious", startDate: "2026-05-27", endDate: "2026-05-29", description: "Festival of Sacrifice — 3 days",    createdAt: "2026-01-01T00:00:00Z" },
  { id: "ol-5",  name: "Independence Day",        type: "national",  startDate: "2026-08-14", endDate: "2026-08-14", description: "Pakistan Independence Day",          createdAt: "2026-01-01T00:00:00Z" },
  { id: "ol-6",  name: "Iqbal Day",              type: "national",  startDate: "2026-11-09", endDate: "2026-11-09", description: "Allama Iqbal's Birthday",            createdAt: "2026-01-01T00:00:00Z" },
  { id: "ol-7",  name: "Quaid-e-Azam Day",       type: "national",  startDate: "2026-12-25", endDate: "2026-12-25", description: "Birthday of Quaid-e-Azam",           createdAt: "2026-01-01T00:00:00Z" },
  { id: "ol-8",  name: "Kashmir Solidarity Day",  type: "national",  startDate: "2026-02-05", endDate: "2026-02-05", description: "Stand with Kashmiris",               createdAt: "2026-01-01T00:00:00Z" },
  { id: "ol-9",  name: "Eid Milad un-Nabi",      type: "religious", startDate: "2026-09-25", endDate: "2026-09-25", description: "Prophet's Birthday",                 createdAt: "2026-01-01T00:00:00Z" },
];

export function getOfficialLeaves(): OfficialLeave[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT));
    return DEFAULT;
  }
  return JSON.parse(data);
}

export function saveOfficialLeave(ol: OfficialLeave) {
  const all = getOfficialLeaves();
  all.push(ol);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function updateOfficialLeave(updated: OfficialLeave) {
  const all = getOfficialLeaves().map(o => (o.id === updated.id ? updated : o));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteOfficialLeave(id: string) {
  const all = getOfficialLeaves().filter(o => o.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

/** Expand all official leave ranges into a flat Set of date strings */
export function getOfficialHolidayDates(leaves?: OfficialLeave[]): Set<string> {
  const all = leaves ?? getOfficialLeaves();
  const set = new Set<string>();
  all.forEach(ol => {
    const d = new Date(ol.startDate + "T00:00:00");
    const e = new Date(ol.endDate + "T00:00:00");
    while (d <= e) {
      set.add(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() + 1);
    }
  });
  return set;
}

export const TYPE_COLORS: Record<OfficialLeaveType, string> = {
  religious: "#f59e0b",
  national:  "#10b981",
  event:     "#6366f1",
  other:     "#94a3b8",
};

export const TYPE_LABELS: Record<OfficialLeaveType, string> = {
  religious: "Religious",
  national:  "National",
  event:     "Event",
  other:     "Other",
};
