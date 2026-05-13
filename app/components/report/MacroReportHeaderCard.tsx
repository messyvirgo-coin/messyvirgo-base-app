import Image from "next/image";
import { ScoreRangeBar } from "@/app/components/ScoreRangeBar";
import { SignedRangeBar } from "@/app/components/SignedRangeBar";
import { cn } from "@/app/lib/utils";
import { formatTimestamp } from "@/app/lib/format";

export function MacroReportHeaderCard(props: {
  executedAt: string | null;
  regimeLabel: string | null;
  regimeImgSrc: string;
  effectiveScore: number | null;
  baseScore: number | null;
  qualitativeAdjustment: number | null;
  baseNote: string;
  adjNote: string;
  /** Shown under the effective score bar (e.g. "60.00 / 100"). */
  effectiveNote?: string;
  verdictTitle: string;
}) {
  const {
    regimeLabel,
    regimeImgSrc,
    baseScore,
    baseNote,
    qualitativeAdjustment,
    adjNote,
    effectiveScore,
    effectiveNote,
    verdictTitle,
    executedAt,
  } = props;

  const dateSubtitle = (() => {
    if (!executedAt) return "";
    return `as of ${formatTimestamp(executedAt)}`;
  })();

  return (
    <div>
      <div className="pb-9">
        <div className="space-y-8 -mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-stretch">
            <div className="flex justify-center order-1 md:order-0">
              <div
                className={cn(
                  "relative w-full max-w-[520px] md:max-w-none",
                  "rounded-lg overflow-hidden border border-white/10",
                  "shadow-2xl shadow-pink-400/10 flex-shrink-0 bg-black/30"
                )}
                style={{ aspectRatio: "3/2" }}
              >
                <Image
                  src={regimeImgSrc}
                  alt={
                    regimeLabel
                      ? `Macro risk regime ${regimeLabel}`
                      : "Macro risk regime"
                  }
                  fill
                  sizes="(min-width: 768px) 520px, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            <div className="space-y-6 order-0 md:order-1 mb-4 md:mb-0">
              <div className="space-y-2 text-center md:text-left">
                {dateSubtitle && (
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    {dateSubtitle}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <ScoreRangeBar
                  label="Base Score"
                  value={baseScore}
                  note={baseNote}
                />
                <SignedRangeBar
                  label="Qualitative Adjustment"
                  value={qualitativeAdjustment}
                  note={adjNote}
                  maxAbs={25}
                />
                <div className="rounded-lg border border-pink-400/30 bg-pink-400/5 p-3 space-y-2 mb-3 md:mb-0">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-3">
                    <div className="text-sm font-semibold text-foreground whitespace-nowrap">
                      Effective Score
                    </div>
                    <div className="text-sm font-semibold text-foreground flex flex-wrap items-center gap-1.5">
                      {typeof effectiveScore === "number" ? (
                        <>
                          <span className="inline-flex items-center rounded-md border border-pink-400/60 bg-pink-400/15 px-2 py-0.5 font-mono text-[11px] text-foreground whitespace-nowrap">
                            {regimeLabel ?? "—"}
                          </span>
                          <span className="text-foreground whitespace-nowrap">
                            {verdictTitle}
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                  <ScoreRangeBar
                    label=""
                    value={effectiveScore}
                    note={
                      typeof effectiveScore === "number"
                        ? effectiveNote
                        : undefined
                    }
                    notePlacement="below"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
