import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getLatestDailyMacroReport,
  getLatestDailyMacroTwitterPostText,
} from "@/lib/messyVirgoApiClient";

const reportResponse = {
  outputs: [],
  meta: { published_at: "2026-02-05T12:34:56.000Z", is_stale: false },
};

describe("Messy Virgo upstream API client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches macro reports from the canonical public route", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json(reportResponse)
    );

    await getLatestDailyMacroReport("base_app");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.messyvirgo.com/api/v1/public/reports/macro/report/base_app",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("fetches macro twitter posts from the canonical public route", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({
        outputs: [
          {
            content: { text: "macro share text" },
          },
        ],
        meta: reportResponse.meta,
      })
    );

    await getLatestDailyMacroTwitterPostText("base_app");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.messyvirgo.com/api/v1/public/reports/macro/twitter_post/base_app",
      expect.objectContaining({ method: "GET" })
    );
  });
});
