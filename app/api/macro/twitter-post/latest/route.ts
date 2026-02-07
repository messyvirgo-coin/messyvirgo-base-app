import { NextResponse } from "next/server";
import { getLatestDailyMacroTwitterPostText } from "@/lib/messyVirgoApiClient";
import {
  getCachedMacroTwitterPostText,
  parseVariant,
  sanitizeTwitterPostText,
} from "@/app/api/macro/_shared";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const parsed = parseVariant(request);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const text = await getCachedMacroTwitterPostText(parsed.variant, (variant) =>
      getLatestDailyMacroTwitterPostText(variant)
    );

    return NextResponse.json(
      { text: sanitizeTwitterPostText(text) },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown upstream error";
    return NextResponse.json(
      {
        error: "Failed to fetch twitter post text.",
        ...(process.env.NODE_ENV === "production" ? {} : { detail: message }),
      },
      { status: 502 }
    );
  }
}
