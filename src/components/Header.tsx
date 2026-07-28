import React, { useState, useEffect } from 'react';
import { UserProfile, Bug } from '../types';
import { signInWithGoogle, loginWithGmailAddress, logOut } from '../lib/firebase';
import { LogIn, LogOut, RefreshCw, Sliders, HardDrive, Shield, ShieldCheck, KeyRound, Lock, Bell, Settings, Cloud, Database, X, Mail } from 'lucide-react';
import { NotificationBell } from './NotificationComponents';
import { useNotifications } from '../context/NotificationContext';
import { fetchGoogleStorageQuota, StorageQuotaInfo } from '../lib/drive';

interface HeaderProps {
  user: UserProfile | null;
  bugs?: Bug[];
  isAdminUnlocked?: boolean;
  onOpenAddModal: () => void;
  onOpenControlMenu: () => void;
  onOpenAdminUnlockModal?: () => void;
  onLockAdmin?: () => void;
  onSelectBug?: (bugId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  bugs = [], 
  isAdminUnlocked = false,
  onOpenControlMenu,
  onOpenAdminUnlockModal,
  onLockAdmin,
  onSelectBug
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [driveQuota, setDriveQuota] = useState<StorageQuotaInfo | null>(null);
  const { setShowSettingsModal } = useNotifications();

  // Load live Google Drive storage quota
  const refreshDriveQuota = async () => {
    setIsRefreshing(true);
    try {
      const quota = await fetchGoogleStorageQuota(user?.accessToken);
      setDriveQuota(quota);
    } catch (e) {
      console.warn('Error fetching live Google Storage quota:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

  useEffect(() => {
    refreshDriveQuota();
  }, [user, showProfileMenu]);

  const handleSignIn = () => {
    setShowConnectModal(true);
  };

  // Calculate exact Firebase storage consumption across stored bugs and media payloads
  const calculateFirebaseStorage = () => {
    let totalBytes = 0;
    let totalMediaCount = 0;

    bugs.forEach((bug) => {
      // 1. Text payload size in bytes
      const jsonStr = JSON.stringify(bug);
      totalBytes += new Blob([jsonStr]).size;

      // 2. Count attached media items
      const images = bug.imageUrls?.length || (bug.photoUrl ? 1 : 0);
      const videos = bug.videoUrls?.length || (bug.videoUrl ? 1 : 0);
      const audios = bug.audioUrls?.length || 0;
      totalMediaCount += images + videos + audios;
    });

    // Firebase Spark Free Tier: 1.0 GB Firestore limit (1,073,741,824 bytes)
    const LIMIT_BYTES = 1073741824; 
    const percentUsed = Math.min(100, Number(((totalBytes / LIMIT_BYTES) * 100).toFixed(3)));

    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 KB';
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    const usedFormatted = formatBytes(totalBytes);
    const limitFormatted = '1.0 GB';
    const leftBytes = Math.max(0, LIMIT_BYTES - totalBytes);
    const leftFormatted = formatBytes(leftBytes);

    return {
      totalBytes,
      usedFormatted,
      limitFormatted,
      leftFormatted,
      percentUsed: Math.max(0.1, percentUsed),
      bugCount: bugs.length,
      totalMediaCount
    };
  };

  const storageInfo = calculateFirebaseStorage();

  const handleRefreshStorage = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <header
      className="w-full bg-[#E8D5C8] px-3.5 sm:px-8 py-3.5 sm:py-4 flex justify-between items-center border-b border-[#E8D5C8]/80 shrink-0"
      style={{ minHeight: '72px' }}
    >
      <div className="flex flex-col">
        <h1 className="text-2xl sm:text-3xl font-serif text-[#1D252D] tracking-tight font-semibold">
          Bug Board
        </h1>
        <span className="text-[10px] sm:text-xs font-bold text-[#1D252D] tracking-widest uppercase mt-0.5">
          Shared Bug Tracker
        </span>
      </div>

      <div className="flex items-center gap-3 relative">
        {/* Notification Bell Icon */}
        <NotificationBell onSelectBug={onSelectBug} />

        {user ? (
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-10 h-10 rounded-xl overflow-hidden border border-gray-300 bg-white/50 hover:bg-white transition-all flex items-center justify-center focus:outline-none cursor-pointer active:scale-95 shadow-xs"
            title={user.displayName || user.email || 'User Profile'}
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#1D252D] text-[#EAF3F4] font-bold text-sm flex items-center justify-center">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </button>
        ) : (
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1D252D] text-white hover:bg-[#1D252D]/85 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <LogIn className="w-3.5 h-3.5 text-[#C37C75]" />
            <span>{isSigningIn ? 'Signing in...' : 'Sign In'}</span>
          </button>
        )}

        {/* Click outside backdrop for profile dropdown */}
        {showProfileMenu && user && (
          <div 
            className="fixed inset-0 z-40 bg-black/5" 
            onClick={() => setShowProfileMenu(false)}
          />
        )}

        {showProfileMenu && user && (
          <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white border border-[#1a1a1a]/15 rounded-3xl shadow-2xl p-4 z-50 text-xs text-[#1a1a1a] space-y-3 origin-top-right animate-in fade-in zoom-in-95 duration-150">
            {/* User Header Info */}
            <div className="flex items-center gap-3 pb-3 border-b border-[#1a1a1a]/10">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border border-[#1a1a1a]" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] text-[#f8f7f4] flex items-center justify-center font-bold text-sm">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-bold text-[#1a1a1a] truncate">{user.displayName || 'User'}</p>
                  <span className="font-mono-editorial text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#1a1a1a] text-[#f8f7f4]">
                    {user.role}
                  </span>
                </div>
                <p className="text-[#1a1a1a]/60 truncate text-[11px]">{user.email}</p>
              </div>
            </div>

            {/* Live Google Drive Storage Monitor */}
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between font-mono-editorial text-[10px] uppercase font-bold text-emerald-400">
                <div className="flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="tracking-wider">Google Cloud Storage</span>
                </div>
                <button
                  onClick={refreshDriveQuota}
                  disabled={isRefreshing}
                  className="hover:text-white text-slate-400 transition-colors p-1 cursor-pointer disabled:opacity-50"
                  title="Fetch Live Google Storage Quota"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
                <span className="font-medium text-slate-400">Primary Vault:</span>
                <span className="font-bold text-emerald-300 truncate max-w-[150px]">finm7854@gmail.com</span>
              </div>

              <div className="space-y-1.5 pt-0.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-emerald-400">
                    {driveQuota ? `${driveQuota.leftFormatted} free` : 'Fetching live quota...'}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {driveQuota ? `of ${driveQuota.limitFormatted} limit` : 'Google Account'}
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (driveQuota?.percentUsed || 0) > 90
                        ? 'bg-red-500'
                        : (driveQuota?.percentUsed || 0) > 75
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.max(4, driveQuota?.percentUsed || 15)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[9.5px] text-slate-400 pt-0.5">
                  <span className="font-medium text-slate-300">
                    {driveQuota ? `${driveQuota.usedFormatted} live storage used` : 'Live syncing active'}
                  </span>
                  <span className="font-bold text-emerald-400">{driveQuota?.percentUsed || 0}% used</span>
                </div>
              </div>
            </div>

            {/* Admin Access Status & Code Entry Button */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-[#1a1a1a] space-y-2">
              <div className="flex items-center justify-between font-mono-editorial text-[10px] uppercase font-bold">
                <div className="flex items-center gap-1.5 text-amber-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>Admin Access</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${isAdminUnlocked ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {isAdminUnlocked ? 'UNLOCKED' : 'LOCKED'}
                </span>
              </div>

              {isAdminUnlocked ? (
                <div className="flex items-center justify-between text-[10.5px] pt-1">
                  <span className="text-emerald-800 font-semibold">Report & Solve active</span>
                  {onLockAdmin && (
                    <button
                      onClick={() => {
                        onLockAdmin();
                        setShowProfileMenu(false);
                      }}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Lock Admin
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onOpenAdminUnlockModal) onOpenAdminUnlockModal();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Enter Admin Code</span>
                </button>
              )}
            </div>

            {/* Control Menu Action */}
            <button
              onClick={() => {
                setShowProfileMenu(false);
                onOpenControlMenu();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl bg-[#1a1a1a] hover:bg-[#1a1a1a]/85 text-[#f8f7f4] font-bold font-mono-editorial text-xs uppercase tracking-wider transition-colors cursor-pointer active:scale-95 shadow-sm"
            >
              <Sliders className="w-3.5 h-3.5 text-[#d4a373]" />
              <span>Control Menu</span>
            </button>

            {/* Sign Out Action */}
            <button
              onClick={() => {
                logOut();
                setShowProfileMenu(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold font-mono-editorial text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>

      {/* Connect Gmail Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowConnectModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Connect Gmail Account</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Connect your Gmail account to upload bug reports, images, and videos from any device or phone.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <button
                onClick={async () => {
                  setIsSigningIn(true);
                  try {
                    await signInWithGoogle();
                    setShowConnectModal(false);
                  } catch (err) {
                    console.error('Sign in error', err);
                  } finally {
                    setIsSigningIn(false);
                  }
                }}
                disabled={isSigningIn}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all active:scale-95 shadow-md shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSigningIn ? 'Signing in with Google...' : 'Sign in with Google'}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">or enter Gmail address</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const emailInput = form.elements.namedItem('gmailInput') as HTMLInputElement;
                  if (emailInput && emailInput.value.trim()) {
                    loginWithGmailAddress(emailInput.value.trim());
                    setShowConnectModal(false);
                  }
                }}
                className="space-y-2"
              >
                <input
                  name="gmailInput"
                  type="email"
                  placeholder="your.email@gmail.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Connect Gmail
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
