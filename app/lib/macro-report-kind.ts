export type MacroReportKind = "daily" | "default";

export const DEFAULT_MACRO_REPORT_KIND: MacroReportKind = "daily";

export function isMacroReportKind(value: string): value is MacroReportKind {
  return value === "daily" || value === "default";
}
