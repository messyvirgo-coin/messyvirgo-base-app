import { describe, expect, it, vi } from "vitest";
import {
  createBoundedTtlCache,
  getCachedMacroReport,
  parseVariant,
  sanitizeDownloadFilename,
} from "@/app/api/macro/_shared";

describe("parseVariant", () => {
  it("defaults when missing", () => {
    const request = new Request("https://example.com/api/macro/latest");
    const parsed = parseVariant(request);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.variant).toBeTruthy();
    }
  });

  it("rejects invalid variant", () => {
    const request = new Request(
      "https://example.com/api/macro/latest?variant=bad%0Avalue"
    );
    const parsed = parseVariant(request);
    expect(parsed.ok).toBe(false);
  });
});

describe("BoundedTtlCache eviction", () => {
  it("evicts oldest entries when capacity exceeded", () => {
    const cache = createBoundedTtlCache<string, number>({
      ttlMs: 60_000,
      maxEntries: 2,
    });
    cache.set("a", 1, 0);
    cache.set("b", 2, 0);
    cache.set("c", 3, 0);

    expect(cache.size()).toBe(2);
    expect(cache.has("a")).toBe(false);
    expect(cache.has("b")).toBe(true);
    expect(cache.has("c")).toBe(true);
  });
});

describe("sanitizeDownloadFilename", () => {
  it("removes quotes and newlines", () => {
    expect(sanitizeDownloadFilename('hello"\nworld.md')).toBe("helloworld.md");
  });
});

describe("getCachedMacroReport", () => {
  it("dedupes concurrent in-flight fetches per variant", async () => {
    let resolve: ((value: { ok: true }) => void) | null = null;
    const fetcher = async () =>
      await new Promise<{ ok: true }>((res) => {
        resolve = res;
      });

    const p1 = getCachedMacroReport("variant-concurrent", fetcher);
    const p2 = getCachedMacroReport("variant-concurrent", fetcher);

    expect(resolve).toBeTypeOf("function");
    resolve?.({ ok: true });

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toEqual({ ok: true });
    expect(r2).toEqual({ ok: true });
  });

  it("retries after a failed in-flight fetch", async () => {
    const variant = "variant-failure-then-success";

    await expect(
      getCachedMacroReport(variant, async () => {
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");

    const next = await getCachedMacroReport(variant, async () => ({ ok: true }));
    expect(next).toEqual({ ok: true });
  });

  it("serves cached value within TTL and refetches after TTL", async () => {
    vi.useFakeTimers();

    try {
      const variant = "variant-ttl";

      vi.setSystemTime(new Date("2026-02-05T00:00:00.000Z"));
      const fetcher1 = vi.fn(async () => ({ n: 1 }));
      const v1 = await getCachedMacroReport(variant, fetcher1);
      expect(v1).toEqual({ n: 1 });
      expect(fetcher1).toHaveBeenCalledTimes(1);

      // Within the 1-hour TTL in `_shared.ts`, should be served from cache.
      vi.setSystemTime(new Date("2026-02-05T00:30:00.000Z"));
      const fetcher2 = vi.fn(async () => ({ n: 2 }));
      const v2 = await getCachedMacroReport(variant, fetcher2);
      expect(v2).toEqual({ n: 1 });
      expect(fetcher2).toHaveBeenCalledTimes(0);

      // Beyond TTL, should refetch.
      vi.setSystemTime(new Date("2026-02-05T02:00:00.000Z"));
      const fetcher3 = vi.fn(async () => ({ n: 3 }));
      const v3 = await getCachedMacroReport(variant, fetcher3);
      expect(v3).toEqual({ n: 3 });
      expect(fetcher3).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
