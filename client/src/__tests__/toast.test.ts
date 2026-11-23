import { describe, expect, it } from "vitest";
import {
  clearToasts,
  createToastItem,
  DEFAULT_TOAST_DURATIONS,
  dismissToast,
  enqueueToast,
  MAX_VISIBLE_TOASTS,
} from "../lib/toast";

describe("global toast queue state", () => {
  it("assigns default tone durations and generates unique IDs", () => {
    const first = createToastItem({ title: "Saved role", tone: "success" }, 100);
    const second = createToastItem({ title: "Network error", tone: "danger" }, 200);

    expect(first.id).not.toBe(second.id);
    expect(first.durationMs).toBe(DEFAULT_TOAST_DURATIONS.success);
    expect(second.durationMs).toBe(DEFAULT_TOAST_DURATIONS.danger);
  });

  it("caps the visible stack at MAX_VISIBLE_TOASTS by evicting oldest items", () => {
    let queue = clearToasts();
    for (let i = 1; i <= MAX_VISIBLE_TOASTS + 2; i += 1) {
      queue = enqueueToast(
        queue,
        createToastItem({ id: `t-${i}`, title: `Toast ${i}` }, i * 10),
      );
    }

    expect(queue).toHaveLength(MAX_VISIBLE_TOASTS);
    expect(queue.map((t) => t.id)).toEqual(["t-3", "t-4", "t-5", "t-6"]);
  });

  it("replaces existing toast cleanly when a matching id is enqueued", () => {
    let queue = enqueueToast(
      [],
      createToastItem({ id: "theme-switch", title: "Obsidian Dark" }, 100),
    );
    queue = enqueueToast(
      queue,
      createToastItem({ id: "other", title: "Job saved" }, 150),
    );
    queue = enqueueToast(
      queue,
      createToastItem({ id: "theme-switch", title: "Swiss Cobalt" }, 200),
    );

    expect(queue).toHaveLength(2);
    expect(queue.map((t) => t.id)).toEqual(["other", "theme-switch"]);
    expect(queue[1].title).toBe("Swiss Cobalt");
  });

  it("dismisses a specific toast and clears all toasts", () => {
    const a = createToastItem({ id: "a", title: "A" }, 1);
    const b = createToastItem({ id: "b", title: "B" }, 2);
    const queue = [a, b];

    expect(dismissToast(queue, "a").map((t) => t.id)).toEqual(["b"]);
    expect(clearToasts()).toEqual([]);
  });
});
