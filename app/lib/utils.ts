import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function imageUrl(path: string): string {
  return path;
}

export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function normalizeWalletAddress(
  address: string | null | undefined
): string | null {
  if (!address) return null;
  const trimmed = address.trim();
  // Keep this permissive: just normalize case when it looks like an EVM address.
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return trimmed.toLowerCase();
  return trimmed;
}
