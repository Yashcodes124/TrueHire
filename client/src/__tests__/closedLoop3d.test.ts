import { describe, expect, it } from "vitest";
import {
  CLOSED_LOOP_STAGES,
  computeLoopPathPoint,
  computeOrbitalNodePositions,
  computeReturnFeedbackArcPoints,
  computeScrollTiltTarget,
  getClosedLoopThemePalette,
  shouldRenderWebGL3D,
} from "../features/landing/closedLoop3d/closedLoopModel";

describe("closedLoopModel — pure 3D orbital geometry & gating", () => {
  it("computes 6 distinct, finite orbital coordinates around the ellipse", () => {
    const positions = computeOrbitalNodePositions();
    expect(positions).toHaveLength(CLOSED_LOOP_STAGES.length);

    for (const pt of positions) {
      expect(Number.isFinite(pt.x)).toBe(true);
      expect(Number.isFinite(pt.y)).toBe(true);
      expect(Number.isFinite(pt.z)).toBe(true);
    }

    // Opposite stages (0 vs 3) should sit symmetrically opposite in X and Z
    expect(positions[0].x).toBeCloseTo(-positions[3].x, 5);
    expect(positions[0].z).toBeCloseTo(-positions[3].z, 5);
  });

  it("wraps continuous loop path seamlessly between progress 0 and 1", () => {
    const start = computeLoopPathPoint(0);
    const wrapped = computeLoopPathPoint(1);
    expect(wrapped.x).toBeCloseTo(start.x, 5);
    expect(wrapped.y).toBeCloseTo(start.y, 5);
    expect(wrapped.z).toBeCloseTo(start.z, 5);
  });

  it("generates an elevated return feedback arc bridging Stage 06 back to Stage 02", () => {
    const nodes = computeOrbitalNodePositions();
    const from = nodes[5]; // 06 Skill Profile
    const to = nodes[1]; // 02 Job Matching
    const arc = computeReturnFeedbackArcPoints(from, to, 1.4, 24);

    expect(arc).toHaveLength(25);
    expect(arc[0].x).toBeCloseTo(from.x, 5);
    expect(arc[0].z).toBeCloseTo(from.z, 5);
    expect(arc[arc.length - 1].x).toBeCloseTo(to.x, 5);
    expect(arc[arc.length - 1].z).toBeCloseTo(to.z, 5);

    const mid = arc[Math.floor(arc.length / 2)];
    expect(mid.y).toBeGreaterThan(Math.max(from.y, to.y) + 0.5);
  });

  it("maps Obsidian Dark and Swiss Cobalt themes to TrueHire brand tokens", () => {
    const darkPalette = getClosedLoopThemePalette("dark");
    const swissPalette = getClosedLoopThemePalette("swiss");

    expect(darkPalette.nodeActive.toLowerCase()).toBe("#3b82f6");
    expect(darkPalette.returnArc.toLowerCase()).toBe("#4ade80");
    expect(swissPalette.nodeActive.toLowerCase()).toBe("#1d4ed8");
    expect(swissPalette.returnArc.toLowerCase()).toBe("#15803d");
    expect(darkPalette.background).not.toBe(swissPalette.background);
  });

  it("gates WebGL cleanly for reduced-motion, missing WebGL, context loss, and 2D preference", () => {
    expect(
      shouldRenderWebGL3D({
        prefersReducedMotion: false,
        webglSupported: true,
        contextLost: false,
      }),
    ).toEqual({ mode: "webgl", reason: "active" });

    expect(
      shouldRenderWebGL3D({
        prefersReducedMotion: true,
        webglSupported: true,
        contextLost: false,
      }),
    ).toEqual({ mode: "static-svg", reason: "reduced-motion" });

    expect(
      shouldRenderWebGL3D({
        prefersReducedMotion: false,
        webglSupported: false,
        contextLost: false,
      }),
    ).toEqual({ mode: "static-svg", reason: "no-webgl" });

    expect(
      shouldRenderWebGL3D({
        prefersReducedMotion: false,
        webglSupported: true,
        contextLost: true,
      }),
    ).toEqual({ mode: "static-svg", reason: "context-lost" });

    expect(
      shouldRenderWebGL3D({
        prefersReducedMotion: false,
        webglSupported: true,
        contextLost: false,
        userPrefers2D: true,
      }),
    ).toEqual({ mode: "static-svg", reason: "user-2d" });
  });

  it("clamps scroll and pointer tilt targets to restrained architectural bounds", () => {
    const extreme = computeScrollTiltTarget(10, 5, -5);
    const bounded = computeScrollTiltTarget(1, 1, -1);

    expect(extreme.rotX).toBeCloseTo(bounded.rotX, 6);
    expect(extreme.rotY).toBeCloseTo(bounded.rotY, 6);
    expect(Math.abs(extreme.rotX)).toBeLessThan(0.6);
    expect(Math.abs(extreme.rotY)).toBeLessThan(0.6);
  });
});
