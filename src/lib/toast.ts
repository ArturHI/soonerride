"use client";

export type Toast = { id: number; text: string; href?: string };

let current: Toast | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<(t: Toast | null) => void>();

/** Show a banner. With `href`, it's a tappable notification that stays a little longer. */
export function toast(text: string, href?: string) {
  current = { id: Date.now(), text, href };
  listeners.forEach((l) => l(current));
  clearTimeout(timer);
  timer = setTimeout(
    () => {
      current = null;
      listeners.forEach((l) => l(null));
    },
    href ? 5000 : 2600,
  );
}

export function onToast(fn: (t: Toast | null) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
