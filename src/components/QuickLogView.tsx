import React, { useState } from 'react';
import { ASSETS } from '../data/initialData';
import { Pet, Project, QuickNote } from '../types';

interface QuickLogViewProps {
  pet: Pet;
  projects: Project[];
  onSaveNote: (note: QuickNote) => void;
  onClose?: () => void;
}

export const QuickLogView: React.FC<QuickLogViewProps> = ({
  pet,
  projects,
  onSaveNote,
  onClose,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || 'proj-1'
  );
  const [category, setCategory] = useState<
    '靈感筆記' | '任務進度' | '會議紀錄' | '問題追蹤'
  >('任務進度');
  const [title, setTitle] = useState<string>(
    '完成首頁設計規範統整與按鈕元件庫'
  );
  const [content, setContent] = useState<string>(
    `- 統一 Primary / Secondary 按鈕高度與 Padding\n- 完成 Hover、Active 與 Focus 狀態微動畫標準\n- 測試深淺模式色籤覆蓋度，驗收完成！`
  );
  const [timeSpent, setTimeSpent] = useState<number>(1.5);
  const [progressShift, setProgressShift] = useState<number>(15);
  const [selectedSnack, setSelectedSnack] = useState<'tuna' | 'chicken' | 'beef'>(
    'tuna'
  );

  // Delight state
  const [showHeartBurst, setShowHeartBurst] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [confetti, setConfetti] = useState<
    { id: number; emoji: string; dx: number; dy: number; rotate: number }[]
  >([]);

  const handleSnackSelect = (snack: 'tuna' | 'chicken' | 'beef') => {
    setSelectedSnack(snack);
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 750);
  };

  const handleSave = () => {
    const selectedProj = projects.find((p) => p.id === selectedProjectId);
    const newNote: QuickNote = {
      id: `note-${Date.now()}`,
      projectId: selectedProjectId,
      projectName: selectedProj?.name || '專案記事',
      title: title || '無標題記事',
      content,
      category,
      timeSpent,
      progressShift,
      snack: selectedSnack,
      createdAt: new Date().toISOString(),
    };

    // Confetti particles
    const emojis = ['🐾', '✨', '💖', '🐟', '⭐', '🥫'];
    const newParticles = Array.from({ length: 14 }).map((_, idx) => ({
      id: Date.now() + idx,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      dx: (Math.random() - 0.5) * 220,
      dy: (Math.random() - 0.8) * 160,
      rotate: (Math.random() - 0.5) * 60,
    }));
    setConfetti(newParticles);

    // Show toast
    setShowToast(true);

    onSaveNote(newNote);

    setTimeout(() => {
      setConfetti([]);
    }, 1000);

    setTimeout(() => {
      setShowToast(false);
      if (onClose) onClose();
    }, 2200);
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 pb-28 gap-4 pt-3 relative">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#f1f4f1] p-4 shadow-xs border border-[#ecefeb]">
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-bold text-[#181c1b]">
                ✏️ 快速記錄專案記事
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#ffdea9] text-[#271900] text-[10px] font-bold">
                靈感手帳
              </span>
            </div>
            <p className="text-[12px] text-[#564338] mt-1 leading-snug">
              紀錄每一份微小進展，阿吉也會獲得一口元氣能量！
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#564338] shadow-xs shrink-0">
            <span className="material-symbols-outlined text-[20px]">auto_stories</span>
          </div>
        </div>
        <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-[#ffdbc9]/40 pointer-events-none blur-xl" />
      </div>

      {/* Project Selector Section */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-[#181c1b] font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-[#9a4600]">
              folder_open
            </span>
            選擇專案
          </span>
          <span className="text-[11px] text-[#8a7266]">點選以歸檔</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {projects.map((proj) => {
            const isSelected = selectedProjectId === proj.id;
            return (
              <button
                key={proj.id}
                type="button"
                onClick={() => setSelectedProjectId(proj.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-[#9a4600] text-white shadow-xs font-bold'
                    : 'bg-[#ecefeb] text-[#181c1b] hover:bg-[#e0e3e0]'
                }`}
              >
                <span className="truncate max-w-[150px]">{proj.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Note Title & Category Card */}
      <div className="flex flex-col rounded-2xl bg-white p-4 shadow-xs border border-[#ecefeb] gap-3.5">
        {/* Category Chips */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] text-[#564338] font-medium">記事類型</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: '靈感筆記', icon: '💡' },
              { label: '任務進度', icon: '✅' },
              { label: '會議紀錄', icon: '👥' },
              { label: '問題追蹤', icon: '🐞' },
            ].map((cat) => {
              const isCatSelected = category === cat.label;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() =>
                    setCategory(
                      cat.label as
                        | '靈感筆記'
                        | '任務進度'
                        | '會議紀錄'
                        | '問題追蹤'
                    )
                  }
                  className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                    isCatSelected
                      ? 'bg-[#68b98e] text-[#00482d] font-bold shadow-xs'
                      : 'bg-[#f1f4f1] text-[#181c1b] hover:bg-[#ecefeb]'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title Input */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="task-title"
            className="text-[11px] text-[#564338] font-medium"
          >
            標題摘要
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#f1f4f1] text-[#181c1b] text-[13px] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#9a4600] border border-[#ecefeb] transition-colors"
            placeholder="例如：完成品牌設計系統制定..."
          />
        </div>

        {/* Detail Textarea with Editor Tools Mockup */}
        <div className="flex flex-col rounded-xl bg-[#f1f4f1] p-2 gap-1.5 border border-[#ecefeb]">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-1 py-0.5 text-[#564338]">
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-[#e0e3e0] text-[#564338] text-[10px] font-bold tracking-tight">
                MD
              </span>
              <button
                type="button"
                onClick={() => setContent((c) => c + '\n**粗體文字**')}
                className="p-1 hover:bg-white rounded transition-colors text-[#564338]"
                title="粗體"
              >
                <span className="material-symbols-outlined text-[17px]">format_bold</span>
              </button>
              <button
                type="button"
                onClick={() => setContent((c) => c + '\n- 項目清單')}
                className="p-1 hover:bg-white rounded transition-colors text-[#564338]"
                title="項目清單"
              >
                <span className="material-symbols-outlined text-[17px]">
                  format_list_bulleted
                </span>
              </button>
              <button
                type="button"
                onClick={() => setContent((c) => c + '\n- [ ] 待辦事項')}
                className="p-1 hover:bg-white rounded transition-colors text-[#564338]"
                title="插入待辦"
              >
                <span className="material-symbols-outlined text-[17px]">check_box</span>
              </button>
              <button
                type="button"
                onClick={() => alert('檔案附件已連結')}
                className="p-1 hover:bg-white rounded transition-colors text-[#564338]"
                title="附加附件"
              >
                <span className="material-symbols-outlined text-[17px]">attach_file</span>
              </button>
            </div>
            <span className="text-[10px] text-[#8a7266]">已自動儲存草稿</span>
          </div>

          {/* Area */}
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-transparent px-1 text-[12px] text-[#181c1b] resize-none focus:outline-none leading-relaxed"
            placeholder="記錄具體完成的項目、設計決策，或遇到的細節問題..."
          />
        </div>
      </div>

      {/* Time & Progress Controls */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Time Spent */}
        <div className="flex flex-col rounded-2xl bg-white p-3.5 shadow-xs border border-[#ecefeb] gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#564338] font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-[#7d5800]">
                schedule
              </span>
              花費專注時間
            </span>
            <span className="text-[12px] font-bold text-[#7d5800]">
              {timeSpent} 小時
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="8"
            step="0.5"
            value={timeSpent}
            onChange={(e) => setTimeSpent(parseFloat(e.target.value))}
            className="w-full accent-[#7d5800] h-1.5 bg-[#ecefeb] rounded-lg cursor-pointer mt-2"
          />
          <div className="flex justify-between text-[10px] text-[#8a7266] mt-0.5">
            <span>30m</span>
            <span>4h</span>
            <span>8h+</span>
          </div>
        </div>

        {/* Progress Shift */}
        <div className="flex flex-col rounded-2xl bg-white p-3.5 shadow-xs border border-[#ecefeb] gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#564338] font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-[#106c47]">
                trending_up
              </span>
              專案進度推進
            </span>
            <span className="text-[12px] font-bold text-[#106c47]">
              +{progressShift}%
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={progressShift}
            onChange={(e) => setProgressShift(parseInt(e.target.value, 10))}
            className="w-full accent-[#106c47] h-1.5 bg-[#ecefeb] rounded-lg cursor-pointer mt-2"
          />
          <div className="flex justify-between text-[10px] text-[#8a7266] mt-0.5">
            <span>+5%</span>
            <span>+25%</span>
            <span>+50%</span>
          </div>
        </div>
      </div>

      {/* Pet Habitat Feeding Box (Delight Moment) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#FFFBF7] to-[#FAF3EB] p-4 shadow-xs border border-[#ddc1b3]/40 flex flex-col gap-3">
        {/* Top Companion State Header */}
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-full bg-[#ffb702]/30 text-[#5e4100] text-[11px] font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">restaurant</span>
            阿吉期待你的投餵
          </span>
          <span className="text-[11px] text-[#564338] font-medium">好感度 Lv.{pet.level}</span>
        </div>

        {/* Cat reaction visual container */}
        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-xs rounded-xl p-3 shadow-xs border border-[#ecefeb]">
          <div className="relative w-16 h-16 shrink-0 rounded-full bg-[#ffdbc9]/50 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-inner">
            <img
              alt="Joyful Eating Cat"
              className="w-full h-full object-cover"
              src={ASSETS.catEating}
            />
            {showHeartBurst && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-red-500/20">
                <span
                  className="material-symbols-outlined text-red-500 text-[30px] animate-ping"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  favorite
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-[14px] font-bold text-[#181c1b]">
                {pet.name}
              </span>
              <span
                className="material-symbols-outlined text-[14px] text-red-500"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                favorite
              </span>
            </div>
            <p className="text-[11px] text-[#564338] mt-0.5 truncate">
              「呼嚕呼嚕... 辛苦啦！聞到香香的味道了喵！」
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 bg-[#ecefeb] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#106c47] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, pet.hunger + 10)}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-[#106c47]">
                {Math.min(100, pet.hunger + 10)}% 飽足
              </span>
            </div>
          </div>
        </div>

        {/* Snack Selection Carousel */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-[#564338] font-medium">
            選擇本次給阿吉的犒賞：
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSnackSelect('tuna')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
                selectedSnack === 'tuna'
                  ? 'bg-white ring-2 ring-[#ff8a3d] shadow-sm'
                  : 'bg-white/60 text-[#564338] hover:bg-white'
              }`}
            >
              <span className="text-[22px]">🐟</span>
              <span className="text-[11px] font-bold text-[#181c1b] mt-0.5">
                鮮美鮪魚罐
              </span>
              <span className="text-[9px] text-[#106c47] font-bold">
                +40 飽食 / +30 EXP
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSnackSelect('chicken')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
                selectedSnack === 'chicken'
                  ? 'bg-white ring-2 ring-[#ff8a3d] shadow-sm'
                  : 'bg-white/60 text-[#564338] hover:bg-white'
              }`}
            >
              <span className="text-[22px]">🍗</span>
              <span className="text-[11px] font-bold text-[#181c1b] mt-0.5">
                手撕嫩雞胸
              </span>
              <span className="text-[9px] text-[#7d5800] font-bold">
                +25 飽食 / +20 EXP
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSnackSelect('beef')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
                selectedSnack === 'beef'
                  ? 'bg-white ring-2 ring-[#ff8a3d] shadow-sm'
                  : 'bg-white/60 text-[#564338] hover:bg-white'
              }`}
            >
              <span className="text-[22px]">🥩</span>
              <span className="text-[11px] font-bold text-[#181c1b] mt-0.5">
                頂級牛肉凍
              </span>
              <span className="text-[9px] text-[#9a4600] font-bold">
                +35 飽食 / +25 EXP
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Motivational Quote Bar */}
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#f1f4f1] text-[#564338] border border-[#ecefeb]">
        <span className="material-symbols-outlined text-[16px] text-[#9a4600]">
          spa
        </span>
        <span className="text-[11px]">
          「每個有紀錄的足跡，都是為未來的自己鋪路。」
        </span>
      </div>

      {/* Main Primary Action Button */}
      <div className="relative pt-1">
        <button
          type="button"
          onClick={handleSave}
          className="relative w-full h-12 rounded-xl bg-[#ff8a3d] hover:bg-[#9a4600] text-white text-[15px] font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer overflow-hidden"
        >
          <span className="text-[19px]">🐾</span>
          <span>儲存記事並投餵阿吉！</span>
          <span className="px-2 py-0.5 rounded-full bg-white/25 text-white text-[11px] font-bold ml-1">
            +30 EXP
          </span>
        </button>

        {/* Confetti canvas */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
          {confetti.map((item) => (
            <span
              key={item.id}
              className="absolute text-xl animate-ping"
              style={{
                transform: `translate(${item.dx}px, ${item.dy}px) rotate(${item.rotate}deg)`,
              }}
            >
              {item.emoji}
            </span>
          ))}
        </div>
      </div>

      {/* Feedback Toast Notification */}
      {showToast && (
        <div className="fixed top-20 inset-x-4 max-w-md mx-auto z-50 transition-all duration-300 transform">
          <div className="rounded-2xl bg-[#2d312f] text-white p-3.5 shadow-2xl flex items-center justify-between border border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="text-[24px]">✨</span>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold">
                  記事已保存，阿吉吃得好開心！
                </span>
                <span className="text-[11px] text-[#d8dbd7]">
                  獲得 30 點寵物親密度與專案徽章進度
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#68b98e] text-[22px]">
              verified
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
