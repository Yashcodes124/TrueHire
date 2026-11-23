export type ToastTone = "success" | "info" | "warning" | "danger";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastInput {
  id?: string;
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
  action?: ToastAction;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  durationMs: number;
  createdAt: number;
  action?: ToastAction;
}

export const MAX_VISIBLE_TOASTS = 4;

export const DEFAULT_TOAST_DURATIONS: Record<ToastTone, number> = {
  success: 3600,
  info: 3200,
  warning: 4800,
  danger: 5600,
};

let toastCounter = 0;

export function createToastId(prefix = "toast"): string {
  toastCounter += 1;
  return `${prefix}-${Date.now()}-${toastCounter}`;
}

export function createToastItem(
  input: ToastInput,
  now: number = Date.now(),
): ToastItem {
  const tone: ToastTone = input.tone ?? "info";
  const durationMs =
    typeof input.durationMs === "number" && input.durationMs >= 0
      ? input.durationMs
      : DEFAULT_TOAST_DURATIONS[tone];

  return {
    id: input.id?.trim() ? input.id.trim() : createToastId(),
    title: input.title,
    description: input.description,
    tone,
    durationMs,
    createdAt: now,
    action: input.action,
  };
}

/**
 * Pure queue insertion:
 * - Replaces an existing toast if `id` matches (deduplication for rapid toggles).
 * - Places newest toast at the end of the stack.
 * - Caps visible queue to `maxVisible` by evicting the oldest entries.
 */
export function enqueueToast(
  current: readonly ToastItem[],
  item: ToastItem,
  maxVisible: number = MAX_VISIBLE_TOASTS,
): ToastItem[] {
  const filtered = current.filter((existing) => existing.id !== item.id);
  const next = [...filtered, item];
  if (next.length <= maxVisible) {
    return next;
  }
  return next.slice(next.length - maxVisible);
}

export function dismissToast(
  current: readonly ToastItem[],
  id: string,
): ToastItem[] {
  return current.filter((item) => item.id !== id);
}

export function clearToasts(): ToastItem[] {
  return [];
}
