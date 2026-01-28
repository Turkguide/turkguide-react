import { useState, useEffect } from "react";
import { lsGet, lsSet } from "../../utils/localStorage";
import { KEY } from "../../constants";

/**
 * Hook for Settings operations
 */
export function useSettings({ booted }) {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(() =>
    lsGet(KEY.SETTINGS, { chatEnabled: true, readReceipts: true, msgNotifications: true })
  );

  // Restore from localStorage on boot
  useEffect(() => {
    if (!booted) return;
    setSettings(
      lsGet(KEY.SETTINGS, {
        chatEnabled: true,
        readReceipts: true,
        msgNotifications: true,
      })
    );
  }, [booted]);

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
