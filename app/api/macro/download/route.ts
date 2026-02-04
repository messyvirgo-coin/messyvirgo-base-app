import { NextResponse } from "next/server";
import {
  DEFAULT_DAILY_MACRO_REPORT_VARIANT_CODE,
  getLatestDailyMacroReport,
} from "@/lib/messyVirgoApiClient";
import {
  getReportMarkdownArtifact,
  getMarkdownReportText,
} from "@/app/lib/lens-outputs";
import type {
  PublishedMacroReportResponse,
  MarkdownContent,
} from "@/app/lib/report-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const VARIANT_RE = /^[a-zA-Z0-9_-]{1,64}$/;

type CachedValue = {
  report: PublishedMacroReportResponse;
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

function getReportFromCache(variant: string): Promise<PublishedMacroReportResponse> {
  const now = Date.now();
  const cachedValue = cachedByVariant.get(variant) ?? null;
  if (cachedValue && now - cachedValue.cachedAtMs < CACHE_TTL_MS) {
    return Promise.resolve(cachedValue.report);
  }

  let inFlight = inFlightByVariant.get(variant) ?? null;
  if (!inFlight) {
    inFlight = getLatestDailyMacroReport(variant)
      .then((report) => {
        const cachedAtMs = Date.now();
        const cached: CachedValue = {
          report: report as PublishedMacroReportResponse,
          cachedAtMs,
        };
        cachedByVariant.set(variant, cached);
        return cached;
      })
      .finally(() => {
        inFlightByVariant.delete(variant);
      });
    inFlightByVariant.set(variant, inFlight);
  }

  return inFlight.then((cached) => cached.report);
}

function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateFilename(
  report: PublishedMacroReportResponse,
  variant: string
): string {
  // Try to get date from published_at in meta
  let date = new Date();
  if (report.meta?.published_at) {
    const parsedDate = new Date(report.meta.published_at);
    if (!Number.isNaN(parsedDate.getTime())) {
      date = parsedDate;
    }
  }

  const dateStr = formatDateForFilename(date);
  
  // Use different filename patterns based on variant
  if (variant === "default") {
    return `messy-macros-report-${dateStr}.md`;
  }
  
  // Default to market vibe daily for "base_app" and other variants
  return `messy-market-vibe-daily-${dateStr}.md`;
}

function replaceH1InHeader(header: string, variant: string): string {
  const replacementTitle =
    variant === "default"
      ? "Macros Report by $MESSY"
      : "Market Vibes Daily by $MESSY";

  // Replace H1 headings (lines starting with "# ")
  return header.replace(/^#\s+.+$/gm, `# ${replacementTitle}`);
}

function extractMarkdownContent(
  report: PublishedMacroReportResponse,
  variant: string
): string {
  const markdownArtifact = getReportMarkdownArtifact(report.outputs);
  if (!markdownArtifact) {
    throw new Error("No markdown artifact found in report");
  }

  const content = markdownArtifact.content;
  const isStructured =
    !!content &&
    typeof content === "object" &&
    !Array.isArray(content) &&
    ("body" in content || "header" in content || "footer" in content);

  if (isStructured) {
    const structured = content as Partial<MarkdownContent>;
    const parts: string[] = [];

    if (typeof structured.header === "string" && structured.header.trim()) {
      const processedHeader = replaceH1InHeader(
        structured.header.trim(),
        variant
      );
      parts.push(processedHeader);
    }

    if (typeof structured.body === "string" && structured.body.trim()) {
      parts.push(structured.body.trim());
    }

    if (
      typeof structured.annexes === "string" &&
      structured.annexes.trim()
    ) {
      parts.push(structured.annexes.trim());
    }

    if (typeof structured.footer === "string" && structured.footer.trim()) {
      parts.push(structured.footer.trim());
    }

    return parts.join("\n\n");
  }

  // Fallback to full markdown text if not structured
  const markdownText = getMarkdownReportText(report.outputs);
  if (markdownText) {
    // For unstructured content, replace H1 in the entire text
    return replaceH1InHeader(markdownText, variant);
  }

  throw new Error("No markdown content found in report");
}

export async function GET(request: Request) {
  try {
    const parsed = parseVariant(request);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const report = await getReportFromCache(parsed.variant);
    const markdownContent = extractMarkdownContent(report, parsed.variant);
    const filename = generateFilename(report, parsed.variant);

    return new NextResponse(markdownContent, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to generate download file.",
        ...(process.env.NODE_ENV === "production" ? {} : { detail: message }),
      },
      { status: 500 }
    );
  }
}
