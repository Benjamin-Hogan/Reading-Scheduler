"use client";

import { useEffect, useState } from "react";
import { isStorageAvailable } from "@/lib/db/storage";

export function StorageGuard({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    setBlocked(!isStorageAvailable());
  }, []);

  if (!blocked) return <>{children}</>;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-medium">Local storage unavailable</p>
        <p className="mt-1">
          Open the app at{" "}
          <a href="http://localhost:3000" className="font-medium underline">
            http://localhost:3000
          </a>{" "}
          (not a network IP). Books, plans, and settings require a secure browser context.
        </p>
      </div>
      {children}
    </div>
  );
}
