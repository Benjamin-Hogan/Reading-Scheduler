export function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return true;
  if (!window.isSecureContext) return false;
  try {
    return typeof indexedDB !== "undefined";
  } catch {
    return false;
  }
}
