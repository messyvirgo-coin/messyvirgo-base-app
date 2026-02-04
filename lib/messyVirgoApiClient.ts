import "server-only";

type ClientOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

const API_BASE_URL =
  process.env.MESSY_VIRGO_API_BASE_URL ?? "https://api.messyvirgo.com";

export const DEFAULT_DAILY_MACRO_REPORT_VARIANT_CODE = "base_app";

function resolveDailyMacroPath(variantCode: string): string {
  const normalized =
    typeof variantCode === "string" && variantCode.trim()
      ? variantCode.trim()
      : DEFAULT_DAILY_MACRO_REPORT_VARIANT_CODE;
  // Variant codes are a single path segment in the upstream API.
  return `/api/v1/published/macro/report/${encodeURIComponent(normalized)}`;
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

export async function getLatestDailyMacroReport(
  variantCode: string = DEFAULT_DAILY_MACRO_REPORT_VARIANT_CODE,
  options?: ClientOptions
): Promise<unknown> {
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
          errorBody || "Unknown error"
        }`
      );
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
    if (options?.signal && upstreamAbortListener) {
      options.signal.removeEventListener("abort", upstreamAbortListener);
    }
  }
}
