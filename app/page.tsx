"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/app/components/PageShell";
import { ErrorDisplay } from "@/app/components/ErrorDisplay";
import { MacroReportRenderer } from "@/app/components/macro/MacroReportRenderer";
import type { PublishedMacroReportResponse } from "@/app/lib/report-types";

type MacroStatus = "idle" | "loading" | "success" | "error";

const LEGAL_ACK_STORAGE_KEY = "mv_legal_ack_v1";
const MACRO_REPORT_CACHE_KEY = "mv_macro_latest_cache_v1";
const MACRO_REPORT_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

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
        <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-pink-400 via-fuchsia-400 to-violet-400" />
      </div>
    </div>
  );
}

export default function Home() {
  const [macroStatus, setMacroStatus] = useState<MacroStatus>("idle");
  const [macroError, setMacroError] = useState<Error | null>(null);
  const [macroReport, setMacroReport] =
    useState<PublishedMacroReportResponse | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [mounted, setMounted] = useState(false);
  const [hasAcknowledgedLegal, setHasAcknowledgedLegal] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const stored = window.localStorage.getItem(LEGAL_ACK_STORAGE_KEY);
      if (stored === "true") {
        setHasAcknowledgedLegal(true);
      }
    } catch {
      // If storage is unavailable/blocked, keep overlay visible.
    }
  }, [mounted]);

  const fetchMacroReport = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setMacroStatus("loading");
    setMacroError(null);
    setMacroReport(null);

    try {
      const url = new URL("/api/macro/latest", window.location.origin);
      url.searchParams.set("variant", "base_app");
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

  const reportVariantCode = useMemo(() => "base_app", []);

  const dashboardTitle = useMemo(() => {
    void reportVariantCode;
    return "Market Vibe Daily";
  }, [reportVariantCode]);

  const isGateOpen = mounted && hasAcknowledgedLegal;
  const canAcknowledge = termsChecked && privacyChecked;

  const acknowledge = useCallback(() => {
    if (!canAcknowledge) return;
    try {
      window.localStorage.setItem(LEGAL_ACK_STORAGE_KEY, "true");
      setHasAcknowledgedLegal(true);
    } catch {
      // If storage fails, still allow access for this session.
      setHasAcknowledgedLegal(true);
    }
  }, [canAcknowledge]);

  return (
    <PageShell mainClassName="gap-8">
      {dashboardTitle && (
        <h1 className="text-5xl font-bold font-serif text-gradient leading-[1.15] text-center -mt-4 md:mt-0">
          {dashboardTitle}
        </h1>
      )}

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
          variantCode={reportVariantCode}
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

      {mounted && !hasAcknowledgedLegal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Terms and privacy acknowledgement"
        >
          <div className="absolute inset-0 bg-black/80 mv-backdrop-blur-xl" />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border mv-glass-modal-surface mv-backdrop-blur-md shadow-2xl">
            <div className="bg-gradient-to-br from-fuchsia-500/10 via-transparent to-cyan-500/10 p-6 sm:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-6">
                <div className="relative w-full shrink-0 overflow-hidden rounded-2xl bg-muted/20 shadow-sm aspect-video lg:h-32 lg:w-32 lg:aspect-square">
                  <Image
                    src="/messy-create-me.png"
                    alt="Market Vibe Daily"
                    fill
                    sizes="(max-width: 1023px) 100vw, 128px"
                    style={{ objectFit: "cover", objectPosition: "top center" }}
                    priority
                  />
                </div>

                <div className="min-w-0">
                  <div className="text-4xl font-semibold font-serif text-gradient leading-tight sm:text-3xl md:text-3xl lg:text-4xl">
                    Market Vibe Daily
                  </div>
                  <div className="mt-1 text-sm text-foreground/70">
                    by Messy Virgo / $MESSY
                  </div>

                  <p className="mt-3 text-sm text-foreground/80">
                    Welcome to your Daily crypto market intel. Get today&apos;s regime and risk
                    context, plus what traders typically do, summarized in 2 minutes.
                    Full report included. No advice, education only.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-7 pt-5">
              <div className="mb-3 text-sm font-semibold text-foreground">
                Before we start:
              </div>

              <div className="space-y-4">
                <label className="flex cursor-pointer items-center gap-4 p-2 -m-2 rounded-md touch-manipulation active:bg-accent/50 transition-colors">
                  <input
                    type="checkbox"
                    className="h-6 w-6 shrink-0 accent-primary touch-none"
                    checked={termsChecked}
                    onChange={(e) => setTermsChecked(e.target.checked)}
                  />
                  <span className="text-sm leading-relaxed">
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="font-medium underline underline-offset-4 hover:opacity-90"
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Terms of Service
                    </Link>
                    .
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-4 p-2 -m-2 rounded-md touch-manipulation active:bg-accent/50 transition-colors">
                  <input
                    type="checkbox"
                    className="h-6 w-6 shrink-0 accent-primary touch-none"
                    checked={privacyChecked}
                    onChange={(e) => setPrivacyChecked(e.target.checked)}
                  />
                  <span className="text-sm leading-relaxed">
                    I agree to the{" "}
                    <Link
                      href="/privacy"
                      className="font-medium underline underline-offset-4 hover:opacity-90"
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-start">
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-pink-500 to-fuchsia-500 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:from-pink-600 hover:to-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-pink-500 disabled:hover:to-fuchsia-500"
                  onClick={acknowledge}
                  disabled={!canAcknowledge}
                >
                  Let&apos;s go
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
