import type { PublishedMacroReportResponse } from "@/app/lib/report-types";
import {
  getMarkdownReportText,
  getReportMarkdownArtifact,
} from "./lens-outputs";
import {
  extractMacroRegimeDetails,
  extractMacroRegimeLabel,
  getMacroVerdict,
} from "./macro-economics";

export type MacroShareContent = {
  reportDate: string;
  snippet: string;
};

function formatReportDate(input: string | null): string {
  if (!input) return "today";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "today";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function stripMarkdownToPlainText(input: string): string {
  return (
    input
      // Remove code fences (keep inner text).
      .replace(/```[\s\S]*?```/g, "")
      // Inline code
      .replace(/`([^`]+)`/g, "$1")
      // Images: ![alt](url) -> alt
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      // Links: [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Bold/italic markers
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      // Headings / blockquotes markers
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^>\s+/gm, "")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

function pickFirstMeaningfulParagraph(markdown: string): string | null {
  const cleaned = markdown
    .split("\n")
    // Drop table-ish lines and horizontal rules so we don't share a table row.
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (t === "---" || t === "***" || t === "___") return false;
      if (t.startsWith("|")) return false;
      return true;
    })
    .join("\n")
    .trim();

  const paragraphs = cleaned
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const p of paragraphs) {
    const text = stripMarkdownToPlainText(p);
    // Avoid super-short or non-informational snippets.
    if (text.length >= 40) return text;
  }
  return null;
}

function truncate(input: string, maxChars: number): string {
  if (input.length <= maxChars) return input;
  const sliced = input.slice(0, Math.max(0, maxChars - 1)).trimEnd();
  return `${sliced}…`;
}

export function buildMacroShareContent(
  report: PublishedMacroReportResponse | null
): MacroShareContent {
  if (!report) {
    return {
      reportDate: "today",
      snippet:
        "Daily crypto market intel in ~2 minutes. Tap to see the full report.",
    };
  }

  const artifact = getReportMarkdownArtifact(report.outputs);
  const markdownText = getMarkdownReportText(report.outputs) ?? "";

  const label = extractMacroRegimeLabel(artifact);
  const verdict = getMacroVerdict(label);
  const { effectiveScore } = extractMacroRegimeDetails(artifact);

  const headlineParts = [
    `Regime: ${label ?? "—"}${verdict?.title ? ` ${verdict.title}` : ""}`,
    typeof effectiveScore === "number"
      ? `${effectiveScore.toFixed(2)} ES`
      : null,
  ].filter(Boolean);

  const excerpt = pickFirstMeaningfulParagraph(markdownText);
  const excerptShort = excerpt ? truncate(excerpt, 220) : null;

  const snippet = truncate(
    [headlineParts.join(" • "), excerptShort].filter(Boolean).join("\n"),
    320
  );

  const publishedAt =
    typeof report.meta?.published_at === "string"
      ? report.meta.published_at
      : null;
  const executedAt =
    artifact?.meta &&
    typeof artifact.meta === "object" &&
    !Array.isArray(artifact.meta)
      ? (artifact.meta as Record<string, unknown>).executed_at
      : null;

  const dateSource =
    publishedAt ??
    (typeof executedAt === "string" && executedAt.trim() ? executedAt : null);

  return {
    reportDate: formatReportDate(dateSource),
    snippet,
  };
}
