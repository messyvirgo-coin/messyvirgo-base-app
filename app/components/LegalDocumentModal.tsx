"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { MarkdownProse } from "@/app/components/MarkdownProse";

export type LegalDoc = "privacy" | "terms";

export function LegalDocumentModal({
  isOpen,
  doc,
  onClose,
}: {
  isOpen: boolean;
  doc: LegalDoc;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(
    () => (doc === "privacy" ? "Privacy Policy" : "Terms of Service"),
    [doc]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, mounted]);

  useEffect(() => {
    if (!isOpen) return;
    setMarkdown(null);
    setError(null);

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/legal/${doc}`);
        if (!res.ok) throw new Error("Failed to load document.");
        const text = await res.text();
        if (cancelled) return;
        setMarkdown(text);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load document.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [doc, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-1000">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="w-full max-w-3xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-hidden rounded-2xl border border-border bg-background/95 shadow-2xl"
        >
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
            <div className="font-semibold">{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/70 text-foreground hover:bg-accent/60 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(100dvh-2rem-56px)] sm:max-h-[calc(100dvh-3rem-56px)] mv-scrollbar">
            {!markdown && !error ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : null}
            {error ? (
              <div className="text-sm text-destructive">{error}</div>
            ) : null}
            {markdown ? <MarkdownProse markdown={markdown} /> : null}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

