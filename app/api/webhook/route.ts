import { NextResponse } from "next/server";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 256 * 1024; // 256KiB

function timingSafeEqualHex(a: string, b: string) {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

function getWebhookSecret() {
  return (
    process.env.MINIKIT_WEBHOOK_SECRET?.trim() ||
    process.env.WEBHOOK_SECRET?.trim() ||
    ""
  );
}

export async function POST(request: Request) {
  // This endpoint is declared in `minikit.config.ts` as `webhookUrl`.
  const requestId = crypto.randomUUID();

  const secret = getWebhookSecret();
  if (!secret) {
    // Safe-by-default: do not accept unauthenticated webhooks.
    return NextResponse.json(
      { ok: false, error: "Webhook is not configured." },
      { status: 501 }
    );
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const length = Number(contentLength);
    if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Payload too large." },
        { status: 413 }
      );
    }
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Payload too large." },
      { status: 413 }
    );
  }

  const providedSignature =
    request.headers.get("x-webhook-signature") ??
    request.headers.get("x-signature") ??
    "";
  const computedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  if (
    !providedSignature ||
    !timingSafeEqualHex(providedSignature, computedSignature)
  ) {
    return NextResponse.json(
      { ok: false, error: "Invalid signature." },
      { status: 401 }
    );
  }

  let payload: unknown = null;
  try {
    payload = rawBody ? (JSON.parse(rawBody) as unknown) : null;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  // Minimal shape validation (extend once you consume events).
  const isObject =
    !!payload && typeof payload === "object" && !Array.isArray(payload);
  if (!isObject) {
    return NextResponse.json(
      { ok: false, error: "Invalid payload shape." },
      { status: 400 }
    );
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("[/api/webhook] received", {
      requestId,
      contentType: request.headers.get("content-type") ?? "",
      keys: Object.keys(payload as Record<string, unknown>).slice(0, 25),
    });
  }

  // Acknowledge receipt. Many webhook providers accept 200/204.
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Method not allowed." },
    { status: 405 }
  );
}
