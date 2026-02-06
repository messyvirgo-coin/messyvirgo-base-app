import type { PublishedMacroReportResponse } from "@/app/lib/report-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function isPublishedMacroReportResponse(
  value: unknown
): value is PublishedMacroReportResponse {
  if (!isRecord(value)) return false;
  if (!Array.isArray(value.outputs)) return false;
  if (!isRecord(value.meta)) return false;

  if (typeof value.meta.published_at !== "string") return false;
  if (typeof value.meta.is_stale !== "boolean") return false;

  return true;
}
