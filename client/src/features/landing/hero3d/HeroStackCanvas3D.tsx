import React, { useEffect, useRef } from "react";
import type { AppTheme } from "../../../lib/theme";
import { HeroStackSceneController } from "./HeroStackSceneController";

export interface HeroStackCanvas3DProps {
  theme: AppTheme;
  activeLayerIndex: number;
  onSelectLayer: (index: number) => void;
  onHoverLayer?: (index: number | null) => void;
  onContextLost: () => void;
}

const HeroStackCanvas3D: React.FC<HeroStackCanvas3DProps> = ({
  theme,
  activeLayerIndex,
  onSelectLayer,
  onHoverLayer,
  onContextLost,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<HeroStackSceneController | null>(null);
  const callbacksRef = useRef({
    onSelectLayer,
    onHoverLayer,
    onContextLost,
  });

  callbacksRef.current = {
    onSelectLayer,
    onHoverLayer,
    onContextLost,
  };

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    const controller = new HeroStackSceneController({
      container: mountEl,
      initialTheme: theme,
      initialActiveLayer: activeLayerIndex,
      onSelectLayer: (idx) => callbacksRef.current.onSelectLayer(idx),
      onHoverLayer: (idx) => callbacksRef.current.onHoverLayer?.(idx),
      onContextLost: () => callbacksRef.current.onContextLost(),
    });
    controllerRef.current = controller;

    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
    // Single stable WebGL mount lifecycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    controllerRef.current?.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    controllerRef.current?.setActiveLayer(activeLayerIndex);
  }, [activeLayerIndex]);

  useEffect(() => {
    controllerRef.current?.setCallbacks({
      onSelectLayer: (idx) => callbacksRef.current.onSelectLayer(idx),
      onHoverLayer: (idx) => callbacksRef.current.onHoverLayer?.(idx),
      onContextLost: () => callbacksRef.current.onContextLost(),
    });
  }, [onSelectLayer, onHoverLayer, onContextLost]);

  return (
    <div
      ref={mountRef}
      data-testid="hero-3d-canvas"
      className="h-[340px] w-full flex-1 sm:h-[400px] lg:h-[430px]"
    />
  );
};

export default HeroStackCanvas3D;
