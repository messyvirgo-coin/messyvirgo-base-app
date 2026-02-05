import { describe, expect, it } from "vitest";
import {
  createBoundedTtlCache,
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
