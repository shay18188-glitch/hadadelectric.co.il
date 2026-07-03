"use client";

import { useSyncExternalStore } from "react";

function subscribeNoop() {
  return () => {};
}

/**
 * Returns false during SSR/hydration and true immediately after the
 * component has mounted on the client — without calling setState inside
 * an effect (avoids hydration mismatches the recommended way, per
 * https://react.dev/reference/react/useSyncExternalStore).
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
}
