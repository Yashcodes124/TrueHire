import React from "react";
import { HERO_STACK_LAYERS } from "./heroStackModel";

export interface StaticHeroStackDiagramProps {
  activeLayerIndex: number;
  onSelectLayer: (index: number) => void;
  reasonLabel?: string;
}

/**
 * Matching isometric 3-layer SVG schematic rendered during lazy suspense,
 * when `prefers-reduced-motion: reduce` is active, or when WebGL is unavailable.
 */
export const StaticHeroStackDiagram: React.FC<StaticHeroStackDiagramProps> = ({
  activeLayerIndex,
  onSelectLayer,
  reasonLabel,
}) => {
  // Render bottom-to-top so upper layers overlap naturally
  const yPositions = [242, 166, 90];

  return (
    <div
      data-testid="hero-3d-static-fallback"
      className="flex h-[340px] w-full flex-col items-center justify-center px-4 py-4 sm:h-[400px] lg:h-[430px]"
    >
      <svg
        viewBox="0 0 520 340"
        className="h-auto w-full max-w-[490px]"
        role="img"
        aria-label="Three-layer TrueHire verification stack connecting Resume Signals, Role Coverage, and Interview Proof"
      >
        {/* Connecting vertical signal lines */}
        <line
          x1="138"
          y1="104"
          x2="138"
          y2="256"
          stroke="var(--border-strong)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <line
          x1="382"
          y1="104"
          x2="382"
          y2="256"
          stroke="var(--status-success)"
          strokeWidth="1.75"
          strokeDasharray="4 4"
        />

        {HERO_STACK_LAYERS.map((layer, idx) => {
          const cy = yPositions[idx];
          const isActive = idx === activeLayerIndex;
          const accent =
            idx === 2 ? "var(--status-success)" : "var(--primary)";

          return (
            <g
              key={layer.id}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              aria-label={`Layer ${layer.index}: ${layer.label}`}
              className="cursor-pointer focus:outline-none"
              onClick={() => onSelectLayer(idx)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectLayer(idx);
                }
              }}
            >
              {/* Isometric layered slab polygon */}
              <polygon
                points={`260,${cy - 44} 426,${cy} 260,${cy + 44} 94,${cy}`}
                fill="var(--bg-surface)"
                stroke={isActive ? accent : "var(--border-strong)"}
                strokeWidth={isActive ? "2.4" : "1.25"}
              />
              <text
                x="260"
                y={cy - 4}
                textAnchor="middle"
                className="font-mono text-[11px] font-semibold"
                fill={isActive ? accent : "var(--text-secondary)"}
              >
                {layer.index} · {layer.label}
              </text>
              <text
                x="260"
                y={cy + 14}
                textAnchor="middle"
                className="font-sans text-[11px]"
                fill="var(--text-body)"
              >
                {layer.headline}
              </text>
            </g>
          );
        })}
      </svg>

      {reasonLabel && (
        <p className="mt-1 font-mono text-[11px] text-content-secondary">
          {reasonLabel}
        </p>
      )}
    </div>
  );
};
