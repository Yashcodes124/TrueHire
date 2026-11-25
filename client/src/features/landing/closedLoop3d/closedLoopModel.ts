import type { AppTheme } from "../../../lib/theme";

export interface ClosedLoopStage {
  index: string;
  id: string;
  stage: string;
  shortLabel: string;
  summary: string;
  artifact: string;
  loopImpact: string;
}

export const CLOSED_LOOP_STAGES: readonly ClosedLoopStage[] = [
  {
    index: "01",
    id: "resume",
    stage: "Resume",
    shortLabel: "Resume",
    summary: "Extract skills you can review and edit.",
    artifact: "Editable baseline skill inventory",
    loopImpact: "Establishes your starting profile from PDF or DOCX uploads.",
  },
  {
    index: "02",
    id: "matching",
    stage: "Job Matching",
    shortLabel: "Job Match",
    summary: "Compare your skills against role requirements.",
    artifact: "Transparent requirement coverage",
    loopImpact: "Receives updated proof from Stage 06 to recalculate fit scores.",
  },
  {
    index: "03",
    id: "gaps",
    stage: "Skill Gaps",
    shortLabel: "Skill Gaps",
    summary: "Rank missing skills by role frequency.",
    artifact: "High-leverage gap queue",
    loopImpact: "Surfaces which single missing skill unlocks the most saved roles.",
  },
  {
    index: "04",
    id: "interview",
    stage: "Interview",
    shortLabel: "Interview",
    summary: "Answer questions focused on weak or missing skills.",
    artifact: "Scoped 15–60 min mock session",
    loopImpact: "Tests unvalidated resume claims and targeted role gaps directly.",
  },
  {
    index: "05",
    id: "evaluation",
    stage: "Evaluation",
    shortLabel: "Evaluation",
    summary: "Score each answer against a clear rubric.",
    artifact: "6-axis rubric scorecard",
    loopImpact: "Converts technical trade-offs into verifiable competency signals.",
  },
  {
    index: "06",
    id: "profile",
    stage: "Skill Profile",
    shortLabel: "Skill Profile",
    summary: "Carry verified evidence into your next job match.",
    artifact: "Evidence-backed skill profile",
    loopImpact: "Loops verified proof back into Job Matching (Stage 02).",
  },
] as const;

export interface OrbitalPoint3D {
  x: number;
  y: number;
  z: number;
  angleRad: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface ClosedLoopThemePalette {
  background: string;
  fog: string;
  ringPrimary: string;
  ringSecondary: string;
  ringMetalness: number;
  ringRoughness: number;
  nodeBase: string;
  nodeInset: string;
  nodeCollar: string;
  nodeActive: string;
  nodeHover: string;
  nodeIndexBg: string;
  nodeIndexText: string;
  nodeIndexActiveText: string;
  trackTube: string;
  returnArc: string;
  tickMajor: string;
  tickMinor: string;
  coreCrystal: string;
  coreWireframe: string;
  keyLightColor: string;
  keyLightIntensity: number;
  hemiSkyColor: string;
  hemiGroundColor: string;
  hemiIntensity: number;
  rimLightColor: string;
  rimLightIntensity: number;
  shadowOpacity: number;
}

export interface WebGLRenderGateInput {
  prefersReducedMotion: boolean;
  webglSupported: boolean;
  contextLost: boolean;
  userPrefers2D?: boolean;
}

export interface WebGLRenderGateResult {
  mode: "webgl" | "static-svg";
  reason: "active" | "reduced-motion" | "no-webgl" | "context-lost" | "user-2d";
}

/**
 * Computes evenly spaced orbital coordinates around a tilted ellipse.
 * Stage 01 sits at upper-left-front and advances smoothly clockwise (top-down).
 */
export function computeOrbitalNodePositions(
  count: number = CLOSED_LOOP_STAGES.length,
  radiusX: number = 3.05,
  radiusZ: number = 2.35,
  elevationWave: number = 0.22,
): OrbitalPoint3D[] {
  if (count <= 0) return [];
  const startAngle = -Math.PI * 0.78;
  const positions: OrbitalPoint3D[] = [];

  for (let i = 0; i < count; i += 1) {
    const angleRad = startAngle + (i / count) * Math.PI * 2;
    const x = Math.cos(angleRad) * radiusX;
    const z = Math.sin(angleRad) * radiusZ;
    const y = Math.sin(angleRad * 2) * elevationWave;
    positions.push({ x, y, z, angleRad });
  }

  return positions;
}

/**
 * Computes a point along the continuous closed-loop ellipse for `progress` in [0, 1).
 */
export function computeLoopPathPoint(
  progress: number,
  radiusX: number = 3.05,
  radiusZ: number = 2.35,
  elevationWave: number = 0.22,
): Point3D {
  const wrapped = ((progress % 1) + 1) % 1;
  const startAngle = -Math.PI * 0.78;
  const angleRad = startAngle + wrapped * Math.PI * 2;
  return {
    x: Math.cos(angleRad) * radiusX,
    y: Math.sin(angleRad * 2) * elevationWave,
    z: Math.sin(angleRad) * radiusZ,
  };
}

/**
 * Generates sample points along an elevated quadratic Bezier return arc
 * bridging Stage 06 (Skill Profile) directly back into Stage 02 (Job Matching).
 */
export function computeReturnFeedbackArcPoints(
  from: Point3D,
  to: Point3D,
  apexY: number = 1.48,
  segments: number = 28,
): Point3D[] {
  const safeSegments = Math.max(4, Math.floor(segments));
  const controlX = (from.x + to.x) * 0.35;
  const controlZ = (from.z + to.z) * 0.35 - 0.18;
  const controlY = Math.max(from.y, to.y) + apexY;

  const points: Point3D[] = [];
  for (let i = 0; i <= safeSegments; i += 1) {
    const t = i / safeSegments;
    const inv = 1 - t;
    const x = inv * inv * from.x + 2 * inv * t * controlX + t * t * to.x;
    const y = inv * inv * from.y + 2 * inv * t * controlY + t * t * to.y;
    const z = inv * inv * from.z + 2 * inv * t * controlZ + t * t * to.z;
    points.push({ x, y, z });
  }
  return points;
}

/**
 * Calibrates Three.js PBR surface & lighting colors strictly to TrueHire's
 * Obsidian Dark and Swiss Ivory & Klein Cobalt design tokens.
 */
export function getClosedLoopThemePalette(
  theme: AppTheme,
): ClosedLoopThemePalette {
  if (theme === "swiss") {
    return {
      background: "#f8f6f1",
      fog: "#f8f6f1",
      ringPrimary: "#d8d1c2",
      ringSecondary: "#c4bba8",
      ringMetalness: 0.22,
      ringRoughness: 0.44,
      nodeBase: "#ffffff",
      nodeInset: "#ece8df",
      nodeCollar: "#9d9483",
      nodeActive: "#1d4ed8",
      nodeHover: "#2563eb",
      nodeIndexBg: "#f5f3ee",
      nodeIndexText: "#111318",
      nodeIndexActiveText: "#1d4ed8",
      trackTube: "#b8afa0",
      returnArc: "#15803d",
      tickMajor: "#59606d",
      tickMinor: "#c2b9a8",
      coreCrystal: "#1d4ed8",
      coreWireframe: "#1e3a8a",
      keyLightColor: "#fff8ee",
      keyLightIntensity: 2.35,
      hemiSkyColor: "#edf3ff",
      hemiGroundColor: "#e8e2d5",
      hemiIntensity: 1.35,
      rimLightColor: "#3b82f6",
      rimLightIntensity: 0.85,
      shadowOpacity: 0.16,
    };
  }

  return {
    background: "#0d1219",
    fog: "#0d1219",
    ringPrimary: "#243144",
    ringSecondary: "#32435b",
    ringMetalness: 0.72,
    ringRoughness: 0.3,
    nodeBase: "#151d28",
    nodeInset: "#0f151e",
    nodeCollar: "#3a4c66",
    nodeActive: "#3b82f6",
    nodeHover: "#60a5fa",
    nodeIndexBg: "#11161e",
    nodeIndexText: "#cbd5e1",
    nodeIndexActiveText: "#60a5fa",
    trackTube: "#2d3d54",
    returnArc: "#4ade80",
    tickMajor: "#64748b",
    tickMinor: "#243144",
    coreCrystal: "#3b82f6",
    coreWireframe: "#60a5fa",
    keyLightColor: "#fff4e6",
    keyLightIntensity: 2.5,
    hemiSkyColor: "#93c5fd",
    hemiGroundColor: "#0c1118",
    hemiIntensity: 1.15,
    rimLightColor: "#3b82f6",
    rimLightIntensity: 1.45,
    shadowOpacity: 0.42,
  };
}

/**
 * Pure gating predicate controlling when WebGL 3D renders vs. the static SVG schematic.
 */
export function shouldRenderWebGL3D(
  input: WebGLRenderGateInput,
): WebGLRenderGateResult {
  if (input.userPrefers2D) {
    return { mode: "static-svg", reason: "user-2d" };
  }
  if (input.prefersReducedMotion) {
    return { mode: "static-svg", reason: "reduced-motion" };
  }
  if (!input.webglSupported) {
    return { mode: "static-svg", reason: "no-webgl" };
  }
  if (input.contextLost) {
    return { mode: "static-svg", reason: "context-lost" };
  }
  return { mode: "webgl", reason: "active" };
}

/**
 * Computes restrained, clamped rotational offsets in radians from pointer & scroll input
 * so the orbital assembly feels tactile without ever disorienting the viewer.
 */
export function computeScrollTiltTarget(
  scrollProgress: number,
  pointerX: number,
  pointerY: number,
): { rotX: number; rotY: number } {
  const clampedScroll = Math.max(-1, Math.min(1, scrollProgress));
  const clampedPx = Math.max(-1, Math.min(1, pointerX));
  const clampedPy = Math.max(-1, Math.min(1, pointerY));

  const basePitch = 0.24;
  const rotX = basePitch + clampedPy * 0.11 + clampedScroll * 0.09;
  const rotY = clampedPx * 0.18 + clampedScroll * 0.28;

  return { rotX, rotY };
}
