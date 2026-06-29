"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Upload, Cloud } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { useSync } from "@/hooks/use-sync";
import { exportData, importData, downloadJson } from "@/lib/db/export-import";
import { DEFAULT_ACTIVE_DAYS, WEEKDAYS, type WeekdayKey, type PlanTemplate } from "@/lib/db/schema";
import { generateId } from "@/lib/utils";
import { GoogleConnectButton } from "@/components/calendar/GoogleConnectButton";
import { GoogleOAuthSetup } from "@/components/calendar/GoogleOAuthSetup";
import { StorageGuard } from "@/components/layout/StorageGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/layout/motion";
import { setSoundEffectsEnabled, setSoundVolume, playSound } from "@/lib/sounds";
import { Volume2, VolumeX } from "lucide-react";

export default function SettingsPage() {
  const { settings, isLoading, updateSettings, error: settingsError } = useSettings();
  const {
    signedIn,
    email,
    status: syncStatus,
    lastSyncedAt,
    error: syncError,
    syncNow,
    uploadLocalToCloud,
    refreshSession,
  } = useSync();
  const searchParams = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const [googleConnected, setGoogleConnected] = useState(
    () => !!searchParams.get("google_connected")
  );
  const [message, setMessage] = useState<string | null>(() =>
    searchParams.get("google_connected")
      ? "Google account connected — calendar and cloud sync are enabled"
      : null
  );
  const [actionError, setActionError] = useState<string | null>(() => {
    const err = searchParams.get("google_error");
    return err ? `Google connection failed: ${err}` : null;
  });
  const [importStrategy, setImportStrategy] = useState<"merge" | "replace">("merge");
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    fetch("/api/auth/google/status")
      .then((r) => r.json())
      .then((data: { connected?: boolean }) => {
        if (data.connected) setGoogleConnected(true);
      })
      .catch(() => {});
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (searchParams.get("google_connected")) {
      void syncNow();
    }
  }, [searchParams, syncNow]);

  const toggleDay = async (day: WeekdayKey) => {
    const days = settings.defaultActiveDays as WeekdayKey[];
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
    try {
      await updateSettings({
        defaultActiveDays: next.length ? next : [...DEFAULT_ACTIVE_DAYS],
      });
    } catch {
      // error surfaced via settingsError
    }
  };

  const handleExport = async () => {
    setActionError(null);
    try {
      const data = await exportData();
      downloadJson(data);
      setMessage("Backup downloaded");
    } catch (e) {
      setMessage(null);
      setActionError(e instanceof Error ? e.message : "Export failed");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActionError(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importData(data, importStrategy);
      setMessage(`Data imported successfully (${importStrategy})`);
    } catch (err) {
      setMessage(null);
      setActionError(err instanceof Error ? err.message : "Import failed");
    } finally {
      e.target.value = "";
    }
  };

  const handleDisconnect = async () => {
    setActionError(null);
    try {
      await Promise.all([
        fetch("/api/calendar/export", { method: "DELETE" }),
        fetch("/api/auth/session", { method: "DELETE" }),
      ]);
      setGoogleConnected(false);
      await refreshSession();
      setMessage("Disconnected from Google");
    } catch {
      setActionError("Failed to disconnect");
    }
  };

  const handleSyncNow = async () => {
    setActionError(null);
    try {
      await syncNow();
      setMessage("Cloud sync completed");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Sync failed");
    }
  };

  const handleUploadLocal = async () => {
    setActionError(null);
    try {
      await uploadLocalToCloud();
      setMessage("Local data uploaded to cloud");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    const templates = settings.planTemplates ?? [];
    const template: PlanTemplate = {
      id: generateId(),
      name: templateName.trim(),
      layoutMode: "parallel",
      activeDays: [...settings.defaultActiveDays],
      preferredReadTime: settings.preferredReadTime,
      pagesPerDayOverride: null,
    };
    await updateSettings({ planTemplates: [...templates, template] });
    setTemplateName("");
    setMessage(`Template "${template.name}" saved`);
  };

  const handleDeleteTemplate = async (id: string) => {
    const templates = (settings.planTemplates ?? []).filter((t) => t.id !== id);
    await updateSettings({ planTemplates: templates });
    setMessage("Template removed");
  };

  const timezoneOptions = (() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London"];
    }
  })();

  const displayError = actionError ?? settingsError ?? syncError;

  const syncStatusLabel = (() => {
    switch (syncStatus) {
      case "syncing":
        return "Syncing…";
      case "synced":
        return lastSyncedAt
          ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}`
          : "Synced";
      case "offline":
        return "Offline — changes will sync when back online";
      case "error":
        return "Sync error";
      case "signed_out":
        return "Not signed in";
      default:
        return "Ready";
    }
  })();

  return (
    <StorageGuard>
      <FadeIn>
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Settings</h1>
            <p className="text-zinc-500">Defaults, calendar connection, and data backup</p>
          </div>

          {message && (
            <p className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-200">
              {message}
            </p>
          )}
          {displayError && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
              {displayError}
            </p>
          )}

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Reading defaults</CardTitle>
                  <CardDescription>Used when creating new plans</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default active days</Label>
                    <div className="flex flex-wrap gap-3">
                      {WEEKDAYS.map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={(settings.defaultActiveDays as WeekdayKey[]).includes(key)}
                            onCheckedChange={() => toggleDay(key)}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default-time">Default read time</Label>
                    <Input
                      id="default-time"
                      type="time"
                      value={settings.preferredReadTime}
                      onChange={(e) => updateSettings({ preferredReadTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      value={settings.timezone}
                      onChange={(e) => updateSettings({ timezone: e.target.value })}
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      {timezoneOptions.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-zinc-500">
                      Used for calendar export event times
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Plan templates</CardTitle>
                  <CardDescription>
                    Save rhythm presets to reuse when creating plans
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Template name (e.g. Weekday evenings)"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                    <Button variant="outline" onClick={handleSaveTemplate} disabled={!templateName.trim()}>
                      Save
                    </Button>
                  </div>
                  {(settings.planTemplates ?? []).length > 0 ? (
                    <ul className="space-y-2">
                      {(settings.planTemplates ?? []).map((t) => (
                        <li
                          key={t.id}
                          className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                        >
                          <span>{t.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTemplate(t.id)}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-zinc-500">No templates saved yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Experience</CardTitle>
                  <CardDescription>Animations and sound effects</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex cursor-pointer items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {(settings.soundEffectsEnabled ?? true) ? (
                        <Volume2 className="h-5 w-5 text-indigo-500" />
                      ) : (
                        <VolumeX className="h-5 w-5 text-zinc-400" />
                      )}
                      <div>
                        <p className="font-medium">Sound effects</p>
                        <p className="text-sm text-zinc-500">
                          Subtle clicks, chimes, and celebration sounds
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      checked={settings.soundEffectsEnabled ?? true}
                      onCheckedChange={(checked) => {
                        const enabled = checked === true;
                        setSoundEffectsEnabled(enabled);
                        void updateSettings({ soundEffectsEnabled: enabled });
                        if (enabled) playSound("pop");
                      }}
                    />
                  </label>
                  {(settings.soundEffectsEnabled ?? true) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <Label htmlFor="sound-volume">Volume</Label>
                        <span className="text-zinc-500">{settings.soundVolume ?? 100}%</span>
                      </div>
                      <input
                        id="sound-volume"
                        type="range"
                        min={50}
                        max={150}
                        step={5}
                        value={settings.soundVolume ?? 100}
                        onChange={(e) => {
                          const vol = parseInt(e.target.value, 10);
                          setSoundVolume(vol / 100);
                          void updateSettings({ soundVolume: vol });
                        }}
                        onMouseUp={() => playSound("tick")}
                        onTouchEnd={() => playSound("tick")}
                        className="h-2 w-full cursor-pointer accent-indigo-600"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cloud sync</CardTitle>
                  <CardDescription>
                    Keep your library, plans, and progress in sync across phone and desktop
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {signedIn ? (
                    <>
                      <p className="text-sm text-emerald-600">Signed in as {email}</p>
                      <p className="text-sm text-zinc-500">{syncStatusLabel}</p>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={handleSyncNow}
                          disabled={syncStatus === "syncing"}
                        >
                          <Cloud className="h-4 w-4" />
                          Sync now
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleUploadLocal}>
                          Upload local data to cloud
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-zinc-500">
                        Sign in with Google to sync your data across devices.
                      </p>
                      <GoogleConnectButton
                        returnTo="/settings"
                        label="Sign in with Google"
                      />
                    </>
                  )}
                  {showLocalhostHint && !signedIn && (
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      For Google sign-in, use{" "}
                      <a href="http://localhost:3000/settings" className="underline">
                        http://localhost:3000
                      </a>{" "}
                      — OAuth is registered for localhost, not your network IP.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Google Calendar</CardTitle>
                  <CardDescription>Export reading schedules directly to your calendar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <GoogleOAuthSetup />
                  <GoogleConnectButton
                    connected={googleConnected}
                    onDisconnect={handleDisconnect}
                    returnTo="/settings"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data backup</CardTitle>
                  <CardDescription>Export or import your library and plans as JSON</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Import strategy</Label>
                    <div className="flex gap-4 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="import-strategy"
                          checked={importStrategy === "merge"}
                          onChange={() => setImportStrategy("merge")}
                        />
                        Merge with existing data
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="import-strategy"
                          checked={importStrategy === "replace"}
                          onChange={() => setImportStrategy("replace")}
                        />
                        Replace all data
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="gap-2" onClick={handleExport}>
                    <Download className="h-4 w-4" />
                    Export JSON
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => fileRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                    Import JSON
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={handleImport}
                  />
                </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </FadeIn>
    </StorageGuard>
  );
}
