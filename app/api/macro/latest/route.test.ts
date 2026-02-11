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

  it("returns 400 when variant is invalid", async () => {
    const { GET } = await import("./route");
    const res = await GET(
      new Request("https://example.com/api/macro/latest?variant=bad%0Avalue", {
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

  it("returns 502 when upstream fetch fails", async () => {
    vi.mocked(getLatestDailyMacroReport).mockRejectedValueOnce(
      new Error("upstream down")
    );

    const { GET } = await import("./route");
    const res = await GET(
      new Request("https://example.com/api/macro/latest?variant=base_app", {
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
