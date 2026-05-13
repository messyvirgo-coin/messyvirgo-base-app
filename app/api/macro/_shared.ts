import {
  DEFAULT_MACRO_REPORT_KIND,
  isMacroReportKind,
  type MacroReportKind,
} from "@/app/lib/macro-report-kind";

export function parseReportKind(
  request: Request
): { ok: true; reportKind: MacroReportKind } | { ok: false; error: string } {
  const url = new URL(request.url);
  const legacyVariant = url.searchParams.get("variant");
  if (legacyVariant !== null) {
    return {
      ok: false,
      error: "Invalid query parameter. Use 'report' instead of 'variant'.",
    };
  }

  const raw = url.searchParams.get("report");
  const trimmed = raw?.trim() ?? "";

  if (!trimmed) {
    return { ok: true, reportKind: DEFAULT_MACRO_REPORT_KIND };
  }

  if (isMacroReportKind(trimmed)) {
    return { ok: true, reportKind: trimmed };
  }

  return {
    ok: false,
    error: "Invalid report. Expected 'daily' or 'default'.",
  };
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
const inFlightByReportKind = new Map<string, Promise<unknown>>();

export async function getCachedMacroReport<K extends string, V>(
  reportKind: K,
  fetcher: (reportKind: K) => Promise<V>
): Promise<V> {
  const fresh = reportCache.getFresh(reportKind) as V | null;
  if (fresh) return fresh;

  let inFlight = inFlightByReportKind.get(reportKind) ?? null;
  if (!inFlight) {
    inFlight = fetcher(reportKind)
      .then((report) => {
        reportCache.set(reportKind, report);
        return report;
      })
      .finally(() => {
        inFlightByReportKind.delete(reportKind);
      });
    inFlightByReportKind.set(reportKind, inFlight);
  }

  return (await inFlight) as V;
}

const twitterPostTextCache = createBoundedTtlCache<string, unknown>({
  ttlMs: CACHE_TTL_MS,
  maxEntries: MAX_ENTRIES,
});
const inFlightTwitterPostByReportKind = new Map<string, Promise<unknown>>();

export async function getCachedMacroTwitterPostText<K extends string, V>(
  reportKind: K,
  fetcher: (reportKind: K) => Promise<V>
): Promise<V> {
  const fresh = twitterPostTextCache.getFresh(reportKind) as V | null;
  if (fresh) return fresh;

  let inFlight = inFlightTwitterPostByReportKind.get(reportKind) ?? null;
  if (!inFlight) {
    inFlight = fetcher(reportKind)
      .then((text) => {
        twitterPostTextCache.set(reportKind, text);
        return text;
      })
      .finally(() => {
        inFlightTwitterPostByReportKind.delete(reportKind);
      });
    inFlightTwitterPostByReportKind.set(reportKind, inFlight);
  }

  return (await inFlight) as V;
}

export function sanitizeTwitterPostText(input: string) {
  // Prevent absurd payloads from overloading share compositors / storage.
  const trimmed = input.trim();
  return trimmed.length > 10_000 ? trimmed.slice(0, 10_000) : trimmed;
}

export function sanitizeDownloadFilename(filename: string) {
  // RFC 6266 header injection hardening.
  const cleaned = filename.replace(/[\r\n"]/g, "").trim();
  return cleaned || "download.md";
}
