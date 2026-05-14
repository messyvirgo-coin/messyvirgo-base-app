"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublishedMacroReportResponse } from "@/app/lib/report-types";
import type { MacroReportKind } from "@/app/lib/macro-report-kind";

export type MacroReportStatus = "idle" | "loading" | "success" | "error";

type CachedMacroReportEnvelope = {
  cachedAtMs?: unknown;
  reportKind?: unknown;
  report?: unknown;
};

type UseMacroReportOptions = {
  enabled: boolean;
  reportKind: MacroReportKind;
  cacheKey: string;
  ttlMs: number;
};

type UseMacroReportResult = {
  status: MacroReportStatus;
  error: Error | null;
  report: PublishedMacroReportResponse | null;
  refetch: () => Promise<void>;
};

function loadCachedReport(
  cacheKey: string,
  reportKind: MacroReportKind,
  ttlMs: number
) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(cacheKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedMacroReportEnvelope;
    if (typeof parsed?.cachedAtMs !== "number") return null;
    if (!parsed.report) return null;

    if (parsed.reportKind !== reportKind) return null;

    const ageMs = Date.now() - parsed.cachedAtMs;
    if (ageMs < 0 || ageMs > ttlMs) return null;

    return parsed.report as PublishedMacroReportResponse;
  } catch {
    return null;
  }
}

function persistCachedReport(
  cacheKey: string,
  reportKind: MacroReportKind,
  report: PublishedMacroReportResponse
) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      cacheKey,
      JSON.stringify({
        cachedAtMs: Date.now(),
        reportKind,
        report,
      })
    );
  } catch {
    // Best-effort only (storage may be unavailable / full).
  }
}

export function useMacroReport({
  enabled,
  reportKind,
  cacheKey,
  ttlMs,
}: UseMacroReportOptions): UseMacroReportResult {
  const [status, setStatus] = useState<MacroReportStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [report, setReport] = useState<PublishedMacroReportResponse | null>(
    null
  );

  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    if (typeof window === "undefined") return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setError(null);
    setReport(null);

    try {
      const url = new URL("/api/macro/latest", window.location.origin);
      url.searchParams.set("report", reportKind);

      const response = await fetch(url.toString(), {
        signal: controller.signal,
      });
      if (abortRef.current !== controller) return;

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const detail =
          typeof errorBody?.error === "string"
            ? errorBody.error
            : "Unknown error";
        throw new Error(detail);
      }

      const nextReport =
        (await response.json()) as PublishedMacroReportResponse;
      if (abortRef.current !== controller) return;

      setReport(nextReport);
      setStatus("success");
      persistCachedReport(cacheKey, reportKind, nextReport);
    } catch (fetchError) {
      if (
        fetchError instanceof DOMException &&
        fetchError.name === "AbortError"
      ) {
        return;
      }
      if (abortRef.current !== controller) return;

      setError(
        fetchError instanceof Error ? fetchError : new Error("Unknown error")
      );
      setStatus("error");
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [cacheKey, reportKind]);

  useEffect(() => {
    if (!enabled) return;

    // Prefer cache to avoid re-fetching the same daily payload.
    const cached = loadCachedReport(cacheKey, reportKind, ttlMs);
    if (cached) {
      setError(null);
      setReport(cached);
      setStatus("success");
      return () => {
        abortRef.current?.abort();
      };
    }

    void refetch();
    return () => {
      abortRef.current?.abort();
    };
  }, [cacheKey, enabled, refetch, ttlMs, reportKind]);

  return { status, error, report, refetch };
}
