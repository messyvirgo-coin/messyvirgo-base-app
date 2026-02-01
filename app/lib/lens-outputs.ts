import type {
  LensOutputArtifact,
  MarkdownContent,
  ScoreEntry,
} from "./report-types";

export function getReportMarkdownArtifact(
  outputs: LensOutputArtifact[]
): LensOutputArtifact | null {
  const markdown =
    outputs.find(
      (artifact) =>
        artifact.artifact_type === "report" && artifact.kind === "markdown"
    ) ?? outputs.find((artifact) => artifact.kind === "markdown");
  return markdown ?? null;
}

function isStructuredMarkdownContent(
  content: unknown
): content is Partial<MarkdownContent> {
  return (
    !!content &&
    typeof content === "object" &&
    !Array.isArray(content) &&
    ("body" in content || "header" in content || "footer" in content)
  );
}

export function getMarkdownReportText(
  outputs: LensOutputArtifact[]
): string | null {
  const artifact = getReportMarkdownArtifact(outputs);
  if (!artifact) return null;

  const maybeContent: unknown = artifact.content;
  const content =
    !!maybeContent &&
    typeof maybeContent === "object" &&
    !Array.isArray(maybeContent) &&
    "content" in (maybeContent as { content?: unknown }) &&
    typeof (maybeContent as { content?: unknown }).content === "object" &&
    (maybeContent as { content: unknown }).content !== null &&
    !Array.isArray((maybeContent as { content: unknown }).content)
      ? (maybeContent as { content: unknown }).content
      : maybeContent;

  if (isStructuredMarkdownContent(content)) {
    if (typeof content.body === "string") {
      const parts = [
        content.body,
        typeof content.annexes === "string" ? content.annexes : "",
        typeof content.footer === "string" ? content.footer : "",
      ]
        .map((s) => s.trim())
        .filter(Boolean);
      return parts.join("\n\n");
    }
  }

  return typeof content === "string" ? content : null;
}

export function getStructuredReportData(
  outputs: LensOutputArtifact[]
): Record<string, unknown> | null {
  const artifact = getReportMarkdownArtifact(outputs);
  if (!artifact) return null;
  const content = artifact.content;
  if (!content || typeof content !== "object" || Array.isArray(content))
    return null;
  const data = (content as MarkdownContent).data;
  return data && typeof data === "object" && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : null;
}

export function getFinalScoreFromReportData(
  outputs: LensOutputArtifact[]
): number | null {
  const data = getStructuredReportData(outputs);
  if (!data) return null;
  const scores = data.scores;
  if (!Array.isArray(scores)) return null;
  const entries = scores as unknown as ScoreEntry[];
  const final =
    entries.find((e) => (e?.kind || "") === "final") ??
    entries.find((e) => typeof e?.id === "string" && e.id.includes(":final")) ??
    entries.find(
      (e) =>
        typeof e?.name === "string" && e.name.toLowerCase().includes("final")
    );
  const v = final?.value;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export type PillarScore = {
  name: string;
  value: number;
  weight?: number | null;
  status?: string | null;
};

export function getPillarScoresFromReportData(
  outputs: LensOutputArtifact[]
): PillarScore[] {
  const data = getStructuredReportData(outputs);
  if (!data) return [];
  const scores = data.scores;
  if (!Array.isArray(scores)) return [];
  const entries = scores as unknown as ScoreEntry[];

  const pillars = entries.filter((e) => {
    if (!e || typeof e !== "object") return false;
    const kind = String(e.kind ?? "");
    if (kind && kind !== "pillar") return false;
    const name = typeof e.name === "string" ? e.name : "";
    if (!name) return false;
    if (name.toLowerCase().includes("final")) return false;
    return typeof e.value === "number" && Number.isFinite(e.value);
  });

  return pillars
    .map((e) => ({
      name: e.name,
      value: e.value as number,
      weight: typeof e.weight === "number" ? e.weight : null,
      status: typeof e.status === "string" ? e.status : null,
    }))
    .sort((a, b) => {
      const aw = typeof a.weight === "number" ? a.weight : -1;
      const bw = typeof b.weight === "number" ? b.weight : -1;
      if (aw !== bw) return bw - aw;
      return a.name.localeCompare(b.name);
    });
}
