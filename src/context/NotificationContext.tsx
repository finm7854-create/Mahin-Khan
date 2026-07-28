import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppNotification, NotificationSettings, NotificationType } from '../types';
import { playNotificationChime } from '../lib/audio';

const STORAGE_NOTIFS_KEY = 'bugboard_notifications_v2';
const STORAGE_SETTINGS_KEY = 'bugboard_notif_settings_v1';

const DEFAULT_SETTINGS: NotificationSettings = {
  commentNotifications: true,
  newEntryNotifications: true,
  problemSolveNotifications: true,
  soundEnabled: true,
};

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  settings: NotificationSettings;
  activeToast: AppNotification | null;
  showSettingsModal: boolean;
  addNotification: (params: {
    type: NotificationType;
    title: string;
    message: string;
    bugId: string;
    bugTitle?: string;
    authorName?: string;
    authorPhoto?: string;
  }) => void;
  markAllAsRead: () => void;
  clearToast: () => void;
  deleteNotification: (id: string) => void;
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;
  setShowSettingsModal: (show: boolean) => void;
  requestBrowserPermission: () => Promise<string>;
  browserPermission: string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_NOTIFS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse notifications:', e);
    }
    return [
      {
        id: 'welcome_notif_1',
        type: 'new_bug',
        title: 'Welcome to Bug Board Notifications!',
        message: 'You will receive instant official popups and audio chimes when issues are created, commented on, or solved.',
        bugId: '',
        createdAt: new Date().toISOString(),
        read: false,
      }
    ];
  });

  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse notification settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [browserPermission, setBrowserPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  // Unread count calculation
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Persist notifications
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_NOTIFS_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Failed to persist notifications:', e);
    }
  }, [notifications]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to persist notification settings:', e);
    }
  }, [settings]);

  // Request browser permission
  const requestBrowserPermission = async (): Promise<string> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setBrowserPermission(res);
        return res;
      } catch (e) {
        console.warn('Failed to request browser notification permission:', e);
      }
    }
    return 'denied';
  };

  // Add Notification
  const addNotification = (params: {
    type: NotificationType;
    title: string;
    message: string;
    bugId: string;
    bugTitle?: string;
    authorName?: string;
    authorPhoto?: string;
  }) => {
    // Check setting toggles before triggering
    if (params.type === 'comment' && !settings.commentNotifications) return;
    if (params.type === 'new_bug' && !settings.newEntryNotifications) return;
    if (params.type === 'solved_bug' && !settings.problemSolveNotifications) return;

    // Deduplicate rapid identical notifications
    const nowMs = Date.now();
    setNotifications((prev) => {
      const isDup = prev.some(
        (n) =>
          n.type === params.type &&
          n.bugId === params.bugId &&
          n.message === params.message &&
          nowMs - new Date(n.createdAt).getTime() < 4000
      );
      if (isDup) return prev;

      const newNotif: AppNotification = {
        id: 'notif_' + nowMs + '_' + Math.random().toString(36).substring(2, 7),
        type: params.type,
        title: params.title,
        message: params.message,
        bugId: params.bugId,
        bugTitle: params.bugTitle,
        authorName: params.authorName,
        authorPhoto: params.authorPhoto,
        createdAt: new Date().toISOString(),
        read: false,
      };

      // Set active toast popup
      setActiveToast(newNotif);

      // Play chime sound if enabled
      if (settings.soundEnabled) {
        playNotificationChime();
      }

      // Native browser notification if granted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(params.title, {
            body: params.message,
            tag: newNotif.id,
          });
        } catch (e) {
          console.warn('Browser Desktop Notification error:', e);
        }
      }

      return [newNotif, ...prev];
    });
  };

  // Mark all notifications as read (resets unread counter)
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Clear active popup toast
  const clearToast = () => {
    setActiveToast(null);
  };

  // Delete notification
  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Update Settings
  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        settings,
        activeToast,
        showSettingsModal,
        addNotification,
        markAllAsRead,
        clearToast,
        deleteNotification,
        updateSettings,
        setShowSettingsModal,
        requestBrowserPermission,
        browserPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
};
