import React, { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type HTMLMotionProps,
} from "framer-motion";

export const EDITORIAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export type RevealDirection = "up" | "left" | "right" | "scale";

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Smooth compositor-only page entrance & exit choreography (Barba.js-inspired).
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = "",
}) => {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.24, ease: EDITORIAL_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export interface ScrollRevealProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  direction?: RevealDirection;
  className?: string;
}

function getDirectionalInitial(direction: RevealDirection, distance: number) {
  switch (direction) {
    case "left":
      return { opacity: 0, x: -distance, y: 0, scale: 1 };
    case "right":
      return { opacity: 0, x: distance, y: 0, scale: 1 };
    case "scale":
      return { opacity: 0, x: 0, y: Math.round(distance * 0.5), scale: 0.96 };
    case "up":
    default:
      return { opacity: 0, x: 0, y: distance, scale: 1 };
  }
}

/**
 * Directional scroll-triggered reveal using compositor-only transform & opacity.
 * Uses `viewport={{ once: true, amount: "some" }}` so tall cards never stay hidden.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delay = 0,
  distance = 20,
  direction = "up",
  className = "",
  ...rest
}) => {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={getDirectionalInitial(direction, distance)}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: "some" }}
      transition={{ duration: 0.44, delay, ease: EDITORIAL_EASE }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export interface StaggerGroupProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const StaggerGroup: React.FC<StaggerGroupProps> = ({
  children,
  className = "",
  staggerDelay = 0.055,
}) => {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: "some" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  direction?: RevealDirection;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className = "",
  direction = "up",
}) => {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        hidden: getDirectionalInitial(direction, 16),
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          transition: { duration: 0.38, ease: EDITORIAL_EASE },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export interface HoverLiftProps {
  children: React.ReactNode;
  className?: string;
  lift?: number;
}

/**
 * Tactile micro-interaction lift on pointer hover (<= 180ms, compositor-only).
 */
export const HoverLift: React.FC<HoverLiftProps> = ({
  children,
  className = "",
  lift = -3,
}) => {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      whileHover={{ y: lift }}
      transition={{ duration: 0.18, ease: EDITORIAL_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
}

/**
 * Zero-re-render pointer-tracking spotlight card inspired by 21st.dev / Aceternity.
 * Updates CSS custom properties `--spot-x` and `--spot-y` directly on mouse move.
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  padding = "md",
  className = "",
  onMouseMove,
  ...rest
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const paddings = {
    none: "p-0",
    sm: "p-4",
    md: "p-5 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
      el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
    }
    onMouseMove?.(e);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`spotlight-card relative overflow-hidden rounded-card border border-border bg-surface shadow-card transition-all duration-200 ease-editorial hover:-translate-y-0.5 hover:border-border-strong hover:shadow-elevated ${paddings[padding]} ${className}`}
      {...rest}
    >
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

export interface ParallaxLayerProps {
  children: React.ReactNode;
  offset?: number;
  className?: string;
}

/**
 * Subtle scroll-linked parallax wrapper (compositor-only transform, skipped under reduced motion).
 */
export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  children,
  offset = 18,
  className = "",
}) => {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
};

/**
 * Subtle 2px reading progress bar fixed at the top of long-form pages.
 */
export const ScrollProgressBar: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 240,
    damping: 32,
    restDelta: 0.001,
  });

  if (prefersReduced) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-primary"
    />
  );
};
