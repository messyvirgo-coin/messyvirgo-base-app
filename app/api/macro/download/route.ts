import { NextResponse } from "next/server";
import { getLatestDailyMacroReport } from "@/lib/messyVirgoApiClient";
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

type CachedValue = {
  report: PublishedMacroReportResponse;
  cachedAtMs: number;
};

let cachedLatest: CachedValue | null = null;
let inFlight: Promise<CachedValue> | null = null;

function getReportFromCache(): Promise<PublishedMacroReportResponse> {
  const now = Date.now();
  if (cachedLatest && now - cachedLatest.cachedAtMs < CACHE_TTL_MS) {
    return Promise.resolve(cachedLatest.report);
  }

  if (!inFlight) {
    inFlight = getLatestDailyMacroReport()
      .then((report) => {
        const cachedAtMs = Date.now();
        const cached: CachedValue = {
          report: report as PublishedMacroReportResponse,
          cachedAtMs,
        };
        cachedLatest = cached;
        return cached;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  return inFlight.then((cached) => cached.report);
}

function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateFilename(report: PublishedMacroReportResponse): string {
  // Try to get date from published_at in meta
  let date = new Date();
  if (report.meta?.published_at) {
    const parsedDate = new Date(report.meta.published_at);
    if (!Number.isNaN(parsedDate.getTime())) {
      date = parsedDate;
    }
  }

  const dateStr = formatDateForFilename(date);
  return `messy-market-vibe-daily-${dateStr}.md`;
}

function extractMarkdownContent(
  report: PublishedMacroReportResponse
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
      parts.push(structured.header.trim());
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
    return markdownText;
  }

  throw new Error("No markdown content found in report");
}

export async function GET(request: Request) {
  try {
    void request; // keep signature stable; request is currently unused

    const report = await getReportFromCache();
    const markdownContent = extractMarkdownContent(report);
    const filename = generateFilename(report);

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
