"use client";

type Toast = { id: number; text: string };

let current: Toast | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<(t: Toast | null) => void>();

export function toast(text: string) {
  current = { id: Date.now(), text };
  listeners.forEach((l) => l(current));
  clearTimeout(timer);
  timer = setTimeout(() => {
    current = null;
    listeners.forEach((l) => l(null));
  }, 2600);
}

export function onToast(fn: (t: Toast | null) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
