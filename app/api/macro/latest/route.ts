import { NextResponse } from "next/server";
import { getLatestDailyMacroReport } from "@/lib/messyVirgoApiClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    void request; // keep signature stable; request is currently unused
    const report = await getLatestDailyMacroReport();
    return NextResponse.json(report, {
      headers: {
        // Avoid proxy/browser caching surprises for "latest" endpoints.
        "Cache-Control": "no-store",
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
