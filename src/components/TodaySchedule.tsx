import React, { useState } from 'react';
import { ASSETS } from '../data/initialData';
import { Pet, ScheduleItem, ViewTab } from '../types';
import { InteractiveCatOnChair } from './InteractiveCatOnChair';

interface TodayScheduleProps {
  pet: Pet;
  schedule: ScheduleItem[];
  onToggleTask: (taskId: string) => void;
  onNavigate: (tab: ViewTab) => void;
  onStartPomodoroForTask: (task: ScheduleItem) => void;
  onPetTouch: () => void;
  onIntimacyGain?: (amount: number) => void;
  onFeed?: (amount: number) => void;
}

export const TodaySchedule: React.FC<TodayScheduleProps> = ({
  pet,
  schedule,
  onToggleTask,
  onNavigate,
  onStartPomodoroForTask,
  onPetTouch,
  onIntimacyGain,
  onFeed,
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(24);
  const [speechText, setSpeechText] = useState<string>('今天也是充滿幹勁的一天喵！');
  const [floatingHearts, setFloatingHearts] = useState<
    { id: number; left: number; top: number }[]
  >([]);

  const catQuotes = [
    '呼嚕呼嚕... 最喜歡陪你寫筆記了喵！🐾',
    '摸摸好舒服～ 今天目標完成了嗎？🐟',
    '阿吉正在為你加油打氣！✨',
    '再完成一項任務，我們去吃好吃的吧！🥫',
    '工作累的話，記得伸個懶腰喝口水喵～',
  ];

  const handlePat = () => {
    onPetTouch();
    const quote = catQuotes[Math.floor(Math.random() * catQuotes.length)];
    setSpeechText(quote);

    // Spawn 3 floating hearts
    const newHearts = Array.from({ length: 3 }).map((_, idx) => ({
      id: Date.now() + idx,
      left: 35 + Math.random() * 30,
      top: 40 + (Math.random() - 0.5) * 20,
    }));
    setFloatingHearts((prev) => [...prev, ...newHearts]);

    setTimeout(() => {
      setFloatingHearts((prev) =>
        prev.filter((h) => !newHearts.some((nh) => nh.id === h.id))
      );
    }, 900);
  };

  const completedCount = schedule.filter((s) => s.completed).length;

  const daysOfWeek = [
    { dayName: '一', dateNum: 21, hasDot: true },
    { dayName: '二', dateNum: 22, hasDot: true },
    { dayName: '三', dateNum: 23, hasDot: true },
    { dayName: '週四', dateNum: 24, isToday: true, hasDot: true },
    { dayName: '五', dateNum: 25, hasDot: true },
    { dayName: '六', dateNum: 26, hasDot: false },
    { dayName: '日', dateNum: 27, hasDot: false },
  ];

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 pb-28 gap-4 pt-3">
      {/* Interactive Pet Sanctuary Hero Card */}
      <div className="relative w-full rounded-2xl bg-gradient-to-b from-white via-white to-[#f1f4f1] p-4 shadow-[0_4px_20px_-2px_rgba(184,134,11,0.08),0_2px_6px_-1px_rgba(44,48,46,0.03)] border border-[#ecefeb] overflow-hidden">
        {/* Cozy room background decorative ambient blurs */}
        <div className="absolute -right-6 -top-6 w-36 h-36 rounded-full bg-[#ffdea9]/35 blur-2xl pointer-events-none" />
        <div className="absolute -left-4 bottom-8 w-28 h-28 rounded-full bg-[#a1f4c5]/40 blur-xl pointer-events-none" />

        {/* Top Header info */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-[18px] font-bold text-[#181c1b]">
                {pet.name}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#ffdbc9] text-[#321200] font-bold">
                Lv.{pet.level}
              </span>
            </div>
            <span className="text-[12px] text-[#564338] flex items-center gap-1 mt-0.5">
              <span
                className="material-symbols-outlined text-[16px] text-[#106c47]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                favorite
              </span>
              心情: {pet.mood}
            </span>
          </div>

          {/* Quick Care Actions Pill */}
          <button
            onClick={handlePat}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#ffdea9]/60 hover:bg-[#ffdea9] active:scale-95 transition-all text-[#271900] shadow-xs cursor-pointer border border-[#ffba27]/30"
          >
            <span className="material-symbols-outlined text-[16px] text-[#7d5800]">
              touch_app
            </span>
            <span className="text-[12px] font-bold">撫摸互動</span>
          </button>
        </div>

        {/* Pet Companion Stage Visual & Status */}
        <div className="relative flex flex-col items-center justify-center my-1">
          <InteractiveCatOnChair
            size="md"
            showControls={true}
            onIntimacyGain={onIntimacyGain}
            onFeed={onFeed}
            className="w-full"
          />

          {/* Status Gauges Grid */}
          <div className="grid grid-cols-2 gap-2 w-full mt-3">
            {/* Hunger meter */}
            <div className="flex flex-col gap-1 p-2 rounded-xl bg-white/80 border border-[#ecefeb]/60">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[#564338] flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[14px] text-[#9a4600]">
                    lunch_dining
                  </span>
                  飽食度
                </span>
                <span className="text-[11px] font-bold text-[#9a4600]">
                  {pet.hunger}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#e0e3e0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ff8a3d] rounded-full transition-all duration-500"
                  style={{ width: `${pet.hunger}%` }}
                />
              </div>
            </div>

            {/* Companion Days */}
            <div className="flex flex-col gap-1 p-2 rounded-xl bg-white/80 border border-[#ecefeb]/60">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[#564338] flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[14px] text-[#106c47]">
                    calendar_month
                  </span>
                  守護陪伴
                </span>
                <span className="text-[11px] font-bold text-[#106c47]">
                  {pet.companionDays} 天
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#e0e3e0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#106c47] rounded-full"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Next Evolution Level Micro-tracker */}
          <div className="w-full mt-2 px-3 py-1.5 rounded-lg bg-[#ffdea9]/25 border border-[#ffba27]/20 flex items-center justify-between">
            <span className="text-[11px] text-[#5e4100] font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-[#7d5800]">
                set_meal
              </span>
              距離升級還需 2 次記事投餵 🐟
            </span>
            <span className="text-[11px] font-bold text-[#7d5800]">60%</span>
          </div>
        </div>
      </div>

      {/* Daily Quick Metric Feed Strip */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#ecefeb] shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#ffdbc9] flex items-center justify-center text-[#321200] shrink-0">
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              soup_kitchen
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-[#564338] truncate font-medium">今日投餵進度</span>
            <span className="text-[16px] font-bold text-[#181c1b] leading-tight">
              {completedCount + 2} / 4 罐 🥫
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#ecefeb] shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#ffdea9] flex items-center justify-center text-[#271900] shrink-0">
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              toll
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-[#564338] truncate font-medium">獲得金幣獎勵</span>
            <span className="text-[16px] font-bold text-[#7d5800] leading-tight">
              +{150 + completedCount * 25} 🪙
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Horizontal Weekly Calendar Pill Slider */}
      <div className="flex flex-col gap-1.5 mt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[16px] font-bold text-[#181c1b]">2024 年 10 月</span>
            <span className="text-[12px] text-[#564338] font-medium">第 43 週</span>
          </div>
          <button
            onClick={() => onNavigate('project-board')}
            className="text-[12px] font-bold text-[#9a4600] flex items-center hover:opacity-80 cursor-pointer"
          >
            本週總覽
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>

        {/* Days Scroller */}
        <div className="grid grid-cols-7 gap-1.5 py-1">
          {daysOfWeek.map((day) => {
            const isSelected = selectedDay === day.dateNum;
            return (
              <button
                key={day.dateNum}
                onClick={() => setSelectedDay(day.dateNum)}
                className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#9a4600] text-white shadow-[0_4px_12px_rgba(154,70,0,0.25)] ring-2 ring-[#ff8a3d]/30 scale-105'
                    : 'bg-white text-[#564338] border border-[#ecefeb] shadow-xs hover:bg-[#f1f4f1]'
                }`}
              >
                <span
                  className={`text-[11px] font-medium ${
                    isSelected ? 'text-[#ffdbc9] font-bold' : ''
                  }`}
                >
                  {day.dayName}
                </span>
                <span className="text-[16px] font-bold mt-0.5 leading-none">
                  {day.dateNum}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                    isSelected
                      ? 'bg-white'
                      : day.hasDot
                      ? 'bg-[#106c47]'
                      : 'bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating encouragement widget */}
      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#ffdea9]/40 border border-[#ffba27]/25 shadow-xs">
        <span className="text-xl shrink-0">✨</span>
        <p className="text-[12px] text-[#5e4100] font-medium flex-1 leading-snug">
          今日再記錄 <strong className="font-bold text-[#7d5800]">1 筆</strong>
          ，即可解鎖「午後零食時間」加倍金幣獎勵！
        </p>
      </div>

      {/* Today's Project Timeline Section */}
      <div className="flex flex-col gap-2 mt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-bold text-[#181c1b]">今日手帳行程</span>
            <span className="px-2 py-0.5 rounded-full bg-[#e6e9e6] text-[#564338] text-[11px] font-bold">
              {schedule.length} 項任務
            </span>
          </div>
          <span className="text-[12px] text-[#564338] font-medium">
            已完成 {completedCount} / {schedule.length}
          </span>
        </div>

        {/* Timeline List */}
        <div className="flex flex-col gap-2.5">
          {schedule.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3.5 rounded-2xl bg-white border transition-all ${
                item.completed
                  ? 'border-[#a1f4c5]/40 opacity-90'
                  : 'border-[#ecefeb] shadow-sm hover:shadow-md'
              }`}
            >
              {/* Interactive Paw Stamp Checkbox */}
              <button
                onClick={() => onToggleTask(item.id)}
                className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shadow-xs shrink-0 cursor-pointer transition-transform active:scale-90 ${
                  item.completed
                    ? 'bg-[#106c47] text-white'
                    : 'bg-[#ecefeb] text-transparent hover:text-[#106c47] hover:bg-[#a1f4c5]/30'
                }`}
                title={item.completed ? '標記為未完成' : '標記完成並投餵'}
              >
                <span
                  className="material-symbols-outlined text-[17px] font-bold"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  pets
                </span>
              </button>

              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <span
                    className={`text-[12px] font-bold ${
                      item.completed ? 'text-[#106c47]' : 'text-[#9a4600]'
                    }`}
                  >
                    {item.time}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ecefeb] text-[#564338] font-medium">
                      {item.category}
                    </span>
                    {item.completed ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#a1f4c5] text-[#00482d] font-bold flex items-center gap-0.5">
                        已投餵 🥫
                      </span>
                    ) : item.canRewardNote ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ffdea9]/70 text-[#5e4100] font-bold">
                        {item.canRewardNote}
                      </span>
                    ) : null}
                  </div>
                </div>

                <h3
                  className={`text-[14px] font-bold mt-1 leading-snug ${
                    item.completed
                      ? 'text-[#8a7266] line-through'
                      : 'text-[#181c1b]'
                  }`}
                >
                  {item.title}
                </h3>

                <p className="text-[12px] text-[#564338]/90 mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Sub-actions for pending tasks */}
                {!item.completed && (
                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      onClick={() => onNavigate('quick-log')}
                      className="px-3 py-1 rounded-lg bg-[#9a4600] text-white text-[11px] font-bold active:scale-95 transition-transform flex items-center gap-1 cursor-pointer shadow-xs hover:bg-[#ff8a3d]"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      填寫進度
                    </button>

                    <button
                      onClick={() => onStartPomodoroForTask(item)}
                      className="px-2.5 py-1 rounded-lg bg-[#ffdbc9] text-[#763300] text-[11px] font-bold active:scale-95 transition-transform flex items-center gap-1 cursor-pointer hover:bg-[#ff8a3d] hover:text-white"
                      title="以此任務開啟專注番茄鐘"
                    >
                      <span className="material-symbols-outlined text-[14px]">timer</span>
                      專注
                    </button>

                    {item.durationEst && (
                      <span className="text-[11px] text-[#8a7266] ml-auto">
                        {item.durationEst}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Quick Journal Prompt Card */}
      <button
        onClick={() => onNavigate('quick-log')}
        className="flex items-center justify-between p-3.5 rounded-2xl bg-[#ecefeb] hover:bg-[#e6e9e6] transition-colors text-left cursor-pointer border border-[#ddc1b3]/30 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#ff8a3d] text-white flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[20px]">auto_stories</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-bold text-[#181c1b]">手帳隨筆雜記</span>
            <span className="text-[11px] text-[#564338]">記錄當下的小靈感與美好時刻</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white text-[#181c1b] flex items-center justify-center shadow-xs">
          <span className="material-symbols-outlined text-[18px]">add</span>
        </div>
      </button>
    </div>
  );
};
