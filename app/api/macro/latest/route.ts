import { NextResponse } from "next/server";
import { getLatestDailyMacroReport } from "@/lib/messyVirgoApiClient";
import { getCachedMacroReport, parseVariant } from "@/app/api/macro/_shared";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const parsed = parseVariant(request);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const report = await getCachedMacroReport(parsed.variant, (variant) =>
      getLatestDailyMacroReport(variant)
    );
    return NextResponse.json(report, {
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
