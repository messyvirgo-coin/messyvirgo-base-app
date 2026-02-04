"use client";

import { useMemo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const PROSE_CLASSNAME =
  "prose max-w-none text-sm leading-6 dark:prose-invert prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:text-foreground prose-table:border prose-table:border-collapse prose-table:border-white/15 prose-th:border prose-th:border-white/15 prose-th:bg-white/5 prose-th:p-2 prose-th:text-left prose-th:font-semibold prose-td:border prose-td:border-white/15 prose-td:p-2 prose-td:text-left prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground";

const MARKDOWN_COMPONENTS = {
  table: ({ children }: { children?: ReactNode }) => (
    <div className="overflow-x-auto my-4 mv-scrollbar -mx-4 px-4">
      <table className="min-w-full border-collapse">{children}</table>
    </div>
  ),
  hr: () => <hr className="my-8 border-t border-border dark:border-white/20" />,
};

export function MarkdownProse({ markdown }: { markdown: string }) {
  const content = useMemo(() => markdown ?? "", [markdown]);

  return (
    <div className={PROSE_CLASSNAME}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

