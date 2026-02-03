const MACRO_REPORT_VARIANTS = [
  { code: "base_app", label: "Crypto Macro Economics" },
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
