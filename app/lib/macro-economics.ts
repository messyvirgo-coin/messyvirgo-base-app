import type { LensOutputArtifact } from "./report-types";
import { imageUrl } from "./utils";

export type MacroRegimeLabel = "R++" | "R+" | "N" | "R-" | "D";

export function extractMacroRegimeLabel(
  artifact: LensOutputArtifact | null | undefined
): MacroRegimeLabel | null {
  if (!artifact) return null;

  const meta = artifact.meta;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const eff = (meta as Record<string, unknown>).macro_effective_regime_label;
    if (eff === "R++" || eff === "R+" || eff === "N" || eff === "R-" || eff === "D")
      return eff;
  }

  const content = artifact.content;
  if (
    content &&
    typeof content === "object" &&
    !Array.isArray(content) &&
    "header" in content
  ) {
    const header = (content as { header?: unknown }).header;
    if (typeof header === "string" && header) {
      const m = header.match(/\|\s*\*\*Regime\*\*\s*\|\s*([^|]+)\|/i);
      const raw = (m?.[1] || "").trim();
      const label = raw.split(/\s+/)[0]?.trim() || "";
      if (label === "R+" || label === "N" || label === "R-") return label;
      if (label === "R++" || label === "D") return label;
    }
  }

  return null;
}

export function extractMacroRegimeDetails(
  artifact: LensOutputArtifact | null | undefined
): {
  score: number | null;
  coveragePct: number | null;
  effectiveScore?: number | null;
  baseScore?: number | null;
  qualitativeAdjustment?: number | null;
} {
  if (!artifact) return { score: null, coveragePct: null };

  const meta = artifact.meta;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const m = meta as Record<string, unknown>;
    const effectiveScore =
      typeof m.macro_effective_score === "number"
        ? m.macro_effective_score
        : null;
    const qualitativeAdjustment =
      typeof m.macro_qualitative_adjustment === "number"
        ? m.macro_qualitative_adjustment
        : null;
    const baseScore =
      typeof m.macro_base_score === "number" ? m.macro_base_score : null;
    const score = effectiveScore ?? baseScore;
    if (score !== null)
      return {
        score,
        coveragePct: null,
        effectiveScore,
        baseScore,
        qualitativeAdjustment,
      };
  }

  const content = artifact.content;
  if (
    content &&
    typeof content === "object" &&
    !Array.isArray(content) &&
    "header" in content
  ) {
    const header = (content as { header?: unknown }).header;
    if (typeof header === "string" && header) {
      const scoreRow = header.match(/\|\s*\*\*Score\*\*\s*\|\s*([^|]+)\|/i);
      const scoreText = (scoreRow?.[1] || "").trim();
      const m = scoreText.match(
        /([+-]?\d+(?:\.\d+)?)\s*\(BS\)\s*([+-])\s*([0-9]+(?:\.\d+)?)\s*\(QA\)\s*=\s*([+-]?\d+(?:\.\d+)?)\s*\(ES\)/i
      );
      const baseScore = m?.[1] ? Number(m[1]) : null;
      const op = m?.[2] || null;
      const adjAbs = m?.[3] ? Number(m[3]) : null;
      const qualitativeAdjustment =
        op && typeof adjAbs === "number"
          ? op === "-"
            ? -adjAbs
            : adjAbs
          : null;
      const effectiveScore = m?.[4] ? Number(m[4]) : null;
      const score = Number.isFinite(effectiveScore as number)
        ? (effectiveScore as number)
        : Number.isFinite(baseScore as number)
          ? (baseScore as number)
          : null;
      return {
        score,
        coveragePct: null,
        effectiveScore: Number.isFinite(effectiveScore as number)
          ? (effectiveScore as number)
          : null,
        baseScore: Number.isFinite(baseScore as number)
          ? (baseScore as number)
          : null,
        qualitativeAdjustment: Number.isFinite(qualitativeAdjustment as number)
          ? (qualitativeAdjustment as number)
          : null,
      };
    }
  }

  return { score: null, coveragePct: null };
}

export function macroRegimeImageSrc(label: MacroRegimeLabel | null): string {
  switch (label) {
    case "R++":
      return imageUrl("/lenses/macro-economics/messy-macro-strong-on.png");
    case "R+":
      return imageUrl("/lenses/macro-economics/messy-macro-on.png");
    case "D":
      return imageUrl("/lenses/macro-economics/messy-macro-defensive.png");
    case "R-":
      return imageUrl("/lenses/macro-economics/messy-macro-off.png");
    case "N":
    default:
      return imageUrl("/lenses/macro-economics/messy-macro-neutral.png");
  }
}

export function getMacroVerdict(
  regimeLabel: string | null | undefined
): { title: string; subtitle: string } | null {
  if (!regimeLabel) return null;
  const normalized = (regimeLabel || "").trim().toUpperCase();
  switch (normalized) {
    case "R++":
      return { title: "Risk On", subtitle: "Aggressive Phase" };
    case "R+":
      return { title: "Risk On", subtitle: "Expansion Phase" };
    case "N":
      return { title: "Balanced", subtitle: "Transition Phase" };
    case "R-":
      return { title: "Risk Off", subtitle: "Contraction Phase" };
    case "D":
      return { title: "Defensive", subtitle: "Stress Phase" };
    default:
      return null;
  }
}
