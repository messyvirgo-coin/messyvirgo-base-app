"use client";

import { useMemo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
