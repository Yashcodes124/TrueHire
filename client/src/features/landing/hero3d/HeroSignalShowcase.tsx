import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTheme } from "../../../context/ThemeContext";
import { shouldRenderWebGL3D } from "../closedLoop3d/closedLoopModel";
import { SceneErrorBoundary } from "../closedLoop3d/SceneErrorBoundary";
import { HERO_STACK_LAYERS } from "./heroStackModel";
import { StaticHeroStackDiagram } from "./StaticHeroStackDiagram";

const LazyHeroStackCanvas3D = lazy(() => import("./HeroStackCanvas3D"));

function probeWebGLOnce(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false });
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function readReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const HeroSignalShowcase: React.FC = () => {
  const { theme } = useTheme();
  const [activeLayerIndex, setActiveLayerIndex] = useState<number>(1);
  const [hoveredLayerIndex, setHoveredLayerIndex] = useState<number | null>(
    null,
  );
  const [prefersReducedMotion, setPrefersReducedMotion] =
    useState<boolean>(readReducedMotion);
  const [webglSupported] = useState<boolean>(probeWebGLOnce);
  const [contextLost, setContextLost] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    setPrefersReducedMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const renderGate = useMemo(
    () =>
      shouldRenderWebGL3D({
        prefersReducedMotion,
        webglSupported,
        contextLost,
      }),
    [prefersReducedMotion, webglSupported, contextLost],
  );

  const handleSelectLayer = useCallback((idx: number) => {
    setActiveLayerIndex(idx);
  }, []);

  const handleContextLost = useCallback(() => {
    setContextLost(true);
  }, []);

  const displayIdx = hoveredLayerIndex ?? activeLayerIndex;
  const activeLayer = HERO_STACK_LAYERS[displayIdx] ?? HERO_STACK_LAYERS[1];

  const reasonLabel =
    renderGate.reason === "reduced-motion"
      ? "Static architectural view · Reduced motion"
      : renderGate.reason === "no-webgl"
        ? "Static architectural view · WebGL unavailable"
        : renderGate.reason === "context-lost"
          ? "Static architectural view · Fallback active"
          : undefined;

  const fallbackView = (
    <StaticHeroStackDiagram
      activeLayerIndex={activeLayerIndex}
      onSelectLayer={handleSelectLayer}
      reasonLabel={reasonLabel}
    />
  );

  return (
    <div
      data-testid="hero-3d-showcase"
      data-render-mode={renderGate.mode}
      data-active-layer={activeLayer.id}
      className="flex flex-col overflow-hidden rounded-2xl border border-border-strong/70 bg-surface shadow-elevated"
    >
      {/* Interactive 3D Viewport */}
      <div className="relative flex flex-1 bg-canvas">
        {renderGate.mode === "webgl" ? (
          <SceneErrorBoundary fallback={fallbackView}>
            <Suspense fallback={fallbackView}>
              <LazyHeroStackCanvas3D
                theme={theme}
                activeLayerIndex={activeLayerIndex}
                onSelectLayer={handleSelectLayer}
                onHoverLayer={setHoveredLayerIndex}
                onContextLost={handleContextLost}
              />
            </Suspense>
          </SceneErrorBoundary>
        ) : (
          fallbackView
        )}
      </div>

      {/* Bottom Layer Selector & Quiet Editorial Readout (Zero occlusion over 3D) */}
      <div className="border-t border-border bg-surface px-4 py-3.5 sm:px-5">
        <div
          role="group"
          aria-label="Inspect verification layers"
          className="grid grid-cols-3 gap-1.5 rounded-xl bg-muted/70 p-1"
        >
          {HERO_STACK_LAYERS.map((layer, idx) => {
            const isSelected = idx === activeLayerIndex;
            return (
              <button
                key={layer.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleSelectLayer(idx)}
                onMouseEnter={() => setHoveredLayerIndex(idx)}
                onMouseLeave={() => setHoveredLayerIndex(null)}
                className={`rounded-lg px-2.5 py-1.5 text-center text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? "bg-surface text-content-heading shadow-xs"
                    : "text-content-secondary hover:text-content-heading"
                }`}
              >
                <span className="mr-1.5 font-mono text-[10.5px] text-primary">
                  {layer.index}
                </span>
                <span>{layer.label}</span>
              </button>
            );
          })}
        </div>

        <div
          aria-live="polite"
          className="mt-3 flex flex-wrap items-baseline justify-between gap-2 text-xs"
        >
          <span className="font-display font-semibold text-content-heading">
            {activeLayer.headline}
          </span>
          <span className="text-content-secondary">{activeLayer.detail}</span>
        </div>
      </div>
    </div>
  );
};
