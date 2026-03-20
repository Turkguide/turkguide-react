import { useEffect, useState } from "react";

export function useNotificationMenu({ markAllAsRead, setActive }) {
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

  const touchNotificationsSeen = () => {
    markAllAsRead?.();
  };

  const openNotificationsMenu = () => {
    setShowNotificationsMenu((prev) => !prev);
  };

  const closeNotificationsMenu = () => {
    setShowNotificationsMenu(false);
  };

  const viewAllNotifications = () => {
    closeNotificationsMenu();
    setActive?.("notifications");
  };

  useEffect(() => {
    if (!showNotificationsMenu) return;
    const handleDocPress = () => {
      closeNotificationsMenu();
    };
    document.addEventListener("mousedown", handleDocPress);
    document.addEventListener("touchstart", handleDocPress);
    return () => {
      document.removeEventListener("mousedown", handleDocPress);
      document.removeEventListener("touchstart", handleDocPress);
    };
  }, [showNotificationsMenu]);

  return {
    showNotificationsMenu,
    setShowNotificationsMenu,
    touchNotificationsSeen,
    openNotificationsMenu,
    closeNotificationsMenu,
    viewAllNotifications,
  };
}
