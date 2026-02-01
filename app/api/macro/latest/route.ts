import { NextResponse } from "next/server";
import {
  getLatestDailyMacroReport,
  type MacroProfile,
} from "@/lib/messyVirgoApiClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isMacroProfile(value: string | null): value is MacroProfile {
  return value === "degen" || value === "trader" || value === "allocator";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profile = searchParams.get("profile");

  if (!isMacroProfile(profile)) {
    return NextResponse.json(
      { error: "Invalid profile. Use degen, trader, or allocator." },
      { status: 400 }
    );
  }

  try {
    const report = await getLatestDailyMacroReport(profile);
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
