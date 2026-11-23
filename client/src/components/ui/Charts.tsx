import React, { useId, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  computeAreaChartGeometry,
  computeDonutSegments,
  computeRadarGeometry,
  normalizeBarItems,
  type AreaPointDatum,
  type BarDatum,
  type DonutDatum,
  type RadarDatum,
} from "../../lib/chartMath";

const CHART_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const TONE_FILL: Record<
  "primary" | "success" | "warning" | "danger" | "neutral",
  string
> = {
  primary: "var(--primary)",
  success: "var(--status-success)",
  warning: "var(--status-warning)",
  danger: "var(--status-danger)",
  neutral: "var(--text-secondary)",
};

const TONE_BG_CLASS: Record<
  "primary" | "success" | "warning" | "danger" | "neutral",
  string
> = {
  primary: "bg-primary",
  success: "bg-status-success",
  warning: "bg-status-warning",
  danger: "bg-status-danger",
  neutral: "bg-content-secondary",
};

/* ============================================================================
   1. RADAR COMPETENCY CHART (5–6 Axis Skill / Rubric Polygon)
   ============================================================================ */
export interface RadarCompetencyChartProps {
  data: RadarDatum[];
  size?: number;
  title?: string;
  className?: string;
}

export const RadarCompetencyChart: React.FC<RadarCompetencyChartProps> = ({
  data,
  size = 248,
  title = "Competency Radar",
  className = "",
}) => {
  const prefersReduced = useReducedMotion();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const gradientId = useId();
  const radius = Math.max(48, Math.round(size * 0.31));
  const padX = 56;
  const padY = 16;

  const geometry = useMemo(
    () => computeRadarGeometry(data, size, radius),
    [data, size, radius],
  );

  if (data.length < 3) {
    return (
      <div className="flex h-48 items-center justify-center rounded-card border border-dashed border-border bg-muted/30 p-4 text-xs text-content-secondary">
        Complete more assessments to render radar breakdown.
      </div>
    );
  }

  const activeVertex =
    hoveredIdx !== null ? geometry.vertices[hoveredIdx] : null;
  const avgScore = Math.round(
    geometry.vertices.reduce((sum, v) => sum + v.clampedValue, 0) /
      geometry.vertices.length,
  );

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative flex w-full max-w-[330px] items-center justify-center">
        <svg
          viewBox={`${-padX} ${-padY} ${size + padX * 2} ${size + padY * 2}`}
          className="h-auto w-full"
          role="img"
          aria-label={`${title}: average ${avgScore}% across ${data.length} dimensions`}
        >
          <defs>
            <radialGradient id={gradientId} cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.34" />
              <stop
                offset="100%"
                stopColor="var(--primary)"
                stopOpacity="0.08"
              />
            </radialGradient>
          </defs>

          {/* Concentric polygon grid rings */}
          {geometry.rings.map((points, idx) => (
            <polygon
              key={idx}
              points={points}
              fill="none"
              stroke="var(--border-default)"
              strokeWidth={idx === geometry.rings.length - 1 ? 1.25 : 0.85}
              strokeDasharray={
                idx === geometry.rings.length - 1 ? undefined : "3 3"
              }
              opacity={0.85}
            />
          ))}

          {/* Spoke axes */}
          {geometry.axes.map((axis, idx) => (
            <line
              key={idx}
              x1={axis.x1}
              y1={axis.y1}
              x2={axis.x2}
              y2={axis.y2}
              stroke="var(--border-default)"
              strokeWidth={0.85}
              opacity={0.75}
            />
          ))}

          {/* Animated competency polygon */}
          <motion.path
            d={geometry.polygonPath}
            fill={`url(#${gradientId})`}
            stroke="var(--primary)"
            strokeWidth={2}
            strokeLinejoin="round"
            initial={
              prefersReduced
                ? false
                : { opacity: 0, scale: 0.72, transformOrigin: "50% 50%" }
            }
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: "some" }}
            transition={{ duration: 0.55, ease: CHART_EASE }}
          />

          {/* Interactive vertices & axis labels */}
          {geometry.vertices.map((vertex, idx) => {
            const isHovered = hoveredIdx === idx;
            const textAnchor =
              Math.abs(vertex.labelX - size / 2) < 8
                ? "middle"
                : vertex.labelX > size / 2
                  ? "start"
                  : "end";

            const shortLabel =
              vertex.label.length > 13
                ? `${vertex.label.slice(0, 12)}…`
                : vertex.label;

            return (
              <g
                key={vertex.label}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
                tabIndex={0}
                role="button"
                aria-label={`${vertex.label}: ${Math.round(vertex.clampedValue)}%`}
              >
                <circle
                  cx={vertex.x}
                  cy={vertex.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill="var(--bg-surface)"
                  stroke="var(--primary)"
                  strokeWidth={isHovered ? 2.5 : 2}
                />
                <text
                  x={vertex.labelX}
                  y={vertex.labelY}
                  textAnchor={textAnchor}
                  dominantBaseline="middle"
                  className="fill-content-secondary font-mono text-[10.5px] font-medium transition-colors"
                  style={{
                    fill: isHovered
                      ? "var(--text-heading)"
                      : "var(--text-secondary)",
                  }}
                >
                  {shortLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Live readout strip */}
      <div className="mt-1 flex w-full items-center justify-between rounded-input border border-border bg-muted/50 px-3 py-1.5 text-xs">
        <span className="truncate font-medium text-content-body">
          {activeVertex ? activeVertex.label : `${title} Average`}
        </span>
        <span className="font-mono font-semibold text-primary tabular-nums">
          {activeVertex
            ? `${Math.round(activeVertex.clampedValue)}%`
            : `${avgScore}%`}
        </span>
      </div>
    </div>
  );
};

/* ============================================================================
   2. AREA TREND CHART (Readiness & Session Progression Trajectory)
   ============================================================================ */
export interface AreaTrendChartProps {
  data: AreaPointDatum[];
  height?: number;
  unit?: string;
  min?: number;
  max?: number;
  title?: string;
  className?: string;
}

export const AreaTrendChart: React.FC<AreaTrendChartProps> = ({
  data,
  height = 148,
  unit = "%",
  min = 0,
  max = 100,
  title = "Readiness trend",
  className = "",
}) => {
  const prefersReduced = useReducedMotion();
  const gradientId = useId();
  const [activeIdx, setActiveIdx] = useState<number>(Math.max(0, data.length - 1));
  const width = 420;

  const geometry = useMemo(
    () =>
      computeAreaChartGeometry(
        data,
        width,
        height,
        { top: 18, right: 16, bottom: 26, left: 16 },
        { min, max },
      ),
    [data, width, height, min, max],
  );

  if (data.length === 0) {
    return null;
  }

  const activePoint =
    geometry.points[Math.min(activeIdx, geometry.points.length - 1)] ??
    geometry.points[0];

  const gridLines = [0.25, 0.5, 0.75].map((ratio) => {
    const plotH = height - 18 - 26;
    return 18 + plotH * ratio;
  });

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-content-secondary">
          {activePoint.label}
          {activePoint.note ? ` · ${activePoint.note}` : ""}
        </span>
        <span className="font-mono font-semibold text-primary tabular-nums">
          {activePoint.value}
          {unit}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={`${title}: latest value ${data[data.length - 1]?.value ?? 0}${unit}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {gridLines.map((y, idx) => (
          <line
            key={idx}
            x1={16}
            y1={y}
            x2={width - 16}
            y2={y}
            stroke="var(--border-default)"
            strokeWidth={0.85}
            strokeDasharray="3 4"
            opacity={0.75}
          />
        ))}

        {/* Soft gradient area fill */}
        <motion.path
          d={geometry.areaPath}
          fill={`url(#${gradientId})`}
          initial={prefersReduced ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: "some" }}
          transition={{ duration: 0.5, delay: 0.1, ease: CHART_EASE }}
        />

        {/* Animated trajectory line */}
        <motion.path
          d={geometry.linePath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={prefersReduced ? false : { pathLength: 0, opacity: 0.4 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, amount: "some" }}
          transition={{ duration: 0.72, ease: CHART_EASE }}
        />

        {/* Active vertical guide */}
        <line
          x1={activePoint.x}
          y1={14}
          x2={activePoint.x}
          y2={height - 26}
          stroke="var(--primary)"
          strokeWidth={1}
          strokeDasharray="2 3"
          opacity={0.5}
        />

        {/* Interactive nodes & x-axis labels */}
        {geometry.points.map((pt, idx) => {
          const isActive = idx === Math.min(activeIdx, geometry.points.length - 1);
          return (
            <g
              key={`${pt.label}-${idx}`}
              className="cursor-pointer"
              onMouseEnter={() => setActiveIdx(idx)}
              onFocus={() => setActiveIdx(idx)}
              onClick={() => setActiveIdx(idx)}
              tabIndex={0}
              role="button"
              aria-label={`${pt.label}: ${pt.value}${unit}`}
            >
              <circle cx={pt.x} cy={pt.y} r={12} fill="transparent" />
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isActive ? 5 : 3.25}
                fill="var(--bg-surface)"
                stroke="var(--primary)"
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <text
                x={pt.x}
                y={height - 8}
                textAnchor="middle"
                className="font-mono text-[10px]"
                style={{
                  fill: isActive
                    ? "var(--text-heading)"
                    : "var(--text-secondary)",
                }}
              >
                {pt.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* ============================================================================
   3. DONUT DISTRIBUTION CHART (Multi-Segment Breakdown + Legend)
   ============================================================================ */
export interface DonutDistributionChartProps {
  data: DonutDatum[];
  centerValue: React.ReactNode;
  centerLabel: string;
  size?: number;
  className?: string;
}

export const DonutDistributionChart: React.FC<DonutDistributionChartProps> = ({
  data,
  centerValue,
  centerLabel,
  size = 136,
  className = "",
}) => {
  const prefersReduced = useReducedMotion();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;

  const { total, segments } = useMemo(
    () => computeDonutSegments(data, radius),
    [data, radius],
  );

  const activeSeg = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <div
      className={`flex flex-col items-center gap-5 sm:flex-row sm:items-center ${className}`}
    >
      <div
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          role="img"
          aria-label={`${centerLabel}: ${total} total`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--bg-muted)"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <motion.circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={TONE_FILL[seg.tone]}
                strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="butt"
                className="cursor-pointer transition-[stroke-width] duration-150"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                initial={prefersReduced ? false : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: "some" }}
                transition={{
                  duration: 0.45,
                  delay: idx * 0.08,
                  ease: CHART_EASE,
                }}
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-xl font-bold tracking-tight text-content-heading tabular-nums">
            {activeSeg ? activeSeg.value : centerValue}
          </span>
          <span className="max-w-[84px] truncate text-[10px] font-medium uppercase tracking-wider text-content-secondary">
            {activeSeg ? activeSeg.label : centerLabel}
          </span>
        </div>
      </div>

      <ul className="w-full flex-1 space-y-2 text-xs">
        {data.map((item) => {
          const segIdx = segments.findIndex((s) => s.label === item.label);
          const seg = segIdx >= 0 ? segments[segIdx] : null;
          const isHovered = segIdx >= 0 && hoveredIdx === segIdx;

          return (
            <li
              key={item.label}
              onMouseEnter={() => segIdx >= 0 && setHoveredIdx(segIdx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between gap-3 rounded-sm px-2 py-1 transition-colors ${
                isHovered ? "bg-muted" : ""
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-[3px] ${TONE_BG_CLASS[item.tone]}`}
                  aria-hidden="true"
                />
                <span className="truncate font-medium text-content-body">
                  {item.label}
                </span>
              </span>
              <span className="shrink-0 font-mono font-semibold text-content-heading tabular-nums">
                {item.value}
                <span className="ml-1.5 font-normal text-content-secondary">
                  ({seg ? seg.percentage : 0}%)
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/* ============================================================================
   4. SEGMENTED BAR CHART (GPU-Only scaleX Animated Horizontal Bars)
   ============================================================================ */
export interface SegmentedBarChartProps {
  items: BarDatum[];
  max?: number;
  valueSuffix?: string;
  className?: string;
}

export const SegmentedBarChart: React.FC<SegmentedBarChartProps> = ({
  items,
  max,
  valueSuffix = "",
  className = "",
}) => {
  const prefersReduced = useReducedMotion();
  const normalized = useMemo(
    () => normalizeBarItems(items, max),
    [items, max],
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {normalized.map((item, idx) => {
        const tone = item.tone ?? "primary";
        return (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <div className="min-w-0">
                <span className="font-medium text-content-heading">
                  {item.label}
                </span>
                {item.sublabel && (
                  <span className="ml-1.5 text-[11px] text-content-secondary">
                    {item.sublabel}
                  </span>
                )}
              </div>
              <span className="shrink-0 font-mono font-semibold text-content-heading tabular-nums">
                {item.value}
                {valueSuffix}
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-sm bg-muted">
              <motion.div
                initial={prefersReduced ? false : { scaleX: 0 }}
                whileInView={{ scaleX: item.scaleX }}
                viewport={{ once: true, amount: "some" }}
                transition={{
                  duration: 0.48,
                  delay: idx * 0.05,
                  ease: CHART_EASE,
                }}
                style={{ transformOrigin: "0% 50%" }}
                className={`h-full w-full rounded-sm ${TONE_BG_CLASS[tone]}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
