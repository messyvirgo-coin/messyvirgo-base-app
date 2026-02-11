"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MacroTwitterPostStatus = "idle" | "loading" | "success" | "error";

type CachedTwitterPostEnvelope = {
  cachedAtMs?: unknown;
  variantCode?: unknown;
  text?: unknown;
};

type UseMacroTwitterPostOptions = {
  enabled: boolean;
  variantCode: string;
  cacheKey: string;
  ttlMs: number;
};

type UseMacroTwitterPostResult = {
  status: MacroTwitterPostStatus;
  error: Error | null;
  text: string | null;
  refetch: () => Promise<void>;
};

function loadCachedText(cacheKey: string, variantCode: string, ttlMs: number) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(cacheKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedTwitterPostEnvelope;
    if (typeof parsed?.cachedAtMs !== "number") return null;
    if (parsed.variantCode !== variantCode) return null;
    if (typeof parsed.text !== "string" || !parsed.text.trim()) return null;

    const ageMs = Date.now() - parsed.cachedAtMs;
    if (ageMs < 0 || ageMs > ttlMs) return null;

    return parsed.text;
  } catch {
    return null;
  }
}

function persistCachedText(
  cacheKey: string,
  variantCode: string,
  text: string
) {
  if (typeof window === "undefined") return;
  const trimmed = text.trim();
  if (!trimmed) return;

  try {
    window.localStorage.setItem(
      cacheKey,
      JSON.stringify({
        cachedAtMs: Date.now(),
        variantCode,
        text: trimmed,
      })
    );
  } catch {
    // Best-effort only (storage may be unavailable / full).
  }
}

export function useMacroTwitterPost({
  enabled,
  variantCode,
  cacheKey,
  ttlMs,
}: UseMacroTwitterPostOptions): UseMacroTwitterPostResult {
  const [status, setStatus] = useState<MacroTwitterPostStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [text, setText] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    if (typeof window === "undefined") return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setError(null);
    setText(null);

    try {
      const url = new URL(
        "/api/macro/twitter-post/latest",
        window.location.origin
      );
      url.searchParams.set("variant", variantCode);

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

      const json = (await response.json()) as unknown;
      const nextText =
        !!json &&
        typeof json === "object" &&
        "text" in json &&
        typeof (json as { text?: unknown }).text === "string"
          ? (json as { text: string }).text
          : null;

      if (!nextText || !nextText.trim()) {
        throw new Error("No twitter post text returned.");
      }
      if (abortRef.current !== controller) return;

      setText(nextText);
      setStatus("success");
      persistCachedText(cacheKey, variantCode, nextText);
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
  }, [cacheKey, variantCode]);

  useEffect(() => {
    if (!enabled) return;

    const cached = loadCachedText(cacheKey, variantCode, ttlMs);
    if (cached) {
      setError(null);
      setText(cached);
      setStatus("success");
      return () => {
        abortRef.current?.abort();
      };
    }

    void refetch();
    return () => {
      abortRef.current?.abort();
    };
  }, [cacheKey, enabled, refetch, ttlMs, variantCode]);

  return { status, error, text, refetch };
}
