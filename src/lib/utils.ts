import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// "social_media_manager" → "Social Media Manager"
export function fromSnakeCase(str?: string | null): string {
  if (!str) return "";
  return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format a date string to "01-Jan-2000" format.
 * Accepts ISO strings, "YYYY-MM-DD", or any Date-parseable string.
 * Returns "—" for empty/invalid input.
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr || dateStr === "Pending") return dateStr || "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}
