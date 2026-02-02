import type { ReactNode } from "react";
import { cn } from "@/app/lib/utils";
import { SidebarNav } from "@/app/components/SidebarNav";

type PageShellProps = {
  children: ReactNode;
  containerClassName?: string;
  mainClassName?: string;
  showNav?: boolean;
};

export function PageShell({
  children,
  containerClassName,
  mainClassName,
  showNav = true,
}: PageShellProps) {
  return (
    <div className="min-h-screen">
      <div className="aurora-bg" aria-hidden="true" />
      <div className="relative z-10">
        {showNav ? <SidebarNav /> : null}
        <div
          className={cn(
            "container mx-auto px-4 pt-6 md:pt-10 pb-10 max-w-6xl",
            showNav ? "pb-24" : null,
            containerClassName
          )}
        >
          <main
            className={cn("flex flex-col items-center gap-10", mainClassName)}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
