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

  it("fetches the daily dashboard report from the canonical public route", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json(reportResponse));

    await getLatestDailyMacroReport("daily");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.messyvirgo.com/api/v1/public/reports/macro/report/daily",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("fetches the full report from the canonical public route", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json(reportResponse));

    await getLatestDailyMacroReport("default");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.messyvirgo.com/api/v1/public/reports/macro/report/default",
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

    await getLatestDailyMacroTwitterPostText("daily");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.messyvirgo.com/api/v1/public/reports/macro/twitter_post/daily",
      expect.objectContaining({ method: "GET" })
    );
  });
});
