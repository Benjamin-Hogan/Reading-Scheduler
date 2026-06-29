"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const SettingsClient = dynamic(() => import("./SettingsClient"), {
  ssr: false,
  loading: () => <p className="text-zinc-500">Loading settings...</p>,
});

export default function SettingsPageClient() {
  return (
    <Suspense fallback={<p className="text-zinc-500">Loading settings...</p>}>
      <SettingsClient />
    </Suspense>
  );
}
