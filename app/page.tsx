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
    if (!hasAcknowledgedLegal) return;
    void fetchMacroReport();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchMacroReport, hasAcknowledgedLegal, mounted]);

  const reportVariantCode = useMemo(() => "base_app", []);

  const dashboardTitle = useMemo(() => {
    void reportVariantCode;
    return "Crypto Macro Economics";
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
          <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
            <div className="p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0">
                  <Image
                    src="/logo.svg"
                    alt="Messy Virgo"
                    fill
                    sizes="40px"
                    style={{ objectFit: "contain" }}
                    priority
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-semibold leading-tight">
                    Welcome to Messy Virgo
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Your macro dashboard for crypto markets.
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm text-foreground/80">
                Before you view the report, please confirm you’ve read and agree to
                our{" "}
                <Link
                  href="/terms"
                  className="font-medium underline underline-offset-4 hover:opacity-90"
                  target="_blank"
                  rel="noreferrer"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="font-medium underline underline-offset-4 hover:opacity-90"
                  target="_blank"
                  rel="noreferrer"
                >
                  Privacy Policy
                </Link>
                .
              </p>

              <div className="mt-5 space-y-3">
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-primary"
                    checked={termsChecked}
                    onChange={(e) => setTermsChecked(e.target.checked)}
                  />
                  <span>
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="font-medium underline underline-offset-4 hover:opacity-90"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Terms of Service
                    </Link>
                    .
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-primary"
                    checked={privacyChecked}
                    onChange={(e) => setPrivacyChecked(e.target.checked)}
                  />
                  <span>
                    I agree to the{" "}
                    <Link
                      href="/privacy"
                      className="font-medium underline underline-offset-4 hover:opacity-90"
                      target="_blank"
                      rel="noreferrer"
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
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
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
