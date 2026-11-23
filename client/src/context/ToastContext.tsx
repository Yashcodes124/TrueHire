import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import {
  clearToasts,
  createToastItem,
  dismissToast,
  enqueueToast,
  type ToastInput,
  type ToastItem,
  type ToastTone,
} from "../lib/toast";

export interface ToastController {
  notify: (input: ToastInput) => string;
  success: (
    title: string,
    description?: string,
    options?: Partial<Omit<ToastInput, "title" | "description" | "tone">>,
  ) => string;
  info: (
    title: string,
    description?: string,
    options?: Partial<Omit<ToastInput, "title" | "description" | "tone">>,
  ) => string;
  warning: (
    title: string,
    description?: string,
    options?: Partial<Omit<ToastInput, "title" | "description" | "tone">>,
  ) => string;
  error: (
    title: string,
    description?: string,
    options?: Partial<Omit<ToastInput, "title" | "description" | "tone">>,
  ) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastController | null>(null);

const TONE_CONFIG: Record<
  ToastTone,
  {
    icon: React.ComponentType<{ className?: string }>;
    iconClass: string;
    ringClass: string;
    barClass: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-status-success",
    ringClass: "border-status-success-border",
    barClass: "bg-status-success",
  },
  info: {
    icon: Info,
    iconClass: "text-primary",
    ringClass: "border-primary/35",
    barClass: "bg-primary",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-status-warning",
    ringClass: "border-status-warning-border",
    barClass: "bg-status-warning",
  },
  danger: {
    icon: AlertCircle,
    iconClass: "text-status-danger",
    ringClass: "border-status-danger-border",
    barClass: "bg-status-danger",
  },
};

interface ToastCardProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
}

const ToastCard = React.forwardRef<HTMLDivElement, ToastCardProps>(
  ({ item, onDismiss }, ref) => {
    const prefersReduced = useReducedMotion();
    const [paused, setPaused] = useState(false);
    const remainingRef = useRef(item.durationMs);
    const startedAtRef = useRef(Date.now());

    useEffect(() => {
      remainingRef.current = item.durationMs;
    }, [item.id, item.durationMs, item.createdAt]);

    useEffect(() => {
      if (item.durationMs <= 0 || paused) return;

      startedAtRef.current = Date.now();
      const timer = window.setTimeout(() => {
        onDismiss(item.id);
      }, Math.max(120, remainingRef.current));

      return () => {
        window.clearTimeout(timer);
        const elapsed = Date.now() - startedAtRef.current;
        remainingRef.current = Math.max(0, remainingRef.current - elapsed);
      };
    }, [item.id, item.durationMs, item.createdAt, paused, onDismiss]);

    const config = TONE_CONFIG[item.tone];
    const Icon = config.icon;

    return (
      <motion.div
        ref={ref}
        layout
        role={item.tone === "danger" ? "alert" : "status"}
        aria-live={item.tone === "danger" ? "assertive" : "polite"}
        initial={
          prefersReduced ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.96 }
        }
        animate={
          prefersReduced ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }
        }
        exit={
          prefersReduced ? { opacity: 0 } : { opacity: 0, x: 20, scale: 0.96 }
        }
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className={`pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-card border bg-surface/95 backdrop-blur-md shadow-elevated ${config.ringClass}`}
      >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <span className={`mt-0.5 shrink-0 ${config.iconClass}`} aria-hidden="true">
          <Icon className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="font-display text-sm font-semibold leading-snug text-content-heading">
            {item.title}
          </p>
          {item.description && (
            <p className="text-xs leading-relaxed text-content-secondary">
              {item.description}
            </p>
          )}
          {item.action && (
            <div className="pt-1.5">
              <button
                type="button"
                onClick={() => {
                  item.action?.onClick();
                  onDismiss(item.id);
                }}
                className="inline-flex items-center rounded-sm text-xs font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {item.action.label}
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDismiss(item.id)}
          aria-label="Dismiss notification"
          className="shrink-0 rounded-sm p-1 text-content-secondary transition-colors hover:bg-muted hover:text-content-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {item.durationMs > 0 && !prefersReduced && (
        <div
          aria-hidden="true"
          className="h-[2px] w-full bg-muted/80"
        >
          <motion.div
            key={`${item.id}-${item.createdAt}-${paused ? "paused" : "run"}`}
            initial={{ scaleX: remainingRef.current / item.durationMs }}
            animate={{ scaleX: paused ? remainingRef.current / item.durationMs : 0 }}
            transition={{
              duration: paused ? 0 : remainingRef.current / 1000,
              ease: "linear",
            }}
            className={`h-full origin-left ${config.barClass}`}
          />
        </div>
      )}
      </motion.div>
    );
  },
);
ToastCard.displayName = "ToastCard";

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => dismissToast(prev, id));
  }, []);

  const clear = useCallback(() => {
    setToasts(clearToasts());
  }, []);

  const notify = useCallback((input: ToastInput) => {
    const item = createToastItem(input);
    setToasts((prev) => enqueueToast(prev, item));
    return item.id;
  }, []);

  const controller = useMemo<ToastController>(
    () => ({
      notify,
      success: (title, description, options) =>
        notify({ title, description, tone: "success", ...options }),
      info: (title, description, options) =>
        notify({ title, description, tone: "info", ...options }),
      warning: (title, description, options) =>
        notify({ title, description, tone: "warning", ...options }),
      error: (title, description, options) =>
        notify({ title, description, tone: "danger", ...options }),
      dismiss,
      clear,
    }),
    [notify, dismiss, clear],
  );

  return (
    <ToastContext.Provider value={controller}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2.5 px-4 sm:inset-x-auto sm:top-auto sm:bottom-5 sm:right-5 sm:items-end sm:px-0"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {toasts.map((item) => (
            <ToastCard key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const NOOP_CONTROLLER: ToastController = {
  notify: () => "",
  success: () => "",
  info: () => "",
  warning: () => "",
  error: () => "",
  dismiss: () => undefined,
  clear: () => undefined,
};

export function useToast(): ToastController {
  return useContext(ToastContext) ?? NOOP_CONTROLLER;
}
