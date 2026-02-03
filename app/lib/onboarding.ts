import { useSyncExternalStore } from "react";
import { isBrowser, normalizeWalletAddress } from "@/app/lib/utils";

type LegalAcceptance = {
  termsVersion: string;
  privacyVersion: string;
  acceptedAt: string; // ISO timestamp
};

const STORAGE_KEY_PREFIX = "mv_legal_accepted_";
const EVENT_NAME = "mv_legal_changed";

// Bump these when you materially change legal docs and want to re-prompt.
export const TERMS_VERSION = "v1";
export const PRIVACY_VERSION = "v1";

function getStorageKey(walletAddress: string | null | undefined): string {
  const normalized = normalizeWalletAddress(walletAddress);
  if (!normalized) return `${STORAGE_KEY_PREFIX}anonymous`;
  return `${STORAGE_KEY_PREFIX}${normalized}`;
}

function parseAcceptance(raw: string | null): LegalAcceptance | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<LegalAcceptance> | null;
    if (!data || typeof data !== "object") return null;
    if (typeof data.termsVersion !== "string") return null;
    if (typeof data.privacyVersion !== "string") return null;
    if (typeof data.acceptedAt !== "string") return null;
    return {
      termsVersion: data.termsVersion,
      privacyVersion: data.privacyVersion,
      acceptedAt: data.acceptedAt,
    };
  } catch {
    return null;
  }
}

export function getStoredLegalAcceptance(
  walletAddress: string | null | undefined
): LegalAcceptance | null {
  if (!isBrowser()) return null;
  try {
    const primaryKey = getStorageKey(walletAddress);
    const primaryValue = parseAcceptance(window.localStorage.getItem(primaryKey));
    if (primaryValue) return primaryValue;

    // If wallet is available but no wallet-specific acceptance found,
    // check anonymous key as fallback and migrate it.
    if (walletAddress) {
      const anonymousKey = getStorageKey(null);
      const anonymousValue = parseAcceptance(
        window.localStorage.getItem(anonymousKey)
      );
      if (anonymousValue) {
        window.localStorage.setItem(primaryKey, JSON.stringify(anonymousValue));
        window.dispatchEvent(new Event(EVENT_NAME));
        return anonymousValue;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function hasAcceptedCurrentLegal(
  walletAddress: string | null | undefined
): boolean {
  const acceptance = getStoredLegalAcceptance(walletAddress);
  if (!acceptance) return false;
  return (
    acceptance.termsVersion === TERMS_VERSION &&
    acceptance.privacyVersion === PRIVACY_VERSION
  );
}

export function setAcceptedCurrentLegal(
  walletAddress: string | null | undefined
): boolean {
  if (!isBrowser()) return false;
  try {
    const payload: LegalAcceptance = {
      termsVersion: TERMS_VERSION,
      privacyVersion: PRIVACY_VERSION,
      acceptedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(getStorageKey(walletAddress), JSON.stringify(payload));
    window.dispatchEvent(new Event(EVENT_NAME));
    return true;
  } catch {
    return false;
  }
}

function subscribe(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  const onEvent = () => callback();
  const onStorage = (event: StorageEvent) => {
    if (event.key?.startsWith(STORAGE_KEY_PREFIX)) {
      callback();
    }
  };
  window.addEventListener(EVENT_NAME, onEvent);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, onEvent);
    window.removeEventListener("storage", onStorage);
  };
}

export function useHasAcceptedLegal(
  walletAddress: string | null | undefined
): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hasAcceptedCurrentLegal(walletAddress),
    () => false
  );
}

