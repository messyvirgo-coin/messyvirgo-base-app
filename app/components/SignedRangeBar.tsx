import { cn } from "@/app/lib/utils";

export function SignedRangeBar({
  label,
  value,
  note,
  maxAbs = 0.5,
  className,
}: {
  label?: string;
  value: number | null | undefined;
  note?: string;
  maxAbs?: number;
  className?: string;
}) {
  const max = Math.max(0.000001, Math.abs(maxAbs));
  const v = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const clamped = Math.max(-max, Math.min(max, v));
  const magnitude = Math.min(1, Math.abs(clamped) / max);
  const halfWidthPct = magnitude * 50;

  const fillStyle =
    clamped >= 0
      ? { left: "50%", width: `${halfWidthPct}%` }
      : { left: `${50 - halfWidthPct}%`, width: `${halfWidthPct}%` };

  const showLabelRow = label !== undefined && label !== null && label.trim() !== "";

  return (
    <div className={cn("space-y-1", className)}>
      {showLabelRow && (
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-3">
          <div className="text-xs font-semibold text-foreground whitespace-nowrap">
            {label}
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {note ?? "—"}
          </div>
        </div>
      )}
      {!showLabelRow && note && (
        <div className="text-xs text-muted-foreground whitespace-nowrap text-right">
          {note}
        </div>
      )}

      <div className="relative h-2 rounded-full bg-white/10 overflow-hidden border border-white/10">
        <div
          className="absolute inset-y-0 left-1/2 w-px bg-white/25"
          aria-hidden="true"
        />
        <div
          className="absolute inset-y-0 rounded-full bg-gradient-to-r from-pink-400 via-fuchsia-400 to-violet-400"
          style={fillStyle}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
