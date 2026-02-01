import type { ReactNode } from "react";
import { cn } from "@/app/lib/utils";

type PageShellProps = {
  children: ReactNode;
  containerClassName?: string;
  mainClassName?: string;
};

export function PageShell({
  children,
  containerClassName,
  mainClassName,
}: PageShellProps) {
  return (
    <div className="min-h-screen">
      <div className="aurora-bg" aria-hidden="true" />
      <div
        className={cn(
          "relative z-10 container mx-auto px-4 py-12 max-w-6xl",
          containerClassName
        )}
      >
        <main className={cn("flex flex-col items-center gap-10", mainClassName)}>
          {children}
        </main>
      </div>
    </div>
  );
}
