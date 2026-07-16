import type { RequestBasketItem } from "@/types/product";

const STORAGE_KEY = "hadad-electric-request-basket";

let items: RequestBasketItem[] = [];
let hydrated = false;
const EMPTY_SERVER_SNAPSHOT: RequestBasketItem[] = [];
const listeners = new Set<() => void>();

function readFromStorage(): RequestBasketItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage unavailable (private mode etc.) — fail silently.
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

function ensureHydrated() {
  if (!hydrated && typeof window !== "undefined") {
    items = readFromStorage();
    hydrated = true;
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        items = readFromStorage();
        notify();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", handleStorage);
    };
  }
  return () => listeners.delete(listener);
}

export function getSnapshot(): RequestBasketItem[] {
  ensureHydrated();
  return items;
}

export function getServerSnapshot(): RequestBasketItem[] {
  return EMPTY_SERVER_SNAPSHOT;
}

export function addBasketItem(item: RequestBasketItem): void {
  ensureHydrated();
  if (items.some((p) => p.modelNumber === item.modelNumber)) return;
  items = [...items, item];
  persist();
  notify();
}

export function removeBasketItem(modelNumber: string): void {
  ensureHydrated();
  items = items.filter((p) => p.modelNumber !== modelNumber);
  persist();
  notify();
}

export function clearBasket(): void {
  items = [];
  persist();
  notify();
}
