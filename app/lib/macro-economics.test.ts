import { describe, expect, it } from "vitest";
import type { LensOutputArtifact } from "@/app/lib/report-types";
import {
  extractMacroRegimeDetails,
  extractMacroRegimeLabel,
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
  });

  describe("extractMacroRegimeDetails", () => {
    it("returns scores from meta when present", () => {
      const artifact: LensOutputArtifact = {
        kind: "json",
        artifact_type: "report",
        content: {},
        content_type: "application/json",
        meta: {
          macro_effective_score: 8,
          macro_base_score: 10,
          macro_qualitative_adjustment: -2,
        },
      };
      expect(extractMacroRegimeDetails(artifact)).toEqual({
        score: 8,
        coveragePct: null,
        effectiveScore: 8,
        baseScore: 10,
        qualitativeAdjustment: -2,
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
            "| **Score** | 10 (BS) - 2 (QA) = 8 (ES) |",
            "|---|---|",
          ].join("\n"),
          body: "",
          footer: "",
        },
        content_type: "text/markdown",
      };

      const details = extractMacroRegimeDetails(artifact);
      expect(details.score).toBe(8);
      expect(details.baseScore).toBe(10);
      expect(details.qualitativeAdjustment).toBe(-2);
      expect(details.effectiveScore).toBe(8);
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

