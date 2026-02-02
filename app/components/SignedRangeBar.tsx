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
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-sm font-semibold text-foreground whitespace-nowrap">
            {label}
          </div>
          <div className="text-sm text-foreground whitespace-nowrap">
            {note ?? "—"}
          </div>
        </div>
      )}
      {!showLabelRow && note && (
        <div className="text-sm text-foreground whitespace-nowrap text-right">
          {note}
        </div>
      )}

      <div className="relative h-2 rounded-full bg-muted overflow-hidden border border-border">
        <div
          className="absolute inset-y-0 left-1/2 w-px bg-border"
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
