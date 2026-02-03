"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { PageShell } from "@/app/components/PageShell";
import { ErrorDisplay } from "@/app/components/ErrorDisplay";
import { MacroReportRenderer } from "@/app/components/macro/MacroReportRenderer";
import type { PublishedMacroReportResponse } from "@/app/lib/report-types";

type MacroStatus = "idle" | "loading" | "success" | "error";

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

  useEffect(() => {
    setMounted(true);
  }, []);

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
    void fetchMacroReport();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchMacroReport]);

  const reportVariantCode = useMemo(() => "base_app", []);

  const dashboardTitle = useMemo(() => {
    void reportVariantCode;
    return "Crypto Macro Economics";
  }, [reportVariantCode]);

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

      {mounted && macroStatus === "loading" && (
        <StatusMessage>Crunching macro data...</StatusMessage>
      )}

      {mounted && macroStatus === "error" && (
        <div className="w-full max-w-4xl">
          <ErrorDisplay error={macroError} />
        </div>
      )}

      {mounted && macroStatus === "success" && macroReport?.outputs && (
        <MacroReportRenderer
          outputs={macroReport.outputs}
          variantCode={reportVariantCode}
          macroProfileShortLabel={null}
          macroCadence="daily"
          macroCadenceDisabled={true}
        />
      )}

      {mounted && macroStatus === "success" && !macroReport?.outputs && (
        <StatusMessage>
          Report loaded, but no outputs were returned.
        </StatusMessage>
      )}
    </PageShell>
  );
}
