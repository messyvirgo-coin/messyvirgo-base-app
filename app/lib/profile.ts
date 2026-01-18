import { useSyncExternalStore } from "react";

export type ProfileId = "degen" | "trader" | "allocator";

type ProfileTrait = { label: string; value: number; note?: string };

export type ProfileDefinition = {
  id: ProfileId;
  label: string;
  shortLabel: string;
  description: string;
  imageSrc: string;
  iconSrc: string;
  traits: readonly ProfileTrait[];
};

const STORAGE_KEY_PREFIX = "mv_profile_id_";
const EVENT_NAME = "mv_profile_changed";
const DEFAULT_PROFILE: ProfileId = "degen";

export const PROFILE_DEFINITIONS: readonly ProfileDefinition[] = [
  {
    id: "degen",
    label: "First-Time Degen",
    shortLabel: "Degen",
    description:
      "Clear, simplified framing to help you make confident decisions.",
    imageSrc: "/profiles/degen.png",
    iconSrc: "/profiles/degen-icon.png",
    traits: [
      { label: "Risk", value: 90, note: "High" },
      { label: "Time Horizon", value: 20, note: "Short" },
      { label: "Diversification", value: 30, note: "Concentrated" },
      { label: "Stop Loss", value: 20, note: "Loose" },
      { label: "DCA", value: 40, note: "Sometimes" },
    ],
  },
  {
    id: "trader",
    label: "Advanced Trader",
    shortLabel: "Trader",
    description:
      "Tactical, market-aware framing for active traders who need timely insights.",
    imageSrc: "/profiles/trader.png",
    iconSrc: "/profiles/trader-icon.png",
    traits: [
      { label: "Risk", value: 65, note: "Calculated" },
      { label: "Time Horizon", value: 45, note: "Medium" },
      { label: "Diversification", value: 55, note: "Balanced" },
      { label: "Stop Loss", value: 70, note: "Strict" },
      { label: "DCA", value: 50, note: "Selective" },
    ],
  },
  {
    id: "allocator",
    label: "Allocator",
    shortLabel: "Allocator",
    description:
      "Risk control and portfolio construction focus for sophisticated allocation strategies.",
    imageSrc: "/profiles/allocator.png",
    iconSrc: "/profiles/allocator-icon.png",
    traits: [
      { label: "Risk", value: 35, note: "Low" },
      { label: "Time Horizon", value: 80, note: "Long" },
      { label: "Diversification", value: 85, note: "Wide" },
      { label: "Stop Loss", value: 60, note: "Managed" },
      { label: "DCA", value: 75, note: "Consistent" },
    ],
  },
] as const;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function getStorageKey(fid: number | null | undefined): string {
  if (!fid) return `${STORAGE_KEY_PREFIX}anonymous`;
  return `${STORAGE_KEY_PREFIX}${fid}`;
}

function parseProfileId(raw: string | null): ProfileId | null {
  if (!raw) return null;
  switch (raw) {
    case "degen":
    case "trader":
    case "allocator":
      return raw;
    default:
      return null;
  }
}

export function getStoredProfileId(
  fid: number | null | undefined
): ProfileId | null {
  if (!isBrowser()) return null;
  try {
    return parseProfileId(window.localStorage.getItem(getStorageKey(fid)));
  } catch {
    return null;
  }
}

export function getEffectiveProfileId(
  fid: number | null | undefined
): ProfileId {
  return getStoredProfileId(fid) ?? DEFAULT_PROFILE;
}

export function setStoredProfileId(
  id: ProfileId,
  fid: number | null | undefined
): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(getStorageKey(fid), id);
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

export function useProfileId(fid: number | null | undefined): ProfileId {
  return useSyncExternalStore(
    subscribe,
    () => getEffectiveProfileId(fid),
    () => DEFAULT_PROFILE
  );
}

export function useHasStoredProfile(fid: number | null | undefined): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getStoredProfileId(fid) !== null,
    () => false
  );
}

export function profileById(id: ProfileId): ProfileDefinition {
  return PROFILE_DEFINITIONS.find((profile) => profile.id === id) ?? PROFILE_DEFINITIONS[0];
}
