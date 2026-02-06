import Image from "next/image";

export function StatusMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-4xl">
      <div
        className="mv-card rounded-lg border border-input bg-black/40 overflow-hidden p-6 sm:p-8 text-center text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        {children}
      </div>
    </div>
  );
}

export function LoadingIndicator({
  label = "Loading report…",
}: {
  label?: string;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex items-center gap-3 text-sm">
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground/70"
          aria-hidden="true"
        />
        <span>{label}</span>
      </div>

      <div
        className="h-2 w-full max-w-md overflow-hidden rounded-full bg-border/30"
        role="progressbar"
        aria-label="Loading"
        aria-valuetext="Loading"
      >
        <div className="h-full w-2/3 animate-pulse rounded-full bg-linear-to-r from-pink-400 via-fuchsia-400 to-violet-400" />
      </div>
    </div>
  );
}

export function AppBootSplash({ label = "Loading..." }: { label?: string }) {
  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-3 py-10 text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <Image
        src="/logo.svg"
        alt="Messy logo"
        width={64}
        height={64}
        priority
        style={{ objectFit: "contain" }}
      />
      <div>{label}</div>
    </div>
  );
}
