import type { AppTheme } from "../../../lib/theme";

export interface HeroStackLayerSpec {
  id: "resume" | "coverage" | "proof";
  index: string;
  label: string;
  headline: string;
  detail: string;
  baseY: number;
  accentKind: "neutral" | "primary" | "success";
}

export const HERO_STACK_LAYERS: readonly HeroStackLayerSpec[] = [
  {
    id: "resume",
    index: "01",
    label: "Resume Signals",
    headline: "Structured baseline skills",
    detail: "PDF & DOCX experience parsed into an editable skill vector.",
    baseY: -1.18,
    accentKind: "neutral",
  },
  {
    id: "coverage",
    index: "02",
    label: "Role Coverage",
    headline: "Transparent requirement mapping",
    detail: "Every active job scored by exact matched, weak, and missing skills.",
    baseY: 0.0,
    accentKind: "primary",
  },
  {
    id: "proof",
    index: "03",
    label: "Interview Proof",
    headline: "Verified rubric evidence",
    detail: "Targeted mock interview scores flow back into your live role fit.",
    baseY: 1.18,
    accentKind: "success",
  },
] as const;

export interface HeroStackThemePalette {
  background: string;
  fog: string;
  slabBody: string;
  slabActiveBody: string;
  slabRim: string;
  slabActiveRim: string;
  panelSurface: string;
  panelGridLine: string;
  panelTextPrimary: string;
  panelTextMuted: string;
  primary: string;
  primaryBright: string;
  success: string;
  warning: string;
  conduitBase: string;
  gridDot: string;
  keyLightColor: string;
  keyLightIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  rimLightColor: string;
  rimLightIntensity: number;
  shadowOpacity: number;
  metalness: number;
  roughness: number;
}

export interface LayerOffsetTarget {
  y: number;
  zSlide: number;
  scale: number;
}

/**
 * Computes smoothly spaced exploded vertical offsets & forward slide
 * for each architectural slab when a specific layer is focused.
 */
export function computeLayerTargets(
  activeIndex: number,
  hoveredIndex: number | null,
): LayerOffsetTarget[] {
  const focus = hoveredIndex ?? activeIndex;
  return HERO_STACK_LAYERS.map((layer, idx) => {
    const isFocused = idx === focus;
    let separation = 0;
    if (idx > focus) separation = 0.28;
    else if (idx < focus) separation = -0.24;

    return {
      y: layer.baseY + separation,
      zSlide: isFocused ? 0.32 : 0,
      scale: isFocused ? 1.035 : 0.985,
    };
  });
}

/**
 * Computes subtle architectural camera/assembly tilt from pointer coordinates.
 */
export function computeHeroPointerTilt(
  pointerX: number,
  pointerY: number,
): { rotX: number; rotY: number } {
  const px = Math.max(-1, Math.min(1, pointerX));
  const py = Math.max(-1, Math.min(1, pointerY));
  return {
    rotX: 0.34 + py * 0.08,
    rotY: -0.52 + px * 0.14,
  };
}

/**
 * Calibrates the 3D Hero Verification Stack materials & lighting
 * strictly to TrueHire's Obsidian Dark and Swiss Ivory & Klein Cobalt tokens.
 */
export function getHeroStackThemePalette(
  theme: AppTheme,
): HeroStackThemePalette {
  if (theme === "swiss") {
    return {
      background: "#f5f3ee",
      fog: "#f5f3ee",
      slabBody: "#ffffff",
      slabActiveBody: "#ffffff",
      slabRim: "#cdc5b6",
      slabActiveRim: "#1d4ed8",
      panelSurface: "#faf8f4",
      panelGridLine: "#e4dfd4",
      panelTextPrimary: "#111318",
      panelTextMuted: "#646c79",
      primary: "#1d4ed8",
      primaryBright: "#2563eb",
      success: "#15803d",
      warning: "#b45309",
      conduitBase: "#b7afa0",
      gridDot: "#c5bdb0",
      keyLightColor: "#fffaf2",
      keyLightIntensity: 2.3,
      hemiSky: "#f0f5ff",
      hemiGround: "#e9e3d7",
      hemiIntensity: 1.45,
      rimLightColor: "#2563eb",
      rimLightIntensity: 0.75,
      shadowOpacity: 0.14,
      metalness: 0.14,
      roughness: 0.38,
    };
  }

  return {
    background: "#0a0e14",
    fog: "#0a0e14",
    slabBody: "#131b26",
    slabActiveBody: "#172231",
    slabRim: "#2b3b52",
    slabActiveRim: "#3b82f6",
    panelSurface: "#0f151f",
    panelGridLine: "#1e2a3b",
    panelTextPrimary: "#f1f5f9",
    panelTextMuted: "#8b9bb0",
    primary: "#3b82f6",
    primaryBright: "#60a5fa",
    success: "#4ade80",
    warning: "#fbbf24",
    conduitBase: "#30425c",
    gridDot: "#243247",
    keyLightColor: "#fff5e8",
    keyLightIntensity: 2.45,
    hemiSky: "#93c5fd",
    hemiGround: "#0a0e14",
    hemiIntensity: 1.2,
    rimLightColor: "#3b82f6",
    rimLightIntensity: 1.55,
    shadowOpacity: 0.44,
    metalness: 0.62,
    roughness: 0.28,
  };
}
