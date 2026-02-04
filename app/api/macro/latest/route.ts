import { NextResponse } from "next/server";
import {
  DEFAULT_DAILY_MACRO_REPORT_VARIANT_CODE,
  getLatestDailyMacroReport,
} from "@/lib/messyVirgoApiClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const VARIANT_RE = /^[a-zA-Z0-9_-]{1,64}$/;

type CachedValue = {
  report: unknown;
  cachedAtMs: number;
};

const cachedByVariant = new Map<string, CachedValue>();
const inFlightByVariant = new Map<string, Promise<CachedValue>>();

function parseVariant(request: Request):
  | { ok: true; variant: string }
  | { ok: false; error: string } {
  const url = new URL(request.url);
  const raw = url.searchParams.get("variant");
  const trimmed = raw?.trim() ?? "";

  if (!trimmed) {
    return { ok: true, variant: DEFAULT_DAILY_MACRO_REPORT_VARIANT_CODE };
  }

  if (!VARIANT_RE.test(trimmed)) {
    return {
      ok: false,
      error: "Invalid variant. Expected 1-64 characters: letters, numbers, '_' or '-'.",
    };
  }

  return { ok: true, variant: trimmed };
}

export async function GET(request: Request) {
  try {
    const parsed = parseVariant(request);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const variant = parsed.variant;
    const now = Date.now();
    const cachedValue = cachedByVariant.get(variant) ?? null;
    if (cachedValue && now - cachedValue.cachedAtMs < CACHE_TTL_MS) {
      return NextResponse.json(cachedValue.report, {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    }

    let inFlight = inFlightByVariant.get(variant) ?? null;
    if (!inFlight) {
      // Wrap the fetch to capture timestamp once when it completes, not per-request
      inFlight = getLatestDailyMacroReport(variant)
        .then((report) => {
          // Capture timestamp immediately when fetch completes, shared by all concurrent requests
          const cachedAtMs = Date.now();
          const cached: CachedValue = { report, cachedAtMs };
          cachedByVariant.set(variant, cached);
          return cached;
        })
        .finally(() => {
          inFlightByVariant.delete(variant);
        });
      inFlightByVariant.set(variant, inFlight);
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
