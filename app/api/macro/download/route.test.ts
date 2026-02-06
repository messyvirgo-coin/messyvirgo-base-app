import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublishedMacroReportResponse } from "@/app/lib/report-types";

vi.mock("@/lib/messyVirgoApiClient", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/messyVirgoApiClient")>(
      "@/lib/messyVirgoApiClient"
    );
  return { ...actual, getLatestDailyMacroReport: vi.fn() };
});

import { getLatestDailyMacroReport } from "@/lib/messyVirgoApiClient";

describe("GET /api/macro/download", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns markdown with a safe download filename and replaced H1", async () => {
    const fakeReport: PublishedMacroReportResponse = {
      meta: { published_at: "2026-02-05T12:34:56.000Z", is_stale: false },
      outputs: [
        {
          kind: "markdown",
          artifact_type: "report",
          content: {
            header: "# Original Title",
            body: "Body",
            footer: "Footer",
          },
          content_type: "text/markdown",
        },
      ],
    };

    vi.mocked(getLatestDailyMacroReport).mockResolvedValueOnce(fakeReport);

    const { GET } = await import("./route");
    const res = await GET(
      new Request("https://example.com/api/macro/download?variant=base_app", {
        method: "GET",
      })
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/markdown");

    const disposition = res.headers.get("Content-Disposition") ?? "";
    expect(disposition).toContain("attachment;");
    expect(disposition).toMatch(/filename="[^"\r\n]+\.md"/);

    const text = await res.text();
    expect(text).toContain("# Market Vibes Daily by $MESSY");
    expect(text).toContain("Body");
    expect(text).toContain("Footer");
  });
});

