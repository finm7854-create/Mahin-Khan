import React, { useState } from 'react';
import { Bug } from '../types';
import { 
  Sliders, 
  X, 
  Search, 
  Calendar, 
  Video, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  User, 
  RefreshCw,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

interface ControlMenuModalProps {
  bugs: Bug[];
  onClose: () => void;
  onDeleteVideo: (bugId: string) => void;
  onDeleteBug: (bugId: string) => void;
  onReopenBug?: (bugId: string) => void;
}

export const ControlMenuModal: React.FC<ControlMenuModalProps> = ({
  bugs,
  onClose,
  onDeleteVideo,
  onDeleteBug,
  onReopenBug,
}) => {
  const [filterType, setFilterType] = useState<'solved' | 'open'>('solved');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [deletingBugId, setDeletingBugId] = useState<string | null>(null);
  const [confirmingBugId, setConfirmingBugId] = useState<string | null>(null);

  // Filter bugs based on tab, date search, and text search
  const filteredBugs = bugs.filter((bug) => {
    // Tab filter
    if (filterType === 'solved' && bug.status !== 'solved') return false;
    if (filterType === 'open' && bug.status !== 'open') return false;

    // Date filter
    if (selectedDate) {
      const bugDateStr = bug.solvedAt || bug.createdAt;
      if (bugDateStr) {
        try {
          const bugDate = new Date(bugDateStr).toISOString().split('T')[0];
          if (bugDate !== selectedDate) {
            // Also allow matching cutoff date
            const bugTime = new Date(bugDateStr).getTime();
            const cutoffTime = new Date(`${selectedDate}T23:59:59.999`).getTime();
            if (bugTime > cutoffTime) return false;
          }
        } catch {
          // ignore date parse error
        }
      }
    }

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = bug.title.toLowerCase().includes(q);
      const matchDesc = bug.description.toLowerCase().includes(q);
      const matchSolver = (bug.solvedBy || '').toLowerCase().includes(q);
      const matchCreator = (bug.createdBy || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchSolver && !matchCreator) return false;
    }

    return true;
  });

  const totalBugsCount = bugs.length;
  const openCount = bugs.filter((b) => b.status === 'open').length;
  const solvedCount = bugs.filter((b) => b.status === 'solved').length;
  const videosCount = bugs.filter((b) => Boolean(b.videoUrl || b.videoDriveId)).length;

  const handleConfirmDeleteVideo = (bugId: string) => {
    setDeletingVideoId(bugId);
    onDeleteVideo(bugId);
    setTimeout(() => {
      setDeletingVideoId(null);
    }, 300);
  };

  const handleConfirmDeleteBug = (bugId: string) => {
    if (confirmingBugId === bugId) {
      setDeletingBugId(bugId);
      onDeleteBug(bugId);
      setConfirmingBugId(null);
      setTimeout(() => {
        setDeletingBugId(null);
      }, 300);
    } else {
      setConfirmingBugId(bugId);
      setTimeout(() => {
        setConfirmingBugId((current) => (current === bugId ? null : current));
      }, 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#f8f7f4] border border-[#1a1a1a]/20 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-[#1a1a1a]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-5 bg-[#e5cebc] border-b border-[#1a1a1a]/15">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#1a1a1a] text-[#f8f7f4] shadow-sm">
              <Sliders className="w-5 h-5 text-[#d4a373]" />
            </div>
            <div>
              <h2 className="font-serif-editorial font-bold text-2xl text-[#000000] leading-none">
                Control Menu
              </h2>
              <p className="text-xs text-[#000000] font-mono-editorial font-medium mt-1">
                Manage solved videos, search by dates & auto-adjust issue totals
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#000000]/10 text-[#000000] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Date Search Controls */}
        <div className="p-4 bg-white border-b border-[#000000]/20 space-y-3">
          {/* Tab Filter Pills */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('solved')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono-editorial font-black uppercase tracking-wider transition-all cursor-pointer ${
                filterType === 'solved'
                  ? 'bg-[#000000] text-white shadow-sm'
                  : 'bg-slate-100 border border-[#000000]/20 text-[#000000] hover:bg-slate-200'
              }`}
            >
              Solved ({solvedCount})
            </button>
            <button
              onClick={() => setFilterType('open')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono-editorial font-black uppercase tracking-wider transition-all cursor-pointer ${
                filterType === 'open'
                  ? 'bg-[#000000] text-white shadow-sm'
                  : 'bg-slate-100 border border-[#000000]/20 text-[#000000] hover:bg-slate-200'
              }`}
            >
              Issues ({openCount})
            </button>
          </div>

          {/* Date Search & Text Search Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Search by Date */}
            <div className="flex items-center gap-2 bg-white border border-[#000000]/30 rounded-2xl px-3 py-2 shadow-xs">
              <Calendar className="w-4 h-4 text-[#000000] shrink-0" />
              <span className="text-[11px] font-black text-[#000000] whitespace-nowrap">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-transparent text-xs text-[#000000] font-bold outline-none cursor-pointer"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-rose-700 hover:text-rose-900 cursor-pointer text-xs font-black px-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Search by Keyword */}
            <div className="flex items-center gap-2 bg-white border border-[#000000]/30 rounded-2xl px-3 py-2 shadow-xs">
              <Search className="w-4 h-4 text-[#000000] shrink-0" />
              <input
                type="text"
                placeholder="Search title, solver, text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-[#000000] font-bold placeholder:text-[#000000]/60 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#000000] hover:text-rose-700 cursor-pointer text-xs font-bold px-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List of Filtered Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[240px]">
          {filteredBugs.length === 0 ? (
            <div className="py-12 text-center text-[#000000] space-y-2 bg-white rounded-3xl border border-[#000000]/20 p-6">
              <AlertCircle className="w-8 h-8 text-[#000000]/70 mx-auto" />
              <p className="font-serif-editorial font-bold text-base text-[#000000]">
                No matching entries found
              </p>
              <p className="text-xs text-[#000000] font-medium max-w-xs mx-auto">
                {selectedDate
                  ? `No items found on or before date ${selectedDate}. Try clearing the date search.`
                  : 'No solved items or videos match your query.'}
              </p>
            </div>
          ) : (
            filteredBugs.map((bug) => {
              const hasVideo = Boolean(bug.videoUrl || bug.videoDriveId);
              const isSolved = bug.status === 'solved';
              const dateDisplay = bug.solvedAt || bug.createdAt;

              return (
                <div
                  key={bug.id}
                  className="bg-white border-2 border-[#000000]/15 rounded-2xl p-4 shadow-sm hover:border-[#000000] transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md font-mono-editorial text-[10px] uppercase font-black tracking-wider ${
                            isSolved ? 'bg-emerald-200 text-emerald-950 border border-emerald-400' : 'bg-amber-200 text-amber-950 border border-amber-400'
                          }`}
                        >
                          {isSolved ? 'Solved' : 'Open'}
                        </span>
                        <h3 className="font-serif-editorial font-black text-base text-[#000000] truncate">
                          {bug.title}
                        </h3>
                      </div>

                      {bug.description && (
                        <p className="text-xs text-[#000000] font-medium line-clamp-2 mt-1.5 leading-relaxed">
                          {bug.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-[#000000] font-black mt-2.5 font-mono-editorial">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#000000]" />
                          {dateDisplay ? new Date(dateDisplay).toLocaleDateString() : 'N/A'}
                        </span>
                        {(bug.solvedBy || bug.createdBy) && (
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-emerald-800" />
                            By <strong className="text-[#000000]">{bug.solvedBy || bug.createdBy}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons: Delete Video & Delete Bug */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

                      {hasVideo && (
                        <button
                          onClick={() => handleConfirmDeleteVideo(bug.id)}
                          disabled={deletingVideoId === bug.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete attached reproduction video"
                        >
                          <Video className="w-3.5 h-3.5 text-amber-700" />
                          <span>{deletingVideoId === bug.id ? 'Removing...' : 'Delete Video'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleConfirmDeleteBug(bug.id)}
                        disabled={deletingBugId === bug.id}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                          confirmingBugId === bug.id
                            ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                        }`}
                        title="Delete issue permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{confirmingBugId === bug.id ? 'Confirm?' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#e5cebc]/60 border-t border-[#000000]/20 flex justify-between items-center text-xs">
          <span className="text-[#000000] font-bold font-mono-editorial text-xs">
            Changes automatically sync and auto-adjust statistics.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1a1a1a] text-[#f8f7f4] font-bold font-mono-editorial uppercase text-xs hover:bg-[#1a1a1a]/85 transition-colors cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
