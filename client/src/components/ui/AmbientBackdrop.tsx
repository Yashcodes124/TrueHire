import React from "react";

export interface AmbientBackdropProps {
  variant?: "hero" | "subtle";
  className?: string;
}

/**
 * Lightweight, GPU-friendly architectural background layer calibrated for BOTH
 * Obsidian Dark and Swiss Cobalt themes. Uses pure CSS transforms & radial masks
 * with zero heavy canvas/WebGL loops and respects `prefers-reduced-motion`.
 */
export const AmbientBackdrop: React.FC<AmbientBackdropProps> = ({
  variant = "hero",
  className = "",
}) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Crisp hairline architectural grid */}
      <div
        className={`absolute inset-0 bg-architectural-grid ${
          variant === "hero" ? "opacity-45" : "opacity-25"
        } [mask-image:radial-gradient(ellipse_78%_68%_at_50%_18%,#000_22%,transparent_100%)]`}
      />

      {/* Soft cobalt ambient glow anchored high behind the focal hero */}
      <div className="ambient-glow-drift absolute -top-32 left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full opacity-[0.14] blur-3xl [background:radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)]" />

      {/* Hairline diagonal architectural beam (compositor-only transform) */}
      {variant === "hero" && (
        <div className="ambient-beam-sweep absolute -top-24 left-0 h-[1px] w-[62%] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      )}
    </div>
  );
};
