import React from "react";

interface SceneErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface SceneErrorBoundaryState {
  hasError: boolean;
}

/**
 * Scoped ErrorBoundary wrapping the lazy Three.js viewport so any WebGL or
 * shader initialization failure cleanly falls back to the static schematic
 * without interrupting the rest of the Landing Page.
 */
export class SceneErrorBoundary extends React.Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  constructor(props: SceneErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.warn("[ClosedLoop3D] Falling back to static diagram:", error.message);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
