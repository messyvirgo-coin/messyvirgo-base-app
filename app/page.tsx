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

function StatusMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-4xl">
      <div
        className="mv-card rounded-lg border border-input bg-black/40 backdrop-blur-sm overflow-hidden p-6 sm:p-8 text-center text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        {children}
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
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // Start loading the report immediately, even while overlay is displayed
    void fetchMacroReport();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchMacroReport, mounted]);

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
        <StatusMessage>Crunching macro data...</StatusMessage>
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
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
                  <div className="text-xl font-semibold font-serif text-gradient leading-tight sm:text-2xl">
                    Welcome to Market Vibe Daily
                  </div>
                  <div className="mt-1 text-sm text-foreground/70">
                    by Messy Virgo / $MESSY
                  </div>

                  <p className="mt-3 text-sm text-foreground/80">
                    Daily crypto market intel. Get today&apos;s regime and risk
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
                <label className="flex cursor-pointer items-start gap-4 p-2 -m-2 rounded-md touch-manipulation active:bg-accent/50 transition-colors">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-6 w-6 shrink-0 accent-primary touch-none"
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

                <label className="flex cursor-pointer items-start gap-4 p-2 -m-2 rounded-md touch-manipulation active:bg-accent/50 transition-colors">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-6 w-6 shrink-0 accent-primary touch-none"
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

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
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
