export interface HostelProfile {
  hostelName: string;
  hostelLogo: string;
  managerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  website: string;
  currency: string;
  timezone: string;
  password: string;
}

const PROFILE_KEY = "hostel_manager_profile";

const DEFAULT_PROFILE: HostelProfile = {
  hostelName: "Hostel Manager",
  hostelLogo: "",
  managerName: "Admin",
  email: "admin@hostelmanager.com",
  phone: "+92 300 1234567",
  address: "123 Main Street",
  city: "Lahore",
  state: "Punjab",
  country: "Pakistan",
  website: "",
  currency: "PKR",
  timezone: "Asia/Karachi",
  password: "admin123",
};

export function getProfile(): HostelProfile {
  const data = localStorage.getItem(PROFILE_KEY);
  return data ? { ...DEFAULT_PROFILE, ...JSON.parse(data) } : DEFAULT_PROFILE;
}

export function saveProfile(profile: HostelProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export interface CommissionSettings {
  usdPerLot: number;
  pkrPerUsd: number;
}

const COMMISSION_KEY = "hostel_commission_settings";
const DEFAULT_COMMISSION: CommissionSettings = { usdPerLot: 10, pkrPerUsd: 278 };

export function getCommissionSettings(): CommissionSettings {
  const data = localStorage.getItem(COMMISSION_KEY);
  return data ? { ...DEFAULT_COMMISSION, ...JSON.parse(data) } : DEFAULT_COMMISSION;
}

export function saveCommissionSettings(s: CommissionSettings) {
  localStorage.setItem(COMMISSION_KEY, JSON.stringify(s));
}

export function calcCommissionFromLots(lots: number): number {
  const { usdPerLot, pkrPerUsd } = getCommissionSettings();
  return lots * usdPerLot * pkrPerUsd;
}
