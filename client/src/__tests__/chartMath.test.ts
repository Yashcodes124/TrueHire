import { describe, expect, it } from "vitest";
import {
  clampPercent,
  computeAreaChartGeometry,
  computeDonutSegments,
  computeRadarGeometry,
  normalizeBarItems,
} from "../lib/chartMath";

describe("chartMath geometry utilities", () => {
  it("clamps invalid or out-of-range percentages safely", () => {
    expect(clampPercent(-12)).toBe(0);
    expect(clampPercent(145)).toBe(100);
    expect(clampPercent(Number.NaN)).toBe(0);
    expect(clampPercent(68)).toBe(68);
  });

  it("computes deterministic radar vertices and closed polygon path", () => {
    const result = computeRadarGeometry(
      [
        { label: "Frontend", value: 100 },
        { label: "Backend", value: 50 },
        { label: "Database", value: 80 },
        { label: "Cloud", value: 40 },
      ],
      200,
      80,
    );

    expect(result.vertices).toHaveLength(4);
    expect(result.axes).toHaveLength(4);
    expect(result.rings).toHaveLength(4);
    // First axis points straight up (-PI/2): x = 100, y = 100 - 80 = 20
    expect(result.vertices[0].x).toBe(100);
    expect(result.vertices[0].y).toBe(20);
    expect(result.polygonPath.startsWith("M 100 20")).toBe(true);
    expect(result.polygonPath.endsWith("Z")).toBe(true);
  });

  it("computes area chart points within plot bounds and handles single-point data", () => {
    const multi = computeAreaChartGeometry(
      [
        { label: "S1", value: 50 },
        { label: "S2", value: 75 },
        { label: "S3", value: 90 },
      ],
      300,
      140,
      { top: 10, right: 10, bottom: 20, left: 10 },
      { min: 0, max: 100 },
    );

    expect(multi.points).toHaveLength(3);
    expect(multi.points[0].x).toBe(10);
    expect(multi.points[2].x).toBe(290);
    expect(multi.linePath).toContain("C ");
    expect(multi.areaPath.endsWith("Z")).toBe(true);

    const single = computeAreaChartGeometry(
      [{ label: "Only", value: 60 }],
      200,
      100,
    );
    expect(single.points).toHaveLength(1);
    expect(single.areaPath.endsWith("Z")).toBe(true);
  });

  it("handles zero-sum donut datasets without NaN and normalizes bar scales", () => {
    const emptyDonut = computeDonutSegments(
      [
        { label: "Verified", value: 0, tone: "success" },
        { label: "Weak", value: 0, tone: "warning" },
      ],
      40,
    );
    expect(emptyDonut.total).toBe(0);
    expect(emptyDonut.segments).toEqual([]);

    const donut = computeDonutSegments(
      [
        { label: "Verified", value: 6, tone: "success" },
        { label: "Resume", value: 4, tone: "primary" },
      ],
      50,
    );
    expect(donut.total).toBe(10);
    expect(donut.segments).toHaveLength(2);
    expect(donut.segments[0].percentage).toBe(60);
    expect(donut.segments[1].percentage).toBe(40);

    const bars = normalizeBarItems([
      { label: "Saved", value: 8 },
      { label: "Applied", value: 4 },
      { label: "Offer", value: 0 },
    ]);
    expect(bars[0].scaleX).toBe(1);
    expect(bars[1].scaleX).toBe(0.5);
    expect(bars[2].scaleX).toBe(0);
  });
});
