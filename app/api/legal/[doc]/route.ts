import { readFile } from "node:fs/promises";
import path from "node:path";

const DOCS = new Set(["privacy", "terms"] as const);

type Params = { params: Promise<{ doc: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { doc } = await params;
  if (!DOCS.has(doc as "privacy" | "terms")) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "content", "legal", `${doc}.md`);

  try {
    const markdown = await readFile(filePath, "utf8");
    return new Response(markdown, {
      status: 200,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        // Keep this conservative; Vercel/Next may handle caching differently per environment.
        "cache-control": "public, max-age=0, s-maxage=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

