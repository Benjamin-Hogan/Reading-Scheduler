"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

/** Renders children only after mount — avoids SSR/client mismatches for browser-only APIs. */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
