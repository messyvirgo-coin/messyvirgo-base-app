import type { LensOutputArtifact, MarkdownContent } from "./report-types";

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
