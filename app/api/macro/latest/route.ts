import { NextResponse } from "next/server";
import { getLatestDailyMacroReport } from "@/lib/messyVirgoApiClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

type CachedValue = {
  report: unknown;
  cachedAtMs: number;
};

let cachedLatest: CachedValue | null = null;
let inFlight: Promise<CachedValue> | null = null;

export async function GET(request: Request) {
  try {
    void request; // keep signature stable; request is currently unused
    const now = Date.now();
    if (cachedLatest && now - cachedLatest.cachedAtMs < CACHE_TTL_MS) {
      return NextResponse.json(cachedLatest.report, {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    }

    if (!inFlight) {
      // Wrap the fetch to capture timestamp once when it completes, not per-request
      inFlight = getLatestDailyMacroReport()
        .then((report) => {
          // Capture timestamp immediately when fetch completes, shared by all concurrent requests
          const cachedAtMs = Date.now();
          const cached: CachedValue = { report, cachedAtMs };
          cachedLatest = cached;
          return cached;
        })
        .finally(() => {
          inFlight = null;
        });
    }

    const cached = await inFlight;
    return NextResponse.json(cached.report, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown upstream error";
    return NextResponse.json(
      {
        error: "Failed to fetch macro report.",
        ...(process.env.NODE_ENV === "production" ? {} : { detail: message }),
      },
      { status: 502 }
    );
  }
}
