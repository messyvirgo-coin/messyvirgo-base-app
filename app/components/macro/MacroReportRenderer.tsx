"use client";

import { useMemo, useState, useCallback, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Smartphone, ChevronRight } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";

const DEFAULT_VARIANT_CODE = "base_app";

const PROSE_CLASSNAME =
  "prose max-w-none text-sm leading-6 dark:prose-invert prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:text-foreground prose-table:border prose-table:border-collapse prose-table:border-white/15 prose-th:border prose-th:border-white/15 prose-th:bg-white/5 prose-th:p-2 prose-th:text-left prose-th:font-semibold prose-td:border prose-td:border-white/15 prose-td:p-2 prose-td:text-left prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground";

const MARKDOWN_COMPONENTS = {
  table: ({ children }: { children?: ReactNode }) => (
    <div className="overflow-x-auto my-4 mv-scrollbar -mx-4 px-4">
      <table className="min-w-full border-collapse">{children}</table>
    </div>
  ),
  hr: () => <hr className="my-8 border-t border-border dark:border-white/20" />,
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

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      const url = new URL("/api/macro/download", window.location.origin);
      const variantToUse =
        typeof variantCode === "string" && variantCode.trim()
          ? variantCode.trim()
          : DEFAULT_VARIANT_CODE;
      url.searchParams.set("variant", variantToUse);
      const anchor = document.createElement("a");
      anchor.href = url.toString();
      anchor.rel = "noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      window.setTimeout(() => setIsDownloading(false), 600);
    }
  }, [variantCode]);

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

            {/* Mobile alert: encourage download for better viewing */}
            <div className="md:hidden">
              <Alert className="border-primary/20 bg-primary/5 px-5 py-4 [&>svg]:left-5 [&>svg]:top-5 [&>svg~*]:pl-8">
                <Smartphone
                  aria-hidden="true"
                  size={18}
                  className="text-primary"
                />
                <div>
                  <AlertTitle className="text-sm font-semibold">
                    Better on larger screens
                  </AlertTitle>
                  <AlertDescription className="mt-2 text-sm">
                    <p className="mb-3">
                      This report contains detailed tables and data that are
                      best viewed on a desktop or tablet. For the best reading
                      experience, we recommend downloading the report.
                    </p>
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="relative inline-flex h-11 w-full items-center justify-center rounded-md bg-gradient-to-r from-pink-500 to-fuchsia-500 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:from-pink-600 hover:to-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-pink-500 disabled:hover:to-fuchsia-500"
                    >
                      <span>
                        {isDownloading ? "Downloading..." : "Download Report"}
                      </span>
                      <ChevronRight
                        aria-hidden="true"
                        size={20}
                        className="absolute right-5 top-1/2 -translate-y-1/2"
                      />
                    </button>
                  </AlertDescription>
                </div>
              </Alert>
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
