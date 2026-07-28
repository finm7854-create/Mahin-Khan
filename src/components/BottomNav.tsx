import React from 'react';
import { LayoutDashboard, CheckCircle2 } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'board' | 'solved';
  onTabChange: (tab: 'board' | 'solved') => void;
  onAddClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  onAddClick
}) => {
  return (
    <div className="fixed bottom-3 sm:bottom-6 inset-x-0 z-40 px-3 sm:px-8 pb-[env(safe-area-inset-bottom,0px)] flex justify-between sm:justify-center items-center pointer-events-none max-w-lg sm:max-w-none mx-auto">
      {/* Centered / Side-by-side Toggle Switch */}
      <div className="bg-white rounded-full p-1 flex shadow-lg border border-gray-200/80 w-40 sm:w-52 pointer-events-auto shrink-0">
        <button
          onClick={() => onTabChange('board')}
          className={`flex-1 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
            currentTab === 'board'
              ? 'bg-black text-white shadow-xs'
              : 'text-gray-500 hover:text-black'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>BOARD</span>
        </button>
        <button
          onClick={() => onTabChange('solved')}
          className={`flex-1 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
            currentTab === 'solved'
              ? 'bg-black text-white shadow-xs'
              : 'text-gray-500 hover:text-black'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>SOLVED</span>
        </button>
      </div>

      {/* New Entry Button */}
      <button
        onClick={onAddClick}
        className="sm:absolute sm:right-8 bg-[#C37C75] hover:bg-[#B06B64] text-black font-bold text-[11px] sm:text-xs px-4 sm:px-6 py-2.5 sm:py-3 rounded-full uppercase tracking-wider shadow-lg transition-all border border-black/10 cursor-pointer pointer-events-auto active:scale-95 shrink-0"
        title="New Entry"
      >
        New Entry
      </button>
    </div>
  );
};
