"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { copyTextToClipboard } from "@/lib/calendar/feed-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface GoogleOAuthConfig {
  oauthConfigured: boolean;
  booksApiConfigured: boolean;
  usesFixedRedirectUri: boolean;
  javascriptOrigin: string;
  redirectUri: string;
}

export function GoogleOAuthSetup() {
  const [config, setConfig] = useState<GoogleOAuthConfig | null>(null);
  const [copied, setCopied] = useState<"origin" | "redirect" | null>(null);

  useEffect(() => {
    fetch("/api/auth/google/config")
      .then((r) => r.json())
      .then((data: GoogleOAuthConfig) => setConfig(data))
      .catch(() => {});
  }, []);

  if (!config) return null;

  const handleCopy = async (value: string, field: "origin" | "redirect") => {
    const ok = await copyTextToClipboard(value);
    if (ok) {
      setCopied(field);
      window.setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <div>
        <p className="font-medium">Google Cloud registration</p>
        <p className="mt-1 text-xs text-zinc-500">
          Add these URLs in{" "}
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-indigo-600 underline"
          >
            Google Cloud Console
            <ExternalLink className="h-3 w-3" />
          </a>{" "}
          for the URL you are using now. Full steps are in{" "}
          <code className="text-xs">docs/google-cloud-setup.md</code>.
        </p>
      </div>

      {!config.oauthConfigured && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          OAuth is not configured — set <code className="text-xs">GOOGLE_CLIENT_ID</code> and{" "}
          <code className="text-xs">GOOGLE_CLIENT_SECRET</code> in <code className="text-xs">.env.local</code>{" "}
          and restart the dev server.
        </p>
      )}

      {config.usesFixedRedirectUri && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          <code className="text-xs">GOOGLE_REDIRECT_URI</code> is set in the environment. Remove it
          for LAN/tunnel testing so OAuth uses your current origin.
        </p>
      )}

      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-500">Authorized JavaScript origin</label>
        <div className="flex gap-2">
          <Input readOnly value={config.javascriptOrigin} className="h-8 text-xs" />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            silent
            onClick={() => handleCopy(config.javascriptOrigin, "origin")}
            aria-label="Copy JavaScript origin"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
        {copied === "origin" && <p className="text-xs text-emerald-600">Copied</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-500">Authorized redirect URI</label>
        <div className="flex gap-2">
          <Input readOnly value={config.redirectUri} className="h-8 text-xs" />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            silent
            onClick={() => handleCopy(config.redirectUri, "redirect")}
            aria-label="Copy redirect URI"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
        {copied === "redirect" && <p className="text-xs text-emerald-600">Copied</p>}
      </div>

      {!config.booksApiConfigured && (
        <p className="text-xs text-zinc-500">
          Optional: set <code className="text-xs">GOOGLE_BOOKS_API_KEY</code> in{" "}
          <code className="text-xs">.env.local</code> for higher book-search limits.
        </p>
      )}
    </div>
  );
}
