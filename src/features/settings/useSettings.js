import { useState, useEffect } from "react";
import { lsGet, lsSet } from "../../utils/localStorage";
import { KEY } from "../../constants";

/**
 * Hook for Settings operations
 */
const defaultSettings = () => ({
  chatEnabled: true,
  readReceipts: true,
  msgNotifications: true,
  notificationsEnabled: true,
});

export function useSettings({ booted }) {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(() => lsGet(KEY.SETTINGS, defaultSettings()));

  // Persist to localStorage
  useEffect(() => {
    if (booted) lsSet(KEY.SETTINGS, settings);
  }, [settings, booted]);

  return {
    // State
    showSettings,
    setShowSettings,
    settings,
    setSettings,
  };
}
