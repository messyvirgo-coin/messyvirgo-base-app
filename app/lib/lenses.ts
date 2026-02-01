export const MACRO_REPORT_VARIANTS = [
  { code: "default", label: "Full Macros Report" },
  { code: "allocator_daily", label: "Allocator's Daily Macros" },
  { code: "trader_daily", label: "Trader's Daily Macros" },
  { code: "degen_daily", label: "Degen's Daily Macros" },
  { code: "allocator_weekly", label: "Allocator's Weekly Macros" },
  { code: "trader_weekly", label: "Trader's Weekly Macros" },
  { code: "degen_weekly", label: "Degen's Weekly Macros" },
] as const;

export function getMacroVariantLabel(
  variantCode: string | null | undefined
): string | null {
  if (!variantCode) return null;
  const normalized = (variantCode || "").trim().toLowerCase();
  const variant = MACRO_REPORT_VARIANTS.find(
    (v) => v.code.toLowerCase() === normalized
  );
  return variant?.label ?? null;
}
