import { readFile } from "node:fs/promises";
import path from "node:path";
import { PageHeader } from "@/app/components/PageHeader";
import { PageShell } from "@/app/components/PageShell";
import { Card, CardContent } from "@/app/components/ui/card";
import { MarkdownProse } from "@/app/components/MarkdownProse";

export default async function PrivacyPage() {
  const filePath = path.join(process.cwd(), "content", "legal", "privacy.md");
  const markdown = await readFile(filePath, "utf8");

  return (
    <PageShell mainClassName="gap-8">
      <PageHeader
        title="Privacy Policy"
        subtitle="How we handle your data and privacy"
      />

      <div className="w-full max-w-4xl space-y-4">
        <Card className="mv-card rounded-lg">
          <CardContent className="pt-9">
            <MarkdownProse markdown={markdown} />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
