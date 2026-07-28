import React, { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { 
  Bell, 
  X, 
  MessageSquare, 
  Bug, 
  CheckCircle2, 
  Settings, 
  Volume2, 
  VolumeX, 
  Trash2, 
  ExternalLink,
  Sliders,
  Check
} from 'lucide-react';

interface NotificationComponentsProps {
  onSelectBug?: (bugId: string) => void;
}

export const NotificationBell: React.FC<NotificationComponentsProps> = ({ onSelectBug }) => {
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    deleteNotification, 
    setShowSettingsModal 
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    if (!isOpen) {
      // Clicking notification resets unread count
      markAllAsRead();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block">
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-[#1a1a1a]/10 hover:bg-[#1a1a1a]/20 text-[#1a1a1a] transition-all border border-[#1a1a1a]/20 shadow-xs cursor-pointer active:scale-95 group"
        title="Notifications"
      >
        <Bell className={`w-5 h-5 transition-transform group-hover:rotate-12 ${unreadCount > 0 ? 'text-[#005bc1] stroke-[2.5]' : 'text-[#1a1a1a]/70'}`} />
        
        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-rose-600 text-white font-mono text-[11px] font-bold shadow-md animate-pulse border-2 border-[#e5cebc]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop overlay for closing on outside click */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />

          <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-3 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white border border-[#1a1a1a]/15 rounded-3xl shadow-2xl z-50 overflow-hidden text-[#1a1a1a] flex flex-col max-h-[75vh] sm:max-h-[500px] animate-fade-in">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a]/5 border-b border-[#1a1a1a]/10">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#005bc1]" />
                <span className="font-serif-editorial font-bold italic text-base">Notifications</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowSettingsModal(true);
                  }}
                  className="p-1.5 rounded-lg hover:bg-[#1a1a1a]/10 text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition-colors cursor-pointer"
                  title="Notification Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[#1a1a1a]/10 text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#1a1a1a]/10">
              {notifications.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Bell className="w-8 h-8 text-[#1a1a1a]/30 mx-auto" />
                  <p className="text-xs font-serif-editorial italic text-[#1a1a1a]/60">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (notif.bugId && onSelectBug) {
                        onSelectBug(notif.bugId);
                        setIsOpen(false);
                      }
                    }}
                    className={`p-3.5 flex items-start gap-3 hover:bg-[#005bc1]/5 transition-colors cursor-pointer group relative ${
                      !notif.read ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    {/* Type Icon */}
                    <div className="shrink-0 mt-0.5">
                      {notif.type === 'comment' ? (
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                      ) : notif.type === 'solved_bug' ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                          <Bug className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-xs truncate text-[#1a1a1a]">{notif.title}</span>
                        <span className="text-[10px] text-[#1a1a1a]/50 font-mono shrink-0">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-[#1a1a1a]/70 leading-snug line-clamp-2">{notif.message}</p>
                      
                      {notif.bugTitle && (
                        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-[#005bc1] group-hover:underline">
                          View problem <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="absolute top-3 right-3 p-1 rounded hover:bg-rose-100 text-[#1a1a1a]/30 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-[#1a1a1a]/5 border-t border-[#1a1a1a]/10 flex items-center justify-between text-[11px] text-[#1a1a1a]/60">
              <span>{notifications.length} total notifications</span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowSettingsModal(true);
                }}
                className="font-bold text-[#005bc1] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Settings className="w-3 h-3" /> Notification Settings
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Pop-Up Toast (Official software notification popup)
export const NotificationToast: React.FC<{ onSelectBug?: (bugId: string) => void }> = ({ onSelectBug }) => {
  const { activeToast, clearToast } = useNotifications();

  useEffect(() => {
    if (!activeToast) return;

    // Auto dismiss toast after 2 seconds
    const timer = setTimeout(() => {
      clearToast();
    }, 2000);

    return () => clearTimeout(timer);
  }, [activeToast]);

  if (!activeToast) return null;

  return (
    <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-5 sm:top-5 z-[100] sm:max-w-sm w-auto bg-slate-900/95 text-white border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl p-3.5 sm:p-4 flex items-start gap-3.5 animate-slide-in-right">
      <div className="shrink-0 mt-0.5">
        {activeToast.type === 'comment' ? (
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-[#00dce6] border border-blue-400/30 flex items-center justify-center shadow-inner">
            <MessageSquare className="w-5 h-5" />
          </div>
        ) : activeToast.type === 'solved_bug' ? (
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shadow-inner">
            <Bug className="w-5 h-5" />
          </div>
        )}
      </div>

      <div 
        className="flex-1 cursor-pointer pr-4"
        onClick={() => {
          if (activeToast.bugId && onSelectBug) {
            onSelectBug(activeToast.bugId);
          }
          clearToast();
        }}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="font-bold text-xs text-white uppercase tracking-wider font-mono">{activeToast.title}</span>
          <span className="text-[10px] text-white/50 font-mono">Just now</span>
        </div>
        <p className="text-xs text-white/80 mt-1 leading-snug line-clamp-2">{activeToast.message}</p>
        
        {activeToast.bugId && (
          <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-[#00dce6] hover:underline">
            Click to open problem <ExternalLink className="w-3 h-3" />
          </span>
        )}
      </div>

      <button
        onClick={clearToast}
        className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Notification Settings Modal
export const NotificationSettingsModal: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    showSettingsModal, 
    setShowSettingsModal,
    requestBrowserPermission,
    browserPermission
  } = useNotifications();

  if (!showSettingsModal) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-5 text-[#1a1a1a]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-editorial font-bold italic text-lg text-slate-900">Notification Settings</h3>
              <p className="text-xs text-slate-500">Configure alert preferences and sound effects</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettingsModal(false)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Setting Toggles */}
        <div className="space-y-4">
          {/* Comment & Video Notifications */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-colors">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-xs block text-slate-900">Comments & Video Notes</span>
                <span className="text-[11px] text-slate-500 block leading-tight">Notify when users comment on bugs or videos</span>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ commentNotifications: !settings.commentNotifications })}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                settings.commentNotifications ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  settings.commentNotifications ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* New Bug Entry Notifications */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-colors">
            <div className="flex items-start gap-3">
              <Bug className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-xs block text-slate-900">New Bug Submissions</span>
                <span className="text-[11px] text-slate-500 block leading-tight">Notify when a new issue or report is submitted</span>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ newEntryNotifications: !settings.newEntryNotifications })}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                settings.newEntryNotifications ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  settings.newEntryNotifications ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Problem Solved Notifications */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-colors">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-xs block text-slate-900">Task / Problem Solved</span>
                <span className="text-[11px] text-slate-500 block leading-tight">Notify when an issue is finished or solved</span>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ problemSolveNotifications: !settings.problemSolveNotifications })}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                settings.problemSolveNotifications ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  settings.problemSolveNotifications ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sound Effect Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 hover:bg-indigo-50 transition-colors">
            <div className="flex items-start gap-3">
              {settings.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              )}
              <div>
                <span className="font-bold text-xs block text-slate-900">Notification Sound Effect</span>
                <span className="text-[11px] text-slate-500 block leading-tight">Play official chime audio when notifications arrive</span>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                settings.soundEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Web Desktop Notifications Permission */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-xs block text-slate-900">Browser Desktop Popups</span>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  Status: <strong className="capitalize text-indigo-700">{browserPermission}</strong>
                </span>
              </div>
            </div>
            {browserPermission === 'granted' ? (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Active
              </span>
            ) : (
              <button
                onClick={requestBrowserPermission}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                Enable
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2">
          <button
            onClick={() => setShowSettingsModal(false)}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
