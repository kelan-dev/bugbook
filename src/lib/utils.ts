import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNowStrict, formatDate } from "date-fns";

// ################################################################################################

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a date relative to the current time
export function formatDateRelative(date: Date) {
  const now = new Date();

  // Date is within the last 24 hours
  if (now.getTime() - date.getTime() < 24 * 60 * 60 * 1000) {
    return formatDistanceToNowStrict(date, { addSuffix: true });
  }

  // Date is within the current year
  if (now.getFullYear() === date.getFullYear()) {
    return formatDate(date, "MMM d");
  }

  // Date is from another year
  return formatDate(date, "MMM d, yyyy");
}

// Format a number in a compact way
export function formatNumber(number: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(number);
}

// Create a URL-friendly slug from a string
export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
