"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoogleConnectButtonProps {
  returnTo?: string;
  connected?: boolean;
  onDisconnect?: () => void;
  label?: string;
  connectedLabel?: string;
}

export function GoogleConnectButton({
  returnTo = "/settings",
  connected,
  onDisconnect,
  label = "Connect Google Calendar",
  connectedLabel = "Connected to Google Calendar",
}: GoogleConnectButtonProps) {
  if (connected) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-emerald-600">{connectedLabel}</span>
        <Button variant="outline" size="sm" onClick={onDisconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button asChild variant="outline" className="gap-2">
      <Link href={`/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`}>
        <Calendar className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}
