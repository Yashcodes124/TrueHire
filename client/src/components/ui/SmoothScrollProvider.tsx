import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";

/**
 * Integrates Lenis smooth scrolling cleanly across the SPA.
 * - Automatically bypassed when `prefers-reduced-motion: reduce` is enabled.
 * - Cleans up RAF & Lenis instance on unmount.
 * - Resets scroll position cleanly on top-level route transitions.
 */
export const SmoothScrollProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { pathname } = useLocation();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.2,
    });
    lenisRef.current = lenis;

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };
    rafId = window.requestAnimationFrame(raf);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        window.cancelAnimationFrame(rafId);
        lenis.destroy();
        lenisRef.current = null;
      }
    };

    mediaQuery.addEventListener("change", handleMotionChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMotionChange);
      window.cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [pathname]);

  return <>{children}</>;
};
