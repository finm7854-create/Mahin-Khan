import React, { useState } from 'react';
import { Bug } from '../types';
import { 
  CheckCircle2, 
  ChevronRight, 
  Trophy, 
  Zap, 
  Calendar, 
  X, 
  Image as ImageIcon, 
  Video as VideoIcon,
  RotateCcw,
  User,
  Clock
} from 'lucide-react';
import { ResolvedVideo } from './MediaItem';

interface SolvedLogViewProps {
  bugs: Bug[];
  onSelectBug: (bug: Bug) => void;
}

export const SolvedLogView: React.FC<SolvedLogViewProps> = ({ bugs, onSelectBug }) => {
  const [filterDate, setFilterDate] = useState<string>('');

  const allSolvedBugs = bugs.filter((b) => b.status === 'solved');

  // Filter bugs solved on or before selected cutoff date
  const filteredSolvedBugs = allSolvedBugs.filter((bug) => {
    if (!filterDate) return true;
    const dateStr = bug.solvedAt || bug.createdAt;
    if (!dateStr) return true;
    try {
      const bugDate = new Date(dateStr);
      // Include all items up to the end of the selected day
      const cutoffDate = new Date(`${filterDate}T23:59:59.999`);
      return bugDate.getTime() <= cutoffDate.getTime();
    } catch {
      return true;
    }
  });

  // Format relative time
  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Recently';
    try {
      const now = new Date();
      const past = new Date(isoString);
      const diffMs = now.getTime() - past.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours === 1) return '1h ago';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const formatDateLabel = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-5 pb-28">
      {/* Header Bar with Date Filter in Top Corner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl font-bold font-serif-editorial text-[#1a1a1a]">Solved Archive</h1>
          <p className="text-xs text-[#1a1a1a]/60">Historical record of all resolved issues</p>
        </div>

        {/* Upper Right Corner Date Filter */}
        <div className="flex items-center gap-2 bg-white/90 border border-[#1a1a1a]/15 rounded-2xl p-1.5 shadow-sm text-xs">
          <Calendar className="w-3.5 h-3.5 text-[#1a1a1a]/60 ml-1 shrink-0" />
          <span className="text-[11px] font-semibold text-[#1a1a1a]/70 whitespace-nowrap">On or Before:</span>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-[#1a1a1a]/5 hover:bg-[#1a1a1a]/10 transition-colors border border-[#1a1a1a]/10 rounded-xl px-2 py-1 text-xs text-[#1a1a1a] font-medium outline-none cursor-pointer"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
              title="Clear date filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats Cards */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50/90 border border-emerald-200/80 p-4 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider mb-0.5">Total Solved</p>
            <p className="text-2xl font-black text-emerald-700">{allSolvedBugs.length}</p>
            {filterDate && (
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                {filteredSolvedBugs.length} match filter
              </p>
            )}
          </div>
          <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-sm">
            <Trophy className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#1a1a1a]/10 p-4 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-[#1a1a1a]/60 uppercase font-bold tracking-wider mb-0.5">Resolution Rate</p>
            <p className="text-2xl font-black text-indigo-600">
              {bugs.length > 0 ? `${Math.round((allSolvedBugs.length / bugs.length) * 100)}%` : '100%'}
            </p>
          </div>
          <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
            <Zap className="w-4 h-4" />
          </div>
        </div>
      </section>

      {/* Active Filter Pill */}
      {filterDate && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl px-3.5 py-2 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-700" />
            <span>Showing solutions on or before <strong>{filterDate}</strong></span>
          </div>
          <button
            onClick={() => setFilterDate('')}
            className="flex items-center gap-1 font-bold text-amber-800 hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      )}

      {/* List of Solved Bugs with Overview Cards */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]/50">
            Overview Solutions ({filteredSolvedBugs.length})
          </h2>
        </div>

        {filteredSolvedBugs.length === 0 ? (
          <div className="bg-white border border-[#1a1a1a]/10 rounded-3xl p-8 text-center text-[#1a1a1a]/60 text-xs shadow-sm space-y-2">
            <p className="font-semibold text-sm text-[#1a1a1a]">No solved issues match this view</p>
            <p className="text-[#1a1a1a]/50">
              {filterDate
                ? `No bugs were solved on or before ${filterDate}. Try selecting a later date.`
                : 'No bugs marked as solved yet! Tap any open bug on the board to mark it solved.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredSolvedBugs.map((bug) => {
              const rawVideo = bug.videoUrl || (bug.videoUrls && bug.videoUrls.length > 0 ? bug.videoUrls[0] : null);
              const hasVideo = Boolean(rawVideo);

              return (
                <div
                  key={bug.id}
                  onClick={() => onSelectBug(bug)}
                  className="bg-white border border-[#1a1a1a]/10 hover:border-[#008188] rounded-3xl p-4 transition-all duration-300 shadow-sm hover:shadow-xl hover:scale-[1.03] hover:-translate-y-1.5 cursor-pointer group space-y-3 relative hover:z-20"
                >
                  {/* Top Row: Icon, Title & Date */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-[#1a1a1a] truncate group-hover:text-emerald-700 transition-colors">
                          {bug.title}
                        </h3>
                        {bug.priority && (
                          <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                            {bug.priority}
                          </span>
                        )}
                      </div>

                      {/* Video Preview if available */}
                      {hasVideo && rawVideo ? (
                        <div className="mt-2.5 h-32 rounded-xl overflow-hidden bg-black relative border border-slate-800">
                          <ResolvedVideo
                            src={rawVideo}
                            isThumbnail
                            controls={false}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-black/70 text-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                            <VideoIcon className="w-3 h-3 text-emerald-400" /> Video
                          </div>
                        </div>
                      ) : (
                        bug.description && (
                          <p className="text-xs text-[#000000] font-medium line-clamp-2 mt-1 leading-relaxed">
                            {bug.description}
                          </p>
                        )
                      )}
                    </div>
                  </div>

                  {/* Footer Metadata Info */}
                  <div className="flex items-center justify-between text-[11px] text-[#000000] font-bold pt-2 border-t border-[#1a1a1a]/10">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-black text-emerald-950 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
                        <User className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Solved by {bug.solvedBy || 'Friend'}</span>
                      </span>

                      {bug.createdBy && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10.5px]">
                          Reported by {bug.createdBy}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 font-mono-editorial text-[10px]">
                      <Clock className="w-3 h-3 text-[#1a1a1a]/40" />
                      <span>{formatDateLabel(bug.solvedAt || bug.createdAt) || getRelativeTime(bug.solvedAt || bug.createdAt)}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#1a1a1a]/40 group-hover:text-emerald-700 transition-colors ml-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
