"use client";

import { PageShell } from "@/app/components/PageShell";
import { ErrorDisplay } from "@/app/components/ErrorDisplay";
import { MacroReportRenderer } from "@/app/components/macro/MacroReportRenderer";
import { LegalAcknowledgementOverlay } from "@/app/components/LegalAcknowledgementOverlay";
import { useLegalAcknowledgement } from "@/app/lib/useLegalAcknowledgement";
import { useMacroReport } from "@/app/lib/useMacroReport";
import {
  AppBootSplash,
  LoadingIndicator,
  StatusMessage,
} from "@/app/components/macro/ReportStatus";

const MACRO_REPORT_CACHE_KEY = "mv_macro_latest_cache_v1";
const MACRO_REPORT_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const REPORT_KIND = "daily";

export default function Home() {
  const {
    mounted,
    hasAcknowledgedLegal,
    legalChecked,
    setLegalChecked,
    canAcknowledge,
    acknowledge,
  } = useLegalAcknowledgement();

  const {
    status: macroStatus,
    error: macroError,
    report: macroReport,
  } = useMacroReport({
    enabled: mounted,
    reportKind: REPORT_KIND,
    cacheKey: MACRO_REPORT_CACHE_KEY,
    ttlMs: MACRO_REPORT_CACHE_TTL_MS,
  });

  const isGateOpen = mounted && hasAcknowledgedLegal;

  return (
    <PageShell mainClassName="gap-8">
      <h1 className="text-5xl font-bold font-serif text-gradient leading-[1.15] text-center -mt-4 md:mt-0">
        Market Vibe Daily
      </h1>

      {!mounted && <AppBootSplash />}

      {isGateOpen && macroStatus === "loading" && (
        <StatusMessage>
          <LoadingIndicator />
        </StatusMessage>
      )}

      {isGateOpen && macroStatus === "error" && (
        <div className="w-full max-w-4xl">
          <ErrorDisplay error={macroError} />
        </div>
      )}

      {isGateOpen && macroStatus === "success" && macroReport?.outputs && (
        <MacroReportRenderer
          outputs={macroReport.outputs}
          reportKind={REPORT_KIND}
        />
      )}

      {isGateOpen && macroStatus === "success" && !macroReport?.outputs && (
        <StatusMessage>
          Report loaded, but no outputs were returned.
        </StatusMessage>
      )}

      <LegalAcknowledgementOverlay
        open={mounted && !hasAcknowledgedLegal}
        legalChecked={legalChecked}
        setLegalChecked={setLegalChecked}
        canAcknowledge={canAcknowledge}
        acknowledge={acknowledge}
      />
    </PageShell>
  );
}
