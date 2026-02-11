import "server-only";

import type { PublishedMacroReportResponse } from "@/app/lib/report-types";
import { isPublishedMacroReportResponse } from "@/app/lib/report-guards";

type ClientOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

const API_BASE_URL =
  process.env.MESSY_VIRGO_API_BASE_URL ?? "https://api.messyvirgo.com";

export const DEFAULT_DAILY_MACRO_REPORT_VARIANT_CODE = "base_app";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function resolveDailyMacroPath(variantCode: string): string {
  const normalized =
    typeof variantCode === "string" && variantCode.trim()
      ? variantCode.trim()
      : DEFAULT_DAILY_MACRO_REPORT_VARIANT_CODE;
  // Variant codes are a single path segment in the upstream API.
  return `/api/v1/published/macro/report/${encodeURIComponent(normalized)}`;
}

function resolveDailyMacroTwitterPostPath(variantCode: string): string {
  const normalized =
    typeof variantCode === "string" && variantCode.trim()
      ? variantCode.trim()
      : DEFAULT_DAILY_MACRO_REPORT_VARIANT_CODE;
  // Variant codes are a single path segment in the upstream API.
  return `/api/v1/published/macro/twitter_post/${encodeURIComponent(normalized)}`;
}

function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const apiKey = process.env.MESSY_VIRGO_API_KEY;
  const token = process.env.MESSY_VIRGO_API_TOKEN;

  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function extractTextFromUpstreamJson(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (!isRecord(value)) return null;

  // The twitter_post endpoint wraps its payload in the same { outputs, meta }
  // envelope used by the report endpoint.  Drill into outputs[0].content.text.
  if (Array.isArray(value.outputs) && value.outputs.length > 0) {
    const first: unknown = value.outputs[0];
    if (isRecord(first) && isRecord(first.content)) {
      const t = first.content.text;
      if (typeof t === "string" && t.trim()) return t.trim();
    }
  }

  const directCandidates: Array<unknown> = [
    value.text,
    value.content,
    value.body,
    value.value,
    value.message,
  ];
  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  // Some APIs nest content in an object (e.g. { content: { body: "..." } }).
  if (isRecord(value.content)) {
    const nestedCandidates: Array<unknown> = [
      value.content.text,
      value.content.body,
      value.content.value,
      value.content.message,
    ];
    for (const candidate of nestedCandidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
  }

  return null;
}

export async function getLatestDailyMacroReport(
  variantCode: string = DEFAULT_DAILY_MACRO_REPORT_VARIANT_CODE,
  options?: ClientOptions
): Promise<PublishedMacroReportResponse> {
  const url = new URL(resolveDailyMacroPath(variantCode), API_BASE_URL);

  const timeoutMs = options?.timeoutMs ?? 12_000;
  const controller = new AbortController();

  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let upstreamAbortListener: (() => void) | null = null;
  if (options?.signal) {
    upstreamAbortListener = () => controller.abort();
    options.signal.addEventListener("abort", upstreamAbortListener, {
      once: true,
    });
  }

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...buildAuthHeaders(),
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `MessyVirgo API error (${response.status}): ${
          errorBody ? errorBody.slice(0, 500) : "Unknown error"
        }`
      );
    }

    const json = (await response.json()) as unknown;
    if (!isPublishedMacroReportResponse(json)) {
      throw new Error("MessyVirgo API returned an unexpected report shape.");
    }
    return json;
  } finally {
    clearTimeout(timeoutId);
    if (options?.signal && upstreamAbortListener) {
      options.signal.removeEventListener("abort", upstreamAbortListener);
    }
  }
}

export async function getLatestDailyMacroTwitterPostText(
  variantCode: string = DEFAULT_DAILY_MACRO_REPORT_VARIANT_CODE,
  options?: ClientOptions
): Promise<string> {
  const url = new URL(
    resolveDailyMacroTwitterPostPath(variantCode),
    API_BASE_URL
  );

  const timeoutMs = options?.timeoutMs ?? 12_000;
  const controller = new AbortController();

  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let upstreamAbortListener: (() => void) | null = null;
  if (options?.signal) {
    upstreamAbortListener = () => controller.abort();
    options.signal.addEventListener("abort", upstreamAbortListener, {
      once: true,
    });
  }

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
        ...buildAuthHeaders(),
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `MessyVirgo API error (${response.status}): ${
          errorBody ? errorBody.slice(0, 500) : "Unknown error"
        }`
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const json = (await response.json()) as unknown;

      const extracted = extractTextFromUpstreamJson(json);
      if (extracted) return extracted;
      throw new Error(
        "MessyVirgo API returned an unexpected twitter_post JSON shape."
      );
    }

    const text = (await response.text()).trim();
    if (text) return text;
    throw new Error("MessyVirgo API returned an empty twitter_post response.");
  } finally {
    clearTimeout(timeoutId);
    if (options?.signal && upstreamAbortListener) {
      options.signal.removeEventListener("abort", upstreamAbortListener);
    }
  }
}
