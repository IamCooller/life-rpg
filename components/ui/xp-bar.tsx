"use client";

interface XPBarProps {
  current: number;
  max: number;
  color?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  glow?: boolean;
}

export function XPBar({
  current,
  max,
  color = "var(--accent-cyan)",
  showLabel = true,
  size = "md",
  glow = false,
}: XPBarProps) {
  const progress = max > 0 ? Math.min((current / max) * 100, 100) : 0;

  const heights = {
    sm: "h-1.5",
    md: "h-3",
    lg: "h-4",
  };

  return (
    <div className="w-full">
      <div
        className={`w-full overflow-hidden rounded-full bg-white/5 ${heights[size]}`}
      >
        <div
          className={`${heights[size]} rounded-full transition-all duration-500 ease-out ${glow ? "glow-pulse" : ""}`}
          style={{
            width: `${progress}%`,
            backgroundColor: color,
            boxShadow: glow ? `0 0 10px ${color}40` : undefined,
          }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs text-muted">
          {current} / {max} XP
        </p>
      )}
    </div>
  );
}
