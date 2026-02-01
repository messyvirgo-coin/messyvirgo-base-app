export interface LensOutputArtifact {
  kind: "markdown" | "json" | "pdf" | "webhook";
  artifact_type?: string | null;
  content: string | Record<string, unknown> | MarkdownContent;
  content_type: string;
  process_id?: string | null;
  variant_id?: string | null;
  language?: string | null;
  variant_code?: string | null;
  base_created_at?: string | null;
  meta?: Record<string, unknown> | null;
}

export interface PublishedArtifactMeta {
  published_at: string;
  base_process_retrieved_at?: string | null;
  is_stale: boolean;
  stale_reason?: string | null;
  age_seconds?: number | null;
  next_refresh_eta_seconds?: number | null;
  render_version?: string | null;
}

export interface PublishedMacroReportResponse {
  outputs: LensOutputArtifact[];
  meta: PublishedArtifactMeta;
}

export interface MarkdownContent {
  header: string;
  body: string;
  annexes?: string;
  footer: string;
  data?: Record<string, unknown> | null;
}
