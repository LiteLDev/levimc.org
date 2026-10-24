// Per-viewer preferences that live outside React (localStorage, attributes the
// pre-paint script set on <html>), read with useSyncExternalStore: the server
// and the hydrating client render the default, then the stored value — no
// hydration mismatch, no effect that sets state.
import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Tells every {@link useStored} reader that a stored value changed. */
export function notifyStored(): void {
  for (const listener of listeners) listener();
}

/** `read()` in the browser (re-read after {@link notifyStored}); `fallback` on the server and while hydrating. */
export function useStored<T extends string | null>(read: () => T, fallback: T): T {
  return useSyncExternalStore(subscribe, read, () => fallback);
}
