import React from 'react';
import { ViewTab } from '../types';

interface NavigationProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
}) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#f7faf7]/95 backdrop-blur-xl border-t border-[#ecefeb] shadow-[0_-2px_12px_rgba(44,48,46,0.06)]">
      <div className="max-w-md mx-auto flex justify-around items-center h-20 px-2">
        {/* Tab 1: 今日日程 */}
        <button
          onClick={() => onSelectTab('today-schedule')}
          className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] transition-all ${
            currentTab === 'today-schedule'
              ? 'text-[#9a4600] font-bold scale-105'
              : 'text-[#564338] hover:text-[#181c1b]'
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{
              fontVariationSettings: currentTab === 'today-schedule' ? "'FILL' 1" : "'FILL' 0",
            }}
          >
            calendar_today
          </span>
          <span className="text-[11px] font-medium mt-1 tracking-tight">今日日程</span>
        </button>

        {/* Tab 2: 專案看板 */}
        <button
          onClick={() => onSelectTab('project-board')}
          className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] transition-all ${
            currentTab === 'project-board'
              ? 'text-[#9a4600] font-bold scale-105'
              : 'text-[#564338] hover:text-[#181c1b]'
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{
              fontVariationSettings: currentTab === 'project-board' ? "'FILL' 1" : "'FILL' 0",
            }}
          >
            view_kanban
          </span>
          <span className="text-[11px] font-medium mt-1 tracking-tight">專案看板</span>
        </button>

        {/* Center Floating Action Button: 記一筆 */}
        <div className="relative -top-4">
          <button
            onClick={() => onSelectTab('quick-log')}
            className="group flex flex-col items-center justify-center w-14 h-14 rounded-full bg-[#ff8a3d] text-white shadow-[0_6px_20px_-2px_rgba(154,70,0,0.35)] active:scale-90 hover:bg-[#9a4600] transition-all ring-4 ring-[#f7faf7]"
            title="快速記錄專案記事並投餵"
          >
            <span className="material-symbols-outlined text-[28px] transition-transform group-hover:rotate-12">
              edit_note
            </span>
            <span className="sr-only">記一筆</span>
          </button>
        </div>

        {/* Tab 3: 萌寵樂園 */}
        <button
          onClick={() => onSelectTab('pet-sanctuary')}
          className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] transition-all ${
            currentTab === 'pet-sanctuary'
              ? 'text-[#9a4600] font-bold scale-105'
              : 'text-[#564338] hover:text-[#181c1b]'
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{
              fontVariationSettings: currentTab === 'pet-sanctuary' ? "'FILL' 1" : "'FILL' 0",
            }}
          >
            pets
          </span>
          <span className="text-[11px] font-medium mt-1 tracking-tight">萌寵樂園</span>
        </button>
      </div>
    </nav>
  );
};
