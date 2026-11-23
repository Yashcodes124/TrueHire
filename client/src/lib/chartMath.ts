export interface RadarDatum {
  label: string;
  value: number; // 0..100
  detail?: string;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface RadarVertex extends RadarDatum {
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  angleRad: number;
  clampedValue: number;
}

export interface RadarGeometry {
  vertices: RadarVertex[];
  polygonPath: string;
  rings: string[];
  axes: Array<{ x1: number; y1: number; x2: number; y2: number }>;
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

/**
 * Computes deterministic SVG coordinates for a polygon radar chart.
 */
export function computeRadarGeometry(
  data: readonly RadarDatum[],
  size: number,
  radius: number,
  ringLevels: readonly number[] = [25, 50, 75, 100],
): RadarGeometry {
  const cx = size / 2;
  const cy = size / 2;
  const count = data.length;

  if (count === 0) {
    return { vertices: [], polygonPath: "", rings: [], axes: [] };
  }

  const angleStep = (Math.PI * 2) / count;
  const startAngle = -Math.PI / 2;

  const vertices: RadarVertex[] = data.map((datum, idx) => {
    const clampedValue = clampPercent(datum.value);
    const angleRad = startAngle + idx * angleStep;
    const r = (clampedValue / 100) * radius;
    const labelRadius = radius + 24;

    return {
      ...datum,
      clampedValue,
      angleRad,
      x: Number((cx + Math.cos(angleRad) * r).toFixed(2)),
      y: Number((cy + Math.sin(angleRad) * r).toFixed(2)),
      labelX: Number((cx + Math.cos(angleRad) * labelRadius).toFixed(2)),
      labelY: Number((cy + Math.sin(angleRad) * labelRadius).toFixed(2)),
    };
  });

  const polygonPath =
    vertices
      .map((v, i) => `${i === 0 ? "M" : "L"} ${v.x} ${v.y}`)
      .join(" ") + " Z";

  const rings = ringLevels.map((level) => {
    const r = (clampPercent(level) / 100) * radius;
    const pts = data.map((_, idx) => {
      const a = startAngle + idx * angleStep;
      return `${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`;
    });
    return pts.join(" ");
  });

  const axes = data.map((_, idx) => {
    const a = startAngle + idx * angleStep;
    return {
      x1: cx,
      y1: cy,
      x2: Number((cx + Math.cos(a) * radius).toFixed(2)),
      y2: Number((cy + Math.sin(a) * radius).toFixed(2)),
    };
  });

  return { vertices, polygonPath, rings, axes };
}

export interface AreaPointDatum {
  label: string;
  value: number;
  note?: string;
}

export interface ComputedAreaPoint extends AreaPointDatum {
  x: number;
  y: number;
}

export interface AreaChartGeometry {
  points: ComputedAreaPoint[];
  linePath: string;
  areaPath: string;
  minValue: number;
  maxValue: number;
}

/**
 * Computes smooth cubic-bezier SVG line & area paths for trend sparklines/charts.
 */
export function computeAreaChartGeometry(
  data: readonly AreaPointDatum[],
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number } = {
    top: 16,
    right: 16,
    bottom: 28,
    left: 16,
  },
  fixedDomain?: { min: number; max: number },
): AreaChartGeometry {
  if (data.length === 0) {
    return {
      points: [],
      linePath: "",
      areaPath: "",
      minValue: 0,
      maxValue: 100,
    };
  }

  const values = data.map((d) => (Number.isFinite(d.value) ? d.value : 0));
  const minValue = fixedDomain ? fixedDomain.min : Math.min(...values, 0);
  const rawMax = fixedDomain ? fixedDomain.max : Math.max(...values, 10);
  const maxValue = rawMax === minValue ? minValue + 10 : rawMax;

  const plotW = Math.max(1, width - padding.left - padding.right);
  const plotH = Math.max(1, height - padding.top - padding.bottom);
  const baselineY = padding.top + plotH;

  const points: ComputedAreaPoint[] = data.map((d, idx) => {
    const xRatio = data.length === 1 ? 0.5 : idx / (data.length - 1);
    const val = Number.isFinite(d.value) ? d.value : 0;
    const yRatio = Math.max(
      0,
      Math.min(1, (val - minValue) / (maxValue - minValue)),
    );
    return {
      ...d,
      x: Number((padding.left + xRatio * plotW).toFixed(2)),
      y: Number((baselineY - yRatio * plotH).toFixed(2)),
    };
  });

  if (points.length === 1) {
    const p = points[0];
    const linePath = `M ${padding.left} ${p.y} L ${padding.left + plotW} ${p.y}`;
    const areaPath = `${linePath} L ${padding.left + plotW} ${baselineY} L ${padding.left} ${baselineY} Z`;
    return { points, linePath, areaPath, minValue, maxValue };
  }

  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const curr = points[i];
    const next = points[i + 1];
    const midX = Number(((curr.x + next.x) / 2).toFixed(2));
    linePath += ` C ${midX} ${curr.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
  }

  const first = points[0];
  const last = points[points.length - 1];
  const areaPath = `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;

  return { points, linePath, areaPath, minValue, maxValue };
}

export interface DonutDatum {
  label: string;
  value: number;
  tone: "primary" | "success" | "warning" | "danger" | "neutral";
}

export interface ComputedDonutSegment extends DonutDatum {
  percentage: number;
  dashArray: string;
  dashOffset: number;
}

/**
 * Computes stroke-dasharray / stroke-dashoffset segments for a multi-slice SVG donut.
 */
export function computeDonutSegments(
  data: readonly DonutDatum[],
  radius: number,
): { total: number; circumference: number; segments: ComputedDonutSegment[] } {
  const circumference = 2 * Math.PI * radius;
  const sanitized = data.map((d) => ({
    ...d,
    value: Number.isFinite(d.value) && d.value > 0 ? d.value : 0,
  }));
  const total = sanitized.reduce((sum, item) => sum + item.value, 0);

  if (total <= 0) {
    return { total: 0, circumference, segments: [] };
  }

  let accumulated = 0;
  const segments: ComputedDonutSegment[] = sanitized
    .filter((d) => d.value > 0)
    .map((item) => {
      const ratio = item.value / total;
      const segLen = ratio * circumference;
      const dashOffset = -accumulated;
      accumulated += segLen;

      return {
        ...item,
        percentage: Math.round(ratio * 100),
        dashArray: `${segLen.toFixed(2)} ${(circumference - segLen).toFixed(2)}`,
        dashOffset: Number(dashOffset.toFixed(2)),
      };
    });

  return { total, circumference, segments };
}

export interface BarDatum {
  label: string;
  value: number;
  tone?: "primary" | "success" | "warning" | "danger" | "neutral";
  sublabel?: string;
}

export interface NormalizedBarItem extends BarDatum {
  percentage: number;
  scaleX: number;
}

export function normalizeBarItems(
  items: readonly BarDatum[],
  explicitMax?: number,
): NormalizedBarItem[] {
  const safeValues = items.map((i) =>
    Number.isFinite(i.value) && i.value > 0 ? i.value : 0,
  );
  const maxVal =
    explicitMax && explicitMax > 0
      ? explicitMax
      : Math.max(...safeValues, 0);

  return items.map((item, idx) => {
    const val = safeValues[idx];
    const ratio = maxVal > 0 ? Math.min(1, val / maxVal) : 0;
    return {
      ...item,
      value: val,
      percentage: Math.round(ratio * 100),
      scaleX: Number(ratio.toFixed(4)),
    };
  });
}
