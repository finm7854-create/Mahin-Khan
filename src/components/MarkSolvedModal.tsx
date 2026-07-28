import React, { useState } from 'react';
import { CheckCircle2, X, User } from 'lucide-react';

interface MarkSolvedModalProps {
  bugTitle: string;
  onClose: () => void;
  onConfirm: (solverName: string) => void;
  isSubmitting?: boolean;
}

export const MarkSolvedModal: React.FC<MarkSolvedModalProps> = ({
  bugTitle,
  onClose,
  onConfirm,
  isSubmitting = false
}) => {
  const [solverName, setSolverName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(solverName.trim() || 'Anonymous Friend');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 text-emerald-600">
          <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Mark as Solved</h3>
            <p className="text-xs text-slate-500">Squash this bug for everyone on the board</p>
          </div>
        </div>

        <p className="text-xs text-slate-700 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-200 line-clamp-2 font-medium">
          "{bugTitle}"
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Who solved this bug? (Optional)</span>
            </label>
            <input
              type="text"
              value={solverName}
              onChange={(e) => setSolverName(e.target.value)}
              placeholder="e.g. Alex, Sarah, Jordan..."
              className="w-full bg-white border border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 text-slate-900 text-sm rounded-2xl px-4 py-3 outline-none transition-all placeholder:text-slate-400 shadow-sm"
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-200 active:scale-95 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Updating...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Solved</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
