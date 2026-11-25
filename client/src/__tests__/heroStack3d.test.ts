import { describe, expect, it } from "vitest";
import {
  HERO_STACK_LAYERS,
  computeHeroPointerTilt,
  computeLayerTargets,
  getHeroStackThemePalette,
} from "../features/landing/hero3d/heroStackModel";
import { buildSupportMailtoHref } from "../features/support/SupportPage";

describe("heroStackModel pure math & theming", () => {
  it("defines 3 stacked verification layers in ascending vertical order", () => {
    expect(HERO_STACK_LAYERS).toHaveLength(3);
    expect(HERO_STACK_LAYERS[0].baseY).toBeLessThan(HERO_STACK_LAYERS[1].baseY);
    expect(HERO_STACK_LAYERS[1].baseY).toBeLessThan(HERO_STACK_LAYERS[2].baseY);
  });

  it("explodes layers symmetrically around the focused layer and slides it forward", () => {
    const targets = computeLayerTargets(1, null);
    expect(targets[1].zSlide).toBeGreaterThan(0);
    expect(targets[1].scale).toBeGreaterThan(1);
    expect(targets[0].y).toBeLessThan(HERO_STACK_LAYERS[0].baseY);
    expect(targets[2].y).toBeGreaterThan(HERO_STACK_LAYERS[2].baseY);

    // Hover overrides active layer focus
    const hovered = computeLayerTargets(1, 2);
    expect(hovered[2].zSlide).toBeGreaterThan(0);
    expect(hovered[1].zSlide).toBe(0);
  });

  it("clamps pointer tilt cleanly within architectural bounds", () => {
    const neutral = computeHeroPointerTilt(0, 0);
    const extremePos = computeHeroPointerTilt(10, 10);
    const maxPos = computeHeroPointerTilt(1, 1);
    const extremeNeg = computeHeroPointerTilt(-10, -10);
    const maxNeg = computeHeroPointerTilt(-1, -1);

    expect(extremePos).toEqual(maxPos);
    expect(extremeNeg).toEqual(maxNeg);
    expect(maxPos.rotY).toBeGreaterThan(neutral.rotY);
    expect(maxNeg.rotY).toBeLessThan(neutral.rotY);
  });

  it("returns calibrated palettes for Obsidian Dark and Swiss Cobalt themes", () => {
    const dark = getHeroStackThemePalette("dark");
    const swiss = getHeroStackThemePalette("swiss");

    expect(dark.background).toBe("#0a0e14");
    expect(dark.primary).toBe("#3b82f6");
    expect(swiss.background).toBe("#f5f3ee");
    expect(swiss.primary).toBe("#1d4ed8");
    expect(swiss.metalness).toBeLessThan(dark.metalness);
  });
});

describe("buildSupportMailtoHref", () => {
  it("constructs a properly encoded mailto link addressed to support@truehire.dev", () => {
    const href = buildSupportMailtoHref({
      name: "  Alex Rivera ",
      email: " alex@example.com ",
      topic: "Product feedback",
      message: "Love the new workspace flow & 3D hero!",
    });

    expect(href.startsWith("mailto:support@truehire.dev?subject=")).toBe(true);
    const decoded = decodeURIComponent(href);
    expect(decoded).toContain("[TrueHire · Product feedback] Message from Alex Rivera");
    expect(decoded).toContain("Reply-To: alex@example.com");
    expect(decoded).toContain("Love the new workspace flow & 3D hero!");
  });
});
