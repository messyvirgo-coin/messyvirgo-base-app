"use client";

import { useMemo, useCallback, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download } from "lucide-react";
import { MacroReportHeaderCard } from "@/app/components/report/MacroReportHeaderCard";
import {
  extractMacroRegimeDetails,
  extractMacroRegimeLabel,
  getMacroVerdict,
  macroRegimeImageSrc,
} from "@/app/lib/macro-economics";
import {
  getMarkdownReportText,
  getReportMarkdownArtifact,
} from "@/app/lib/lens-outputs";
import type { LensOutputArtifact } from "@/app/lib/report-types";

const PROSE_CLASSNAME =
  "prose max-w-none text-sm leading-6 dark:prose-invert prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:text-foreground prose-table:w-full prose-table:border prose-table:border-collapse prose-table:border-white/15 prose-th:border prose-th:border-white/15 prose-th:bg-white/5 prose-th:p-2 prose-th:text-left prose-th:font-semibold prose-td:border prose-td:border-white/15 prose-td:p-2 prose-td:text-left prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground";

const MARKDOWN_COMPONENTS = {
  table: ({ children }: { children?: ReactNode }) => (
    <div className="overflow-x-auto my-4 mv-scrollbar">
      <table className="w-full border-collapse">{children}</table>
    </div>
  ),
  hr: () => (
    <hr className="my-8 border-t border-border dark:border-white/20" />
  ),
};

const FOOTER_PROSE_CLASSNAME = `${PROSE_CLASSNAME} text-xs text-muted-foreground`;

function removeHeaderSection(markdown: string): string {
  const lines = markdown.split("\n");
  let headerEndIndex = -1;
  let horizontalRuleCount = 0;
  let foundTitle = false;

  for (let i = 0; i < lines.length && i <= 120; i++) {
    const trimmed = lines[i].trim();
    if (!foundTitle && /^#\s+.+/.test(trimmed)) foundTitle = true;
    if (trimmed === "---") {
      horizontalRuleCount++;
      if (horizontalRuleCount === 2 && foundTitle && headerEndIndex === -1) {
        headerEndIndex = i + 1;
        break;
      }
    }
  }

  if (headerEndIndex >= 0) {
    return lines.slice(headerEndIndex).join("\n").trim();
  }

  return markdown.trim();
}

export function MacroReportRenderer({
  outputs,
  variantCode,
  macroProfileShortLabel,
  macroCadence,
  onMacroCadenceChange,
  macroCadenceDisabled,
}: {
  outputs: LensOutputArtifact[];
  variantCode: string | null;
  macroProfileShortLabel?: string | null;
  macroCadence?: "daily" | "weekly";
  onMacroCadenceChange?: (cadence: "daily" | "weekly") => void;
  macroCadenceDisabled?: boolean;
}) {
  const markdownArtifact = getReportMarkdownArtifact(outputs);
  const markdownContent = getMarkdownReportText(outputs);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    let downloadUrl: string | null = null;
    let anchor: HTMLAnchorElement | null = null;
    let didTriggerDownload = false;
    try {
      const url = new URL("/api/macro/download", window.location.origin);
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error("Failed to download report");
      }

      const blob = await response.blob();
      downloadUrl = window.URL.createObjectURL(blob);
      anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] ?? "messy-market-vibe-daily.md";
      document.body.appendChild(anchor);

      anchor.click();
      didTriggerDownload = true;
    } catch (error) {
      console.error("Download failed:", error);
      // You could add a toast notification here if desired
    } finally {
      // Ensure DOM + blob URL cleanup even if an error happens mid-flow.
      try {
        anchor?.remove();
      } catch {
        // No-op
      }

      if (downloadUrl) {
        if (didTriggerDownload) {
          // Don't revoke immediately after click—downloads are processed async in many browsers.
          // Use a time-based cleanup so it runs even if programmatic clicks don't invoke handlers
          // in a given embedded browser/webview.
          const urlToRevoke = downloadUrl;
          window.setTimeout(() => {
            window.URL.revokeObjectURL(urlToRevoke);
          }, 10_000);
        } else {
          // If we never triggered the download, revoke immediately to avoid leaking.
          window.URL.revokeObjectURL(downloadUrl);
        }
      }

      setIsDownloading(false);
    }
  }, []);

  const { bodyMarkdown, annexesMarkdown, footerMarkdown } = useMemo(() => {
    if (!markdownArtifact)
      return {
        bodyMarkdown: null,
        annexesMarkdown: null,
        footerMarkdown: null,
      };

    const content = markdownArtifact.content;
    const isStructured =
      !!content &&
      typeof content === "object" &&
      !Array.isArray(content) &&
      "body" in content;

    if (isStructured) {
      const structured = content as {
        body?: string;
        annexes?: string;
        footer?: string;
      };
      const body =
        typeof structured.body === "string" ? structured.body.trim() : "";
      const annexes =
        typeof structured.annexes === "string" ? structured.annexes.trim() : "";
      const footer =
        typeof structured.footer === "string" ? structured.footer.trim() : "";

      return {
        bodyMarkdown: body || null,
        annexesMarkdown: annexes || null,
        footerMarkdown: footer || null,
      };
    }

    const processed = removeHeaderSection(markdownContent || "");
    return {
      bodyMarkdown: processed || null,
      annexesMarkdown: null,
      footerMarkdown: null,
    };
  }, [markdownArtifact, markdownContent]);

  if (!markdownContent || !markdownArtifact) {
    return (
      <div className="w-full max-w-4xl mx-auto rounded-lg border border-input bg-background p-6 text-center text-muted-foreground">
        No output artifacts available.
      </div>
    );
  }

  const regimeLabel = extractMacroRegimeLabel(markdownArtifact);
  const regimeImgSrc = macroRegimeImageSrc(regimeLabel);
  const { effectiveScore, baseScore, qualitativeAdjustment } =
    extractMacroRegimeDetails(markdownArtifact);
  const verdict = getMacroVerdict(regimeLabel);
  const executedAt =
    typeof markdownArtifact?.meta?.executed_at === "string"
      ? markdownArtifact?.meta?.executed_at
      : null;

  const verdictTitle = verdict?.title ?? "—";
  const baseNote =
    typeof baseScore === "number"
      ? `${baseScore >= 0 ? "+" : ""}${baseScore.toFixed(2)} (BS) • ${verdictTitle}`
      : "—";
  const adjNote =
    typeof qualitativeAdjustment === "number"
      ? `${qualitativeAdjustment >= 0 ? "+" : ""}${qualitativeAdjustment.toFixed(2)} (QA)`
      : "—";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="space-y-4">
        {bodyMarkdown || annexesMarkdown || footerMarkdown ? (
          <>
            <div className="-mt-4 md:mt-8">
              <MacroReportHeaderCard
              variantCode={variantCode}
              executedAt={executedAt}
              regimeLabel={regimeLabel}
              regimeImgSrc={regimeImgSrc}
              effectiveScore={
                typeof effectiveScore === "number" ? effectiveScore : null
              }
              baseScore={typeof baseScore === "number" ? baseScore : null}
              qualitativeAdjustment={
                typeof qualitativeAdjustment === "number"
                  ? qualitativeAdjustment
                  : null
              }
              baseNote={baseNote}
              adjNote={adjNote}
              verdictTitle={verdictTitle}
              macroCadence={macroCadence}
              onMacroCadenceChange={onMacroCadenceChange}
              macroCadenceDisabled={macroCadenceDisabled}
              macroProfileShortLabel={macroProfileShortLabel ?? null}
            />
            </div>

            <div className="flex justify-end -mt-2 mb-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-pink-400/30 bg-pink-400/10 text-sm font-medium text-foreground hover:bg-pink-400/20 hover:border-pink-400/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Download report as markdown"
              >
                <Download className="h-4 w-4" />
                {isDownloading ? "Downloading..." : "Download"}
              </button>
            </div>

            <div>
              <div className={PROSE_CLASSNAME}>
                {bodyMarkdown && (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={MARKDOWN_COMPONENTS}
                  >
                    {bodyMarkdown}
                  </ReactMarkdown>
                )}

                {annexesMarkdown && (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={MARKDOWN_COMPONENTS}
                  >
                    {annexesMarkdown}
                  </ReactMarkdown>
                )}
              </div>

              {footerMarkdown && (
                <div className={FOOTER_PROSE_CLASSNAME}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={MARKDOWN_COMPONENTS}
                  >
                    {footerMarkdown}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            Markdown artifact not available.
          </div>
        )}
      </div>
    </div>
  );
}
