import React from 'react';
import { Bug } from '../types';

interface StatCardsProps {
  bugs: Bug[];
  activeFilter: 'all' | 'open' | 'solved';
  onSelectFilter: (filter: 'all' | 'open' | 'solved') => void;
}

export const StatCards: React.FC<StatCardsProps> = ({ bugs, activeFilter, onSelectFilter }) => {
  const openCount = bugs.filter((b) => b.status === 'open').length;
  const solvedCount = bugs.filter((b) => b.status === 'solved').length;

  return (
    <div className="flex items-center justify-end gap-4 sm:gap-6">
      {/* Issues Circle */}
      <button
        onClick={() => onSelectFilter('open')}
        className={`flex flex-col items-center group cursor-pointer transition-transform active:scale-95 ${
          activeFilter === 'open' ? 'opacity-100 scale-105' : 'opacity-80 hover:opacity-100'
        }`}
        title="Filter Open Issues"
      >
        <div className="w-12 h-12 rounded-full bg-[#A27D66] text-white flex items-center justify-center font-bold text-xl shadow-md transition-all group-hover:shadow-lg">
          {openCount}
        </div>
        <span className="text-[10px] font-bold tracking-wider text-[#A27D66] uppercase mt-2">
          ISSUES
        </span>
      </button>

      {/* Solved Circle */}
      <button
        onClick={() => onSelectFilter('solved')}
        className={`flex flex-col items-center group cursor-pointer transition-transform active:scale-95 ${
          activeFilter === 'solved' ? 'opacity-100 scale-105' : 'opacity-80 hover:opacity-100'
        }`}
        title="Filter Solved Issues"
      >
        <div className="w-12 h-12 rounded-full bg-[#639F9E] text-white flex items-center justify-center font-bold text-xl shadow-md transition-all group-hover:shadow-lg">
          {solvedCount}
        </div>
        <span className="text-[10px] font-bold tracking-wider text-[#639F9E] uppercase mt-2">
          SOLVED
        </span>
      </button>
    </div>
  );
};

