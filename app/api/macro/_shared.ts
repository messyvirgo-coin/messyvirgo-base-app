import { DEFAULT_DAILY_MACRO_REPORT_VARIANT_CODE } from "@/lib/messyVirgoApiClient";

const VARIANT_RE = /^[a-zA-Z0-9_-]{1,64}$/;

export function parseVariant(
  request: Request
): { ok: true; variant: string } | { ok: false; error: string } {
  const url = new URL(request.url);
  const raw = url.searchParams.get("variant");
  const trimmed = raw?.trim() ?? "";

  if (!trimmed) {
    return { ok: true, variant: DEFAULT_DAILY_MACRO_REPORT_VARIANT_CODE };
  }

  if (!VARIANT_RE.test(trimmed)) {
    return {
      ok: false,
      error:
        "Invalid variant. Expected 1-64 characters: letters, numbers, '_' or '-'.",
    };
  }

  return { ok: true, variant: trimmed };
}

type CacheEntry<V> = { value: V; cachedAtMs: number };

type BoundedTtlCacheOptions = {
  ttlMs: number;
  maxEntries: number;
};

class BoundedTtlCache<K, V> {
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly map = new Map<K, CacheEntry<V>>();

  constructor({ ttlMs, maxEntries }: BoundedTtlCacheOptions) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  has(key: K) {
    return this.map.has(key);
  }

  size() {
    return this.map.size;
  }

  getFresh(key: K, nowMs = Date.now()): V | null {
    const entry = this.map.get(key) ?? null;
    if (!entry) return null;
    if (nowMs - entry.cachedAtMs >= this.ttlMs) return null;

    // Touch for simple LRU behavior.
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V, nowMs = Date.now()) {
    this.map.set(key, { value, cachedAtMs: nowMs });
    this.prune(nowMs);
    this.evictIfNeeded();
  }

  private prune(nowMs = Date.now()) {
    for (const [key, entry] of this.map.entries()) {
      if (nowMs - entry.cachedAtMs >= this.ttlMs) {
        this.map.delete(key);
      }
    }
  }

  private evictIfNeeded() {
    while (this.map.size > this.maxEntries) {
      const oldestKey = this.map.keys().next().value as K | undefined;
      if (oldestKey === undefined) return;
      this.map.delete(oldestKey);
    }
  }
}

export function createBoundedTtlCache<K, V>(options: BoundedTtlCacheOptions) {
  return new BoundedTtlCache<K, V>(options);
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_ENTRIES = 50;

const reportCache = createBoundedTtlCache<string, unknown>({
  ttlMs: CACHE_TTL_MS,
  maxEntries: MAX_ENTRIES,
});
const inFlightByVariant = new Map<string, Promise<unknown>>();

export async function getCachedMacroReport<V>(
  variant: string,
  fetcher: (variant: string) => Promise<V>
): Promise<V> {
  const fresh = reportCache.getFresh(variant) as V | null;
  if (fresh) return fresh;

  let inFlight = inFlightByVariant.get(variant) ?? null;
  if (!inFlight) {
    inFlight = fetcher(variant)
      .then((report) => {
        reportCache.set(variant, report);
        return report;
      })
      .finally(() => {
        inFlightByVariant.delete(variant);
      });
    inFlightByVariant.set(variant, inFlight);
  }

  return (await inFlight) as V;
}

export function sanitizeDownloadFilename(filename: string) {
  // RFC 6266 header injection hardening.
  const cleaned = filename.replace(/[\r\n"]/g, "").trim();
  return cleaned || "download.md";
}
