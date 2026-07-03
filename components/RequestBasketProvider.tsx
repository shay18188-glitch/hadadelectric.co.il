"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { RequestBasketItem } from "@/types/product";
import {
  addBasketItem,
  clearBasket,
  getServerSnapshot,
  getSnapshot,
  removeBasketItem,
  subscribe,
} from "@/lib/requestBasketStore";
import { useHasMounted } from "@/lib/useHasMounted";

interface RequestBasketContextValue {
  items: RequestBasketItem[];
  count: number;
  isReady: boolean;
  addItem: (item: RequestBasketItem) => void;
  removeItem: (modelNumber: string) => void;
  clear: () => void;
  isInBasket: (modelNumber: string) => boolean;
}

const RequestBasketContext = createContext<RequestBasketContextValue | null>(null);

export function RequestBasketProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isReady = useHasMounted();

  const isInBasket = useCallback(
    (modelNumber: string) => items.some((p) => p.modelNumber === modelNumber),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      isReady,
      addItem: addBasketItem,
      removeItem: removeBasketItem,
      clear: clearBasket,
      isInBasket,
    }),
    [items, isReady, isInBasket]
  );

  return <RequestBasketContext.Provider value={value}>{children}</RequestBasketContext.Provider>;
}

export function useRequestBasket(): RequestBasketContextValue {
  const ctx = useContext(RequestBasketContext);
  if (!ctx) {
    throw new Error("useRequestBasket must be used within a RequestBasketProvider");
  }
  return ctx;
}
