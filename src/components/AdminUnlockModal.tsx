import React, { useState } from 'react';
import { Lock, KeyRound, X, Check, ShieldAlert } from 'lucide-react';

interface AdminUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purposeMessage?: string;
}

export const AdminUnlockModal: React.FC<AdminUnlockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  purposeMessage
}) => {
  const [pinCode, setPinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (pinCode.trim() === '59205920') {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setPinCode('');
        onSuccess();
      }, 600);
    } else {
      setErrorMsg('Incorrect Admin Code. Please check and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-800">
            <Lock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Enter Admin Code</h3>
            <p className="text-xs text-slate-500">
              {purposeMessage || 'Enter code to unlock admin capabilities'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Admin Access Granted!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>Admin Access Code</span>
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={12}
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              placeholder="Enter Admin Code"
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 focus:ring-4 focus:ring-amber-500/10 text-slate-900 text-center font-mono text-lg tracking-widest rounded-2xl px-4 py-3 outline-none transition-all placeholder:text-slate-400 shadow-inner"
              autoFocus
            />
            <p className="text-[10.5px] text-slate-400 mt-1.5 text-center font-medium">
              Regular users can view & comment on posts without code. Enter admin code for report & solve access.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm transition-all shadow-lg shadow-amber-200 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Unlock Access</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
