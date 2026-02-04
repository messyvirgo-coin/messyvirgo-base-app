"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { PageShell } from "@/app/components/PageShell";
import { ErrorDisplay } from "@/app/components/ErrorDisplay";
import { MacroReportRenderer } from "@/app/components/macro/MacroReportRenderer";
import { LegalAcknowledgementOverlay } from "@/app/components/LegalAcknowledgementOverlay";
import type { PublishedMacroReportResponse } from "@/app/lib/report-types";
import { useLegalAcknowledgement } from "@/app/lib/useLegalAcknowledgement";

type MacroStatus = "idle" | "loading" | "success" | "error";

const MACRO_REPORT_CACHE_KEY = "mv_macro_default_cache_v1";
const MACRO_REPORT_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const REPORT_VARIANT_CODE = "default";

function StatusMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-4xl">
      <div
        className="mv-card rounded-lg border border-input bg-black/40 overflow-hidden p-6 sm:p-8 text-center text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        {children}
      </div>
    </div>
  );
}

function LoadingIndicator({ label = "Loading report…" }: { label?: string }) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex items-center gap-3 text-sm">
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground/70"
          aria-hidden="true"
        />
        <span>{label}</span>
      </div>

      <div
        className="h-2 w-full max-w-md overflow-hidden rounded-full bg-border/30"
        role="progressbar"
        aria-label="Loading"
        aria-valuetext="Loading"
      >
        <div className="h-full w-2/3 animate-pulse rounded-full bg-linear-to-r from-pink-400 via-fuchsia-400 to-violet-400" />
      </div>
    </div>
  );
}

export default function FullReportPage() {
  const [macroStatus, setMacroStatus] = useState<MacroStatus>("idle");
  const [macroError, setMacroError] = useState<Error | null>(null);
  const [macroReport, setMacroReport] =
    useState<PublishedMacroReportResponse | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const {
    mounted,
    hasAcknowledgedLegal,
    legalChecked,
    setLegalChecked,
    canAcknowledge,
    acknowledge,
  } = useLegalAcknowledgement();

  const loadCachedMacroReport = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(MACRO_REPORT_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        cachedAtMs?: unknown;
        report?: unknown;
      };

      if (typeof parsed?.cachedAtMs !== "number") return null;
      if (!parsed.report) return null;

      const ageMs = Date.now() - parsed.cachedAtMs;
      if (ageMs < 0 || ageMs > MACRO_REPORT_CACHE_TTL_MS) return null;

      return parsed.report as PublishedMacroReportResponse;
    } catch {
      return null;
    }
  }, []);

  const persistCachedMacroReport = useCallback(
    (report: PublishedMacroReportResponse) => {
      try {
        window.localStorage.setItem(
          MACRO_REPORT_CACHE_KEY,
          JSON.stringify({ cachedAtMs: Date.now(), report })
        );
      } catch {
        // Non-fatal: caching is best-effort.
      }
    },
    []
  );

  const fetchMacroReport = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setMacroStatus("loading");
    setMacroError(null);
    setMacroReport(null);

    try {
      const url = new URL("/api/macro/latest", window.location.origin);
      url.searchParams.set("variant", REPORT_VARIANT_CODE);
      const response = await fetch(url.toString(), {
        signal: controller.signal,
      });
      if (abortRef.current !== controller) {
        return;
      }
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const detail =
          typeof errorBody?.error === "string"
            ? errorBody.error
            : "Unknown error";
        throw new Error(detail);
      }

      const report = (await response.json()) as PublishedMacroReportResponse;
      if (abortRef.current !== controller) {
        return;
      }
      setMacroReport(report);
      setMacroStatus("success");
      persistCachedMacroReport(report);
    } catch (fetchError) {
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        return;
      }
      if (abortRef.current !== controller) {
        return;
      }
      setMacroError(
        fetchError instanceof Error ? fetchError : new Error("Unknown error")
      );
      setMacroStatus("error");
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [persistCachedMacroReport]);

  useEffect(() => {
    if (!mounted) return;
    // Start loading the report immediately, even while overlay is displayed.
    // Prefer a fresh cached report to avoid re-fetching the same daily payload.
    const cached = loadCachedMacroReport();
    if (cached) {
      setMacroError(null);
      setMacroReport(cached);
      setMacroStatus("success");
      return () => {
        abortRef.current?.abort();
      };
    }

    void fetchMacroReport();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchMacroReport, loadCachedMacroReport, mounted]);

  const isGateOpen = mounted && hasAcknowledgedLegal;

  return (
    <PageShell mainClassName="gap-8">
      <h1 className="text-5xl font-bold font-serif text-gradient leading-[1.15] text-center -mt-4 md:mt-0">
        Full market report
      </h1>

      {!mounted && (
        <div
          className="flex w-full flex-col items-center justify-center gap-3 py-10 text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Image
            src="/logo.svg"
            alt="Messy logo"
            width={64}
            height={64}
            priority
            style={{ objectFit: "contain" }}
          />
          <div>Loading...</div>
        </div>
      )}

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
          variantCode={REPORT_VARIANT_CODE}
          macroProfileShortLabel={null}
          macroCadence="daily"
          macroCadenceDisabled={true}
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

