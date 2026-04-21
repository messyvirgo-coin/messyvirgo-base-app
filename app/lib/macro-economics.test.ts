import { describe, expect, it } from "vitest";
import type { LensOutputArtifact } from "@/app/lib/report-types";
import {
  extractMacroRegimeDetails,
  extractMacroRegimeLabel,
  formatMacroScoreBreakdown,
  getMacroVerdict,
} from "@/app/lib/macro-economics";

describe("macro-economics", () => {
  describe("extractMacroRegimeLabel", () => {
    it("prefers meta.macro_effective_regime_label when present", () => {
      const artifact: LensOutputArtifact = {
        kind: "json",
        artifact_type: "report",
        content: {},
        content_type: "application/json",
        meta: { macro_effective_regime_label: "R+" },
      };
      expect(extractMacroRegimeLabel(artifact)).toBe("R+");
    });

    it("falls back to parsing the header table", () => {
      const artifact: LensOutputArtifact = {
        kind: "markdown",
        artifact_type: "report",
        content: {
          header: [
            "# Some Title",
            "",
            "| **Regime** | R- (Contraction Phase) |",
            "|---|---|",
          ].join("\n"),
          body: "",
          footer: "",
        },
        content_type: "text/markdown",
      };
      expect(extractMacroRegimeLabel(artifact)).toBe("R-");
    });

    it("parses **Effective Regime** row", () => {
      const artifact: LensOutputArtifact = {
        kind: "markdown",
        artifact_type: "report",
        content: {
          header:
            "| **Effective Regime** | R+ — Risk On |\n|---|---|",
          body: "",
          footer: "",
        },
        content_type: "text/markdown",
      };
      expect(extractMacroRegimeLabel(artifact)).toBe("R+");
    });
  });

  describe("extractMacroRegimeDetails", () => {
    it("returns scores from meta when present", () => {
      const artifact: LensOutputArtifact = {
        kind: "json",
        artifact_type: "report",
        content: {},
        content_type: "application/json",
        meta: {
          macro_effective_score: 60,
          macro_base_score: 72,
          macro_qualitative_adjustment: -12,
        },
      };
      expect(extractMacroRegimeDetails(artifact)).toEqual({
        score: 60,
        coveragePct: null,
        effectiveScore: 60,
        baseScore: 72,
        qualitativeAdjustment: -12,
      });
    });

    it("parses score row in header as a fallback", () => {
      const artifact: LensOutputArtifact = {
        kind: "markdown",
        artifact_type: "report",
        content: {
          header: [
            "# Some Title",
            "",
            "| **Score** | 72.00 (BS) - 12.00 (QA) = 60.00 (ES) |",
            "|---|---|",
          ].join("\n"),
          body: "",
          footer: "",
        },
        content_type: "text/markdown",
      };

      const details = extractMacroRegimeDetails(artifact);
      expect(details.score).toBe(60);
      expect(details.baseScore).toBe(72);
      expect(details.qualitativeAdjustment).toBe(-12);
      expect(details.effectiveScore).toBe(60);
    });
  });

  describe("formatMacroScoreBreakdown", () => {
    it("formats the macro score breakdown on the 0-100 scale", () => {
      expect(
        formatMacroScoreBreakdown({
          baseScore: 72,
          qualitativeAdjustment: -12,
          effectiveScore: 60,
        })
      ).toBe("72.00 (BS) - 12.00 (QA) = 60.00 (ES)");
    });
  });

  describe("getMacroVerdict", () => {
    it("normalizes case/whitespace", () => {
      expect(getMacroVerdict("  r+ ")).toEqual({
        title: "Risk On",
        subtitle: "Expansion Phase",
      });
    });
  });
});
