import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // This endpoint is declared in `minikit.config.ts` as `webhookUrl`.
  // If/when you start consuming webhook events, validate the payload shape here.
  const contentType = request.headers.get("content-type") ?? "";

  if (process.env.NODE_ENV !== "production") {
    try {
      const body =
        contentType.includes("application/json") ? await request.json() : null;
      console.log("[/api/webhook] received", {
        contentType,
        bodyPreview:
          body && typeof body === "object"
            ? Object.keys(body as Record<string, unknown>)
            : body,
      });
    } catch {
      console.log("[/api/webhook] received (unparseable body)", { contentType });
    }
  }

  // Acknowledge receipt. Many webhook providers accept 200/204.
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

