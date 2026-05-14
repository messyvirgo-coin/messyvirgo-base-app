import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/messyVirgoApiClient", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/messyVirgoApiClient")
  >("@/lib/messyVirgoApiClient");
  return { ...actual, getLatestDailyMacroReport: vi.fn() };
});

import { getLatestDailyMacroReport } from "@/lib/messyVirgoApiClient";

describe("GET /api/macro/latest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when report kind is unsupported", async () => {
    const { GET } = await import("./route");
    const res = await GET(
      new Request("https://example.com/api/macro/latest?report=base_app", {
        method: "GET",
      })
    );

    expect(res.status).toBe(400);
    expect(getLatestDailyMacroReport).not.toHaveBeenCalled();

    const body = await res.json();
    expect(body).toEqual(
      expect.objectContaining({
        error: expect.any(String),
      })
    );
  });

  it("fetches the requested full report kind", async () => {
    vi.mocked(getLatestDailyMacroReport).mockResolvedValueOnce({
      outputs: [],
      meta: {
        published_at: "2026-02-05T12:34:56.000Z",
        is_stale: false,
      },
    });

    const { GET } = await import("./route");
    const res = await GET(
      new Request("https://example.com/api/macro/latest?report=default", {
        method: "GET",
      })
    );

    expect(res.status).toBe(200);
    expect(getLatestDailyMacroReport).toHaveBeenCalledWith("default");
  });

  it("returns 502 when upstream fetch fails", async () => {
    vi.mocked(getLatestDailyMacroReport).mockRejectedValueOnce(
      new Error("upstream down")
    );

    const { GET } = await import("./route");
    const res = await GET(
      new Request("https://example.com/api/macro/latest?report=daily", {
        method: "GET",
      })
    );

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body).toEqual(
      expect.objectContaining({
        error: "Failed to fetch macro report.",
      })
    );
    // Non-production envs should include debug detail.
    expect(body).toEqual(
      expect.objectContaining({
        detail: "upstream down",
      })
    );
  });
});
