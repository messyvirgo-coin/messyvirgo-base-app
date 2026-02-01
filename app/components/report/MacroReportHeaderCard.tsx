import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Card, CardHeader } from "@/app/components/ui/card";
import { SignedRangeBar } from "@/app/components/SignedRangeBar";
import { cn, imageUrl } from "@/app/lib/utils";
import { formatTimestamp } from "@/app/lib/format";
import { getMacroVariantLabel } from "@/app/lib/lenses";

export function MacroReportHeaderCard(props: {
  variantCode: string | null;
  executedAt: string | null;
  regimeLabel: string | null;
  regimeImgSrc: string;
  effectiveScore: number | null;
  baseScore: number | null;
  qualitativeAdjustment: number | null;
  baseNote: string;
  adjNote: string;
  verdictTitle: string;
  macroCadence?: "daily" | "weekly";
  onMacroCadenceChange?: (cadence: "daily" | "weekly") => void;
  macroCadenceDisabled?: boolean;
  macroProfileShortLabel?: string | null;
  fullReportHref?: string | null;
  onOpenFullReport?: () => void;
  onBackToBriefing?: () => void;
}) {
  const {
    macroCadence,
    onMacroCadenceChange,
    macroCadenceDisabled = false,
    regimeLabel,
    regimeImgSrc,
    baseScore,
    baseNote,
    qualitativeAdjustment,
    adjNote,
    effectiveScore,
    verdictTitle,
    executedAt,
    variantCode,
    macroProfileShortLabel,
    fullReportHref,
    onOpenFullReport,
    onBackToBriefing,
  } = props;

  const showCadenceToggle =
    typeof macroCadence === "string" &&
    typeof onMacroCadenceChange === "function";
  const isLandingPage = showCadenceToggle;

  const inferredCadence =
    macroCadence ??
    ((variantCode ?? "").toLowerCase().includes("weekly") ? "weekly" : "daily");

  const dashboardTitle = (() => {
    if (!isLandingPage) {
      const variantLabel = getMacroVariantLabel(variantCode);
      if (variantLabel) return variantLabel;
    }
    if (macroProfileShortLabel) {
      const possessive = `${macroProfileShortLabel}'s`;
      return inferredCadence === "weekly"
        ? `${possessive} Weekly Macros`
        : `${possessive} Daily Macros`;
    }
    return inferredCadence === "weekly" ? "Weekly Macros" : "Daily Macros";
  })();

  const dateSubtitle = (() => {
    if (!executedAt) return "";
    if (!isLandingPage) return `as of ${formatTimestamp(executedAt)}`;

    const date = new Date(executedAt);
    if (inferredCadence === "daily") {
      return `for ${date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })}`;
    }

    const base = new Date(date);
    const dayOfWeek = base.getDay();
    const diff = base.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const mondayDate = new Date(base);
    mondayDate.setDate(diff);
    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(sundayDate.getDate() + 6);
    const startStr = mondayDate.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
    });
    const endStr = sundayDate.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    return `${startStr} - ${endStr}`;
  })();

  return (
    <Card className="mv-card !rounded-lg">
      <CardHeader className="!pb-9">
        <div className="space-y-8">
          {showCadenceToggle && (
            <div className="flex items-center justify-center gap-2 sm:gap-4 -mt-2">
              <button
                type="button"
                onClick={() => onMacroCadenceChange?.("daily")}
                disabled={macroCadenceDisabled}
                className={cn(
                  "inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/20 text-muted-foreground hover:text-foreground hover:border-pink-400 hover:bg-pink-400/10 transition-all duration-200 flex-shrink-0",
                  macroCadenceDisabled && "opacity-50 pointer-events-none"
                )}
                aria-label="Daily report"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={() => onMacroCadenceChange?.("daily")}
                disabled={macroCadenceDisabled}
                className={cn(
                  "relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 transition-all duration-200 flex-shrink-0",
                  macroCadence === "daily"
                    ? "border-pink-400 ring-2 ring-pink-400/50 shadow-lg shadow-pink-400/20 scale-105"
                    : "border-white/20 hover:border-pink-300 opacity-70 hover:opacity-100",
                  macroCadenceDisabled && "opacity-50 pointer-events-none"
                )}
                aria-label="Daily report"
                aria-pressed={macroCadence === "daily"}
              >
                <img
                  src={imageUrl("/icons/daily-icon.png")}
                  alt="Daily"
                  className="w-full h-full object-cover"
                />
              </button>

              <button
                type="button"
                onClick={() => onMacroCadenceChange?.("weekly")}
                disabled={macroCadenceDisabled}
                className={cn(
                  "relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 transition-all duration-200 flex-shrink-0",
                  macroCadence === "weekly"
                    ? "border-pink-400 ring-2 ring-pink-400/50 shadow-lg shadow-pink-400/20 scale-105"
                    : "border-white/20 hover:border-pink-300 opacity-70 hover:opacity-100",
                  macroCadenceDisabled && "opacity-50 pointer-events-none"
                )}
                aria-label="Weekly report"
                aria-pressed={macroCadence === "weekly"}
              >
                <img
                  src={imageUrl("/icons/weekly-icon.png")}
                  alt="Weekly"
                  className="w-full h-full object-cover"
                />
              </button>

              <button
                type="button"
                onClick={() => onMacroCadenceChange?.("weekly")}
                disabled={macroCadenceDisabled}
                className={cn(
                  "inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/20 text-muted-foreground hover:text-foreground hover:border-pink-400 hover:bg-pink-400/10 transition-all duration-200 flex-shrink-0",
                  macroCadenceDisabled && "opacity-50 pointer-events-none"
                )}
                aria-label="Weekly report"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-stretch">
            <div className="flex justify-center order-1 md:order-0">
              <div
                className={cn(
                  "relative w-full max-w-[520px] md:max-w-none",
                  "rounded-lg overflow-hidden border border-white/10",
                  "shadow-2xl shadow-pink-400/10 flex-shrink-0 bg-black/30"
                )}
                style={{ aspectRatio: "3/2" }}
              >
                <img
                  src={regimeImgSrc}
                  alt={
                    regimeLabel
                      ? `Macro risk regime ${regimeLabel}`
                      : "Macro risk regime"
                  }
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="space-y-6 order-0 md:order-1">
              <div className="space-y-3 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold font-serif text-pink-400 leading-tight">
                  {dashboardTitle}
                </h3>

                {dateSubtitle && (
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    {dateSubtitle}
                    {isLandingPage && fullReportHref && onOpenFullReport && (
                      <>
                        {" • "}
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-1 text-sm md:text-base",
                            "text-pink-300/80 hover:text-pink-200 underline underline-offset-4",
                            "decoration-pink-400/30 hover:decoration-pink-300/60 transition-colors"
                          )}
                          onClick={onOpenFullReport}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Full Report
                        </button>
                      </>
                    )}
                    {!isLandingPage && onBackToBriefing && (
                      <>
                        {" • "}
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-1 text-sm md:text-base",
                            "text-pink-300/80 hover:text-pink-200 underline underline-offset-4",
                            "decoration-pink-400/30 hover:decoration-pink-300/60 transition-colors"
                          )}
                          onClick={onBackToBriefing}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Back to briefing
                        </button>
                      </>
                    )}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <SignedRangeBar
                  label="Base Score"
                  value={baseScore}
                  note={baseNote}
                  maxAbs={1}
                />
                <SignedRangeBar
                  label="Qualitative Adjustment"
                  value={qualitativeAdjustment}
                  note={adjNote}
                  maxAbs={1}
                />
                <div className="rounded-lg border border-pink-400/30 bg-pink-400/5 p-3 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-3">
                    <div className="text-sm font-semibold text-foreground whitespace-nowrap">
                      Effective Score
                    </div>
                    <div className="text-sm font-semibold text-pink-200 flex flex-wrap items-center gap-1.5">
                      {typeof effectiveScore === "number"
                        ? `${effectiveScore.toFixed(2)} (ES)`
                        : "—"}
                      {typeof effectiveScore === "number" && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="inline-flex items-center rounded-md border border-pink-400/60 bg-pink-400/15 px-2 py-0.5 font-mono text-[11px] text-pink-100 whitespace-nowrap">
                            {regimeLabel ?? "—"}
                          </span>
                          <span className="text-foreground whitespace-nowrap">
                            {verdictTitle}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <SignedRangeBar
                    label=""
                    value={effectiveScore}
                    maxAbs={1}
                    className="!space-y-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
