"use client";

import { useSyncExternalStore } from "react";
import { CURRENCIES, DEFAULT_CURRENCY, type Currency } from "@/lib/domain/money";

const KEY = "currency";
const listeners = new Set<() => void>();

const isCurrency = (value: unknown): value is Currency =>
  typeof value === "string" && Object.hasOwn(CURRENCIES, value);

function read(): Currency {
  try {
    const saved = localStorage.getItem(KEY);
    return isCurrency(saved) ? saved : DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY; // storage blocked (private mode, etc.)
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep other open tabs in sync.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    current = read();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setCurrency(currency: Currency) {
  try {
    localStorage.setItem(KEY, currency);
  } catch {
    // Not saved, but still switch for this page view.
  }
  current = currency;
  for (const listener of listeners) listener();
}

let current: Currency | undefined;

/**
 * The shopper's display currency. The server always renders PHP; the
 * browser switches after hydration, so static pages stay static.
 */
export function useCurrency(): Currency {
  return useSyncExternalStore(
    subscribe,
    () => current ?? (current = read()),
    () => DEFAULT_CURRENCY,
  );
}
