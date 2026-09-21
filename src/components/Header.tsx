import React from 'react';
import { ASSETS } from '../data/initialData';
import { ViewTab } from '../types';

interface HeaderProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  streakDays?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  streakDays = 14,
}) => {
  const getSubTitle = () => {
    switch (currentTab) {
      case 'today-schedule':
        return '今日日程';
      case 'project-board':
        return '專案看板';
      case 'quick-log':
        return '記一筆';
      case 'pet-sanctuary':
        return '萌寵樂園';
      case 'pomodoro':
        return '沉浸專注';
      case 'export-studio':
        return '匯出中心';
      case 'prd':
        return '產品需求規格 (PRD)';
      default:
        return '今日日程';
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#f7faf7]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe border-b border-[#ecefeb]">
      <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Brand logo & title */}
        <button
          onClick={() => onSelectTab('today-schedule')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <img
            alt="Pawject Logo"
            className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
            src={ASSETS.logo}
          />
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-[19px] text-[#181c1b] leading-none tracking-tight">
              Pawject
            </span>
            <span className="text-[11px] text-[#564338] font-semibold mt-0.5 tracking-wide">
              {getSubTitle()}
            </span>
          </div>
        </button>

        {/* Right: Quick Tools, Streak & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick shortcuts to Pomodoro, Export Studio, and PRD */}
          <div className="flex items-center gap-1 bg-[#ecefeb]/70 p-1 rounded-full border border-[#ddc1b3]/30">
            <button
              onClick={() => onSelectTab('pomodoro')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                currentTab === 'pomodoro'
                  ? 'bg-[#ff8a3d] text-white shadow-sm'
                  : 'text-[#564338] hover:text-[#9a4600] hover:bg-white/80'
              }`}
              title="進入番茄鐘專注模式"
            >
              <span className="material-symbols-outlined text-[15px]">timer</span>
              <span className="hidden md:inline">番茄鐘</span>
            </button>

            <button
              onClick={() => onSelectTab('export-studio')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                currentTab === 'export-studio'
                  ? 'bg-[#9a4600] text-white shadow-sm'
                  : 'text-[#564338] hover:text-[#9a4600] hover:bg-white/80'
              }`}
              title="週報與筆記結構化匯出中心"
            >
              <span className="material-symbols-outlined text-[15px]">print_connect</span>
              <span className="hidden md:inline">匯出週報</span>
            </button>

            <button
              onClick={() => onSelectTab('prd')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                currentTab === 'prd'
                  ? 'bg-[#106c47] text-white shadow-sm'
                  : 'text-[#564338] hover:text-[#106c47] hover:bg-white/80'
              }`}
              title="檢視產品需求規格書 (PRD)"
            >
              <span className="material-symbols-outlined text-[15px]">article</span>
              <span className="hidden sm:inline">PRD</span>
            </button>
          </div>

          {/* Streak Flame Pill */}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-[#ffdea9]/70 rounded-full border border-[#ffba27]/30 shadow-xs">
            <span className="text-xs text-[#271900] font-extrabold flex items-center tracking-tight">
              🔥 {streakDays} 天
            </span>
          </div>

          {/* User Profile Avatar */}
          <button
            onClick={() => onSelectTab('export-studio')}
            className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white shadow-sm hover:scale-105 transition-transform"
            title="陳立凡 (首席產品經理)"
          >
            <img
              alt="User Avatar"
              className="w-full h-full object-cover"
              src={ASSETS.profile}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
