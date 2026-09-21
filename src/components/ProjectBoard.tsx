import React, { useState } from 'react';
import { ASSETS } from '../data/initialData';
import { Project } from '../types';

interface ProjectBoardProps {
  projects: Project[];
  onAddProject: (project: Partial<Project>) => void;
  onOpenQuickLogForProject?: (project: Project) => void;
}

export const ProjectBoard: React.FC<ProjectBoardProps> = ({
  projects,
  onAddProject,
  onOpenQuickLogForProject,
}) => {
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'active' | 'urgent' | 'archived'
  >('all');
  const [viewMode, setViewMode] = useState<'cards' | 'gantt'>('cards');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New Project Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('品牌營銷 🎨');
  const [newDueDate, setNewDueDate] = useState<string>('');

  const filteredProjects = projects.filter((p) => {
    // Filter by tab
    if (activeFilter === 'active' && p.status !== '進行中') return false;
    if (activeFilter === 'urgent' && p.status !== '即將截止') return false;
    if (activeFilter === 'archived' && p.status !== '已封存') return false;

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.latestMemo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddProject({
      name: newTitle,
      category: newCategory.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, ''),
      status: '進行中',
      progress: 10,
      latestMemo: '專案已建立，等待建立第一筆記事。',
      latestMemoTime: '剛剛',
      noteCount: 0,
      fishRewards: 30,
      members: ['凡'],
      dueDate: newDueDate || '11/30',
      startDate: '10/24',
      phaseDesc: '初始規劃階段 (10%)',
    });

    setNewTitle('');
    setNewDueDate('');
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 pb-28 gap-4 pt-3 relative">
      {/* Top Ambient Banner with Pet Mascot & Planner Vibe */}
      <div className="bg-gradient-to-r from-[#ffdea9]/40 via-[#f1f4f1] to-[#ffdbc9]/40 rounded-2xl p-4 shadow-xs border border-[#ecefeb] relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#ffb702] text-[#271900] text-[11px] font-bold">
                ✎
              </span>
              <span className="text-[11px] font-bold text-[#7d5800] uppercase tracking-wider">
                專案手帳總覽
              </span>
            </div>
            <span className="text-[16px] font-bold text-[#181c1b] mt-1">
              把目標孵化成茁壯成果
            </span>
            <span className="text-[11px] text-[#564338] mt-0.5">
              每完成一項進度，小貓就能享用小魚乾獎勵
            </span>
          </div>

          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <img
              alt="Cozy Kitten with Apron"
              className="w-12 h-12 object-contain drop-shadow-sm rounded-full bg-white p-1 ring-1 ring-[#ddc1b3]/40"
              src={ASSETS.catApron}
            />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#106c47] text-[10px] text-white">
              ✨
            </span>
          </div>
        </div>

        {/* Stats Summary Strip */}
        <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2 bg-white/90 rounded-xl p-2 backdrop-blur-xs shadow-xs border border-[#ecefeb]/60">
          <div className="flex flex-col items-center justify-center text-center p-1">
            <span className="text-[11px] text-[#564338]">進行中專案</span>
            <div className="flex items-baseline gap-0.5 mt-0.5">
              <span className="text-[20px] font-extrabold text-[#9a4600] leading-none">
                {projects.length}
              </span>
              <span className="text-[10px] text-[#564338]">個</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center p-1 border-x border-[#ecefeb]">
            <span className="text-[11px] text-[#564338]">本月記事記錄</span>
            <div className="flex items-baseline gap-0.5 mt-0.5">
              <span className="text-[20px] font-extrabold text-[#7d5800] leading-none">
                38
              </span>
              <span className="text-[10px] text-[#564338]">筆</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center p-1">
            <span className="text-[11px] text-[#564338]">養成總餵食</span>
            <div className="flex items-baseline gap-0.5 mt-0.5">
              <span className="text-[20px] font-extrabold text-[#106c47] leading-none">
                52
              </span>
              <span className="text-[10px] text-[#564338]">次 🐟</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & View Toggle Section */}
      <div className="flex flex-col gap-2.5">
        {/* Search Bar */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-[#8a7266] text-[18px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋專案名稱、標籤或筆記關鍵字..."
            className="w-full h-11 pl-9 pr-9 bg-white text-[#181c1b] placeholder:text-[#8a7266] text-[13px] rounded-xl shadow-xs border border-[#ecefeb] focus:outline-none focus:ring-1 focus:ring-[#9a4600]"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-[#8a7266] hover:text-[#181c1b] text-xs font-bold"
            >
              ✕
            </button>
          ) : (
            <span className="material-symbols-outlined absolute right-3 text-[#8a7266] text-[18px] pointer-events-none">
              tune
            </span>
          )}
        </div>

        {/* Filter Pills & Layout Mode Switcher */}
        <div className="flex items-center justify-between gap-1">
          {/* Status Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar text-nowrap">
            {[
              { id: 'all', label: `全部 (${projects.length})` },
              { id: 'active', label: '進行中' },
              { id: 'urgent', label: '即將截止 🔥' },
              { id: 'archived', label: '已封存' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-[#ffdbc9] text-[#321200] font-bold shadow-xs'
                    : 'bg-[#f1f4f1] text-[#564338] hover:bg-[#ecefeb]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Segmented View Mode Tabs */}
          <div className="flex shrink-0 items-center bg-[#f1f4f1] p-1 rounded-full border border-[#ecefeb]">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-[#9a4600] shadow-xs'
                  : 'text-[#564338] hover:text-[#181c1b]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">grid_view</span>
              <span>卡片</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('gantt')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'gantt'
                  ? 'bg-white text-[#9a4600] shadow-xs'
                  : 'text-[#564338] hover:text-[#181c1b]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">timeline</span>
              <span>時間軸</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards View (Default) */}
      {viewMode === 'cards' && (
        <div className="flex flex-col gap-3">
          {filteredProjects.map((proj) => (
            <article
              key={proj.id}
              className="bg-white rounded-2xl p-4 shadow-xs hover:shadow-md transition-all border border-[#ecefeb] relative overflow-hidden flex flex-col gap-2.5"
            >
              {/* Left Color Accent Stripe */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  proj.status === '即將截止'
                    ? 'bg-[#ffb702]'
                    : proj.progress >= 85
                    ? 'bg-[#106c47]'
                    : 'bg-[#ff8a3d]'
                }`}
              />

              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-[#ffdbc9]/60 text-[#763300] text-[10px] font-bold">
                      {proj.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        proj.status === '即將截止'
                          ? 'bg-[#ffdad6] text-[#93000a] flex items-center gap-0.5'
                          : proj.progress >= 85
                          ? 'bg-[#a1f4c5] text-[#00482d]'
                          : 'bg-[#ffdea9]/60 text-[#5e4100]'
                      }`}
                    >
                      {proj.status === '即將截止' && (
                        <span className="material-symbols-outlined text-[12px]">alarm</span>
                      )}
                      {proj.dueDate?.includes('倒數') ? proj.dueDate : proj.status}
                    </span>
                  </div>
                  <h2 className="text-[15px] font-bold text-[#181c1b] truncate mt-0.5">
                    {proj.name}
                  </h2>
                </div>

                <button
                  onClick={() => onOpenQuickLogForProject && onOpenQuickLogForProject(proj)}
                  className="text-[#8a7266] hover:text-[#9a4600] p-1 rounded-full hover:bg-[#f1f4f1]"
                  title="為此專案新增手帳"
                >
                  <span className="material-symbols-outlined text-[20px]">post_add</span>
                </button>
              </div>

              {/* Progress Visual */}
              <div className="flex flex-col gap-1 mt-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#564338] flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[14px] text-[#9a4600]">
                      flag
                    </span>
                    里程碑達成率
                  </span>
                  <span className="font-bold text-[#9a4600]">{proj.progress}%</span>
                </div>
                <div className="w-full h-2 bg-[#f1f4f1] rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      proj.progress >= 85
                        ? 'bg-gradient-to-r from-[#68b98e] to-[#106c47]'
                        : 'bg-gradient-to-r from-[#ffdbc9] to-[#ff8a3d]'
                    }`}
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>
              </div>

              {/* Optional TestFlight image thumbnail if present */}
              {proj.previewImage && (
                <div className="flex items-center gap-2.5 bg-[#f1f4f1]/60 p-2 rounded-xl border border-[#ecefeb]">
                  <img
                    alt="App Preview"
                    className="w-12 h-12 object-cover rounded-lg shrink-0 shadow-xs ring-1 ring-white"
                    src={proj.previewImage}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[12px] font-bold text-[#181c1b] truncate">
                      TestFlight V1.2.0 已提交審核
                    </span>
                    <span className="text-[11px] text-[#564338] truncate">
                      累計 {proj.noteCount} 筆記錄 / 預計下週日上架 App Store
                    </span>
                  </div>
                </div>
              )}

              {/* Recent Log Snippet Box (Stationery Memo style) */}
              {proj.latestMemo && (
                <div className="bg-[#f1f4f1]/70 rounded-xl p-2.5 flex flex-col gap-1 border border-[#ecefeb]/60">
                  <div className="flex items-center justify-between text-[11px] text-[#564338]">
                    <span className="flex items-center gap-1 font-semibold text-[#181c1b]">
                      <span className="material-symbols-outlined text-[14px] text-[#7d5800]">
                        history_edu
                      </span>
                      最新記事便籤
                    </span>
                    <span>{proj.latestMemoTime}</span>
                  </div>
                  <p className="text-[12px] text-[#564338] line-clamp-2 leading-relaxed">
                    {proj.latestMemo}
                  </p>
                </div>
              )}

              {/* Card Footer: Metadata & Collaborators */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-[#564338]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-[#106c47]">
                      description
                    </span>
                    {proj.noteCount} 筆記事
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-[#7d5800]">
                      pets
                    </span>
                    +{proj.fishRewards} 魚乾獎勵
                  </span>
                </div>

                {/* Member Avatars */}
                <div className="flex items-center -space-x-2">
                  {proj.members.map((m, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full bg-[#ffdea9] border border-white flex items-center justify-center text-[10px] font-bold text-[#271900] shadow-xs"
                    >
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Gantt & Timeline View */}
      {viewMode === 'gantt' && (
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#ecefeb] flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#9a4600] text-[20px]">
                calendar_month
              </span>
              <span className="text-[15px] font-bold text-[#181c1b]">
                2024 年 10 月里程甘特圖
              </span>
            </div>
            <span className="text-[11px] bg-[#ffdbc9] text-[#321200] font-bold px-2 py-0.5 rounded-full">
              第 43 週
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {projects.map((proj) => (
              <div key={proj.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#181c1b] truncate max-w-[200px]">
                    {proj.name}
                  </span>
                  <span
                    className={
                      proj.status === '即將截止'
                        ? 'text-[#ba1a1a] font-bold'
                        : 'text-[#564338]'
                    }
                  >
                    {proj.startDate || '10/01'} - {proj.dueDate || '10/30'}
                  </span>
                </div>
                <div className="w-full bg-[#f1f4f1] h-7 rounded-lg relative overflow-hidden flex items-center p-1 border border-[#ecefeb]">
                  <div
                    className={`h-full rounded-md flex items-center px-2 text-white text-[10px] font-bold shadow-xs transition-all ${
                      proj.status === '即將截止'
                        ? 'bg-[#ff8a3d]'
                        : proj.progress >= 85
                        ? 'bg-[#106c47]'
                        : 'bg-[#9a4600]'
                    }`}
                    style={{ width: `${Math.max(25, proj.progress)}%` }}
                  >
                    <span className="truncate">
                      {proj.phaseDesc || `${proj.progress}%`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-1 p-2.5 bg-[#f1f4f1] rounded-xl flex items-center gap-2 text-[#564338] text-[11px] border border-[#ecefeb]">
            <span className="material-symbols-outlined text-[#7d5800] text-[18px] shrink-0">
              lightbulb
            </span>
            <span>長按甘特進度條即可快速延展工期，或指派里程碑獎勵給萌寵。</span>
          </div>
        </div>
      )}

      {/* Floating Sticky Action Button (New Project) */}
      <div className="fixed right-4 bottom-24 z-40">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 h-12 bg-[#ff8a3d] hover:bg-[#9a4600] text-white rounded-full shadow-lg active:scale-95 transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span className="text-[14px] font-bold">新專案</span>
        </button>
      </div>

      {/* New Project Modal Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col gap-4 border border-[#ecefeb] animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[20px]">✨</span>
                <h3 className="text-[16px] font-bold text-[#181c1b]">建立全新專案</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#8a7266] hover:text-[#181c1b] p-1 rounded-full"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#181c1b]">專案名稱</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="例如：2025 攝影展籌備、閱讀馬拉松"
                  className="h-10 px-3 bg-[#f1f4f1] text-[#181c1b] rounded-xl text-[13px] border border-[#ecefeb] focus:outline-none focus:ring-1 focus:ring-[#9a4600]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-bold text-[#181c1b]">分類標籤</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="h-10 px-2 bg-[#f1f4f1] text-[#181c1b] rounded-xl text-[12px] border border-[#ecefeb] focus:outline-none"
                  >
                    <option>品牌營銷 🎨</option>
                    <option>個人研發 💻</option>
                    <option>客戶服務 💼</option>
                    <option>健康養成 🐾</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-bold text-[#181c1b]">預計截止日</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="h-10 px-2 bg-[#f1f4f1] text-[#181c1b] rounded-xl text-[12px] border border-[#ecefeb] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#ffdea9]/30 rounded-xl border border-[#ffba27]/30">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#7d5800] text-[18px]">
                    redeem
                  </span>
                  <span className="text-[11px] text-[#5e4100]">
                    達成此專案將獎勵萌寵：
                  </span>
                </div>
                <span className="text-[12px] font-bold text-[#7d5800]">
                  🐟 小魚乾 x30
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#f1f4f1] text-[#564338] text-[12px] font-bold hover:bg-[#ecefeb]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#9a4600] text-white text-[12px] font-bold hover:bg-[#ff8a3d] shadow-sm cursor-pointer"
                >
                  立即建立並指派任務
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
