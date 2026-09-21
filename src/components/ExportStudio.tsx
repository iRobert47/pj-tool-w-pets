import React, { useState } from 'react';
import { ASSETS } from '../data/initialData';
import { Pet, Project, QuickNote } from '../types';

interface ExportStudioProps {
  pet: Pet;
  projects: Project[];
  notes: QuickNote[];
}

export const ExportStudio: React.FC<ExportStudioProps> = ({
  pet,
  projects,
  notes,
}) => {
  const [template, setTemplate] = useState<
    'weekly' | 'meeting' | 'client' | 'raw'
  >('weekly');
  const [dateRange, setDateRange] = useState<'this-week' | 'this-month' | 'custom'>(
    'this-week'
  );
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(
    projects.map((p) => p.id)
  );
  const [includeHours, setIncludeHours] = useState<boolean>(true);
  const [includeBlockers, setIncludeBlockers] = useState<boolean>(true);
  const [includePetMilestone, setIncludePetMilestone] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'preview' | 'markdown'>('preview');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  const toggleProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const showCopyFeedback = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 2500);
  };

  // Generate dynamic Markdown output
  const generateMarkdown = () => {
    const activeProjects = projects.filter((p) =>
      selectedProjectIds.includes(p.id)
    );

    if (template === 'meeting') {
      return `# 👥 會議結論與決策速報 (Meeting Summary)
> **日期**：2024 年 10 月 24 日 | **記錄人**：陳立凡  
> **關聯專案**：${activeProjects.map((p) => p.name).join('、')}

---

### 1. 核心決策與共識 (Key Decisions)
- **品牌識別規範**：確認色票主色為暖琥珀橘與和風薄荷綠，完成按鈕原子元件庫統整。
- **排程進度確認**：TestFlight 審核通過後，下週三正式啟動首波 200 名用戶封測。

### 2. 待辦跟進清單 (Action Items)
- [ ] @立凡 統整 Q3 季會簡報 4-8 頁數據架構 (截止: 10/25 14:00)
- [ ] @翔 完成 API 規格書錯誤代碼表與 Webhook 測試
- [ ] @安 交付社群貼文第一批形象插畫

${includePetMilestone ? `> 🐾 **萌寵備忘**：阿吉本次會議陪伴守護，額外獲得金幣 +50 🪙` : ''}
`;
    }

    if (template === 'client') {
      return `# 🎯 專案階段性成果交付簡報 (Client Status Report)
**客戶名稱**：星雲數位傳媒  
**專案統整**：${activeProjects.map((p) => p.name).join('、')}  
**報告期間**：2024.10.21 - 2024.10.27

---

### 一、階段性交付進度總結
${activeProjects
  .map(
    (p) => `- **${p.name}**：目前總進度 **${p.progress}%**（${p.status}）
  - 本週重點備忘：${p.latestMemo}`
  )
  .join('\n')}

### 二、工時與投入效益
${includeHours ? `- 本週累計專注投入：**14.5 小時**\n- 交付成果包含設計規格手冊 1 份、審核提報 1 份` : ''}

### 三、下階段重要里程碑 (Next Milestones)
1. 10/28 完成系統架構驗收
2. 10/31 進行客戶端連線驗證測試
`;
    }

    // Default: Weekly Report
    return `# 🐾 2024 年第 43 週工作週報 (Pawject Weekly Summary)
> **報告人**：陳立凡 (Lead PM) | **統整週期**：2024.10.21 - 2024.10.27  
> **專案狀態**：${activeProjects.length} 個專案並行推進 | **守護伴侶**：${pet.name} (Lv.${pet.level})

---

### 一、本週核心成果突破 (Highlights)
- 🌟 **品牌網站改版 2024**：達成進度 78%，完成首頁 Hero Section 視覺微調與多螢幕響應式驗收。
- 📱 **貓咪健康管家 App**：TestFlight V1.2.0 已順利提交 Apple 審核，預計下週日正式推出。
- 💼 **客戶 Q3 季會**：完成提案簡報前導大綱與商業效益模型設計。

### 二、各專案進度與工時明細 (Project Breakdown)
${activeProjects
  .map(
    (p) =>
      `#### 📌 ${p.name} (${p.category})
- **當前進度**：\`${p.progress}%\` | **狀態**：${p.status}
- **最新記事**：${p.latestMemo}
${includeHours ? `- **專注時數**：${(p.progress * 0.15).toFixed(1)} 小時 | 記事記錄：${p.noteCount} 筆` : ''}`
  )
  .join('\n\n')}

${
  includeBlockers
    ? `### 三、遭遇問題與解決方案 (Blockers & Mitigations)
1. **外部 API 連線延遲**：已改用本地快取機制，載入時間自 1.8s 降至 240ms。
2. **季會排程衝突**：已與利害關係人對齊，將提案改為週五下午以實體會議進行。`
    : ''
}

${
  includePetMilestone
    ? `### 四、下週目標規劃與萌寵加倍里程碑 (Next Week Objectives)
- [ ] 完成品牌網站首頁動態驗收，解鎖「金牌飼養員」徽章
- [ ] 貓咪健康管家 App Store 正式上線，投餵頂級海鮮盛宴罐
- [ ] 維持連續打卡 15 天，挑戰解鎖新萌友「柴犬·波波」技能！`
    : ''
}
`;
  };

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showCopyFeedback(`✅ ${label} 已成功複製到剪貼簿！`);
    } else {
      showCopyFeedback(`已選取內容`);
    }
  };

  const handleDownload = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    showCopyFeedback(`💾 ${filename} 下載已啟動！`);
  };

  const markdownContent = generateMarkdown();

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-4 pb-28 gap-4 pt-3 relative">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#f1f4f1] via-white to-[#ffdea9]/30 p-4 shadow-xs border border-[#ecefeb] flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[18px]">📑</span>
            <h1 className="text-[18px] font-bold text-[#181c1b]">
              結構化匯出中心 (Desktop Studio)
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#ffdea9] text-[#271900] text-[10px] font-bold">
              Markdown / Notion / Slack
            </span>
          </div>
          <p className="text-[12px] text-[#564338] mt-1">
            將手帳瑣碎記錄，一鍵重組為專業、結構化的週報或工作匯報。
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(markdownContent, 'Markdown 格式')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#9a4600] text-white text-[12px] font-bold shadow-xs hover:bg-[#ff8a3d] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            <span>複製 Markdown</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Left Config Panel, Right Live Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Config Panel (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* 1. Template Presets */}
          <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-[#ecefeb] flex flex-col gap-2">
            <span className="text-[12px] font-bold text-[#181c1b] flex items-center gap-1">
              <span className="material-symbols-outlined text-[#9a4600] text-[16px]">
                description
              </span>
              選擇匯出範本
            </span>
            <div className="flex flex-col gap-1.5">
              {[
                { id: 'weekly', title: '📑 標準工作週報 (Weekly Report)', desc: '含核心成果、專案細節與下週目標' },
                { id: 'meeting', title: '💬 會議結論速報 (Meeting Summary)', desc: '側重決策共識與跟進待辦' },
                { id: 'client', title: '🎯 客戶進度彙整 (Client Status)', desc: '對外交付進度與里程碑百分比' },
                { id: 'raw', title: '📝 簡約純條列 (Raw Bullet Points)', desc: '適合快速貼到 Slack 頻道' },
              ].map((t) => {
                const isSelected = template === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id as any)}
                    className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#ffdbc9]/40 border-[#ff8a3d] text-[#181c1b] shadow-xs'
                        : 'bg-[#f1f4f1] border-transparent text-[#564338] hover:bg-[#ecefeb]'
                    }`}
                  >
                    <div className="text-[12px] font-bold">{t.title}</div>
                    <div className="text-[10px] text-[#8a7266] mt-0.5">{t.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Date Range & Projects */}
          <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-[#ecefeb] flex flex-col gap-2.5">
            <span className="text-[12px] font-bold text-[#181c1b] flex items-center gap-1">
              <span className="material-symbols-outlined text-[#7d5800] text-[16px]">
                date_range
              </span>
              資料涵蓋範圍
            </span>

            {/* Date Pill Toggle */}
            <div className="grid grid-cols-3 gap-1 bg-[#f1f4f1] p-1 rounded-xl">
              {[
                { id: 'this-week', label: '本週 (43週)' },
                { id: 'this-month', label: '本月 (10月)' },
                { id: 'custom', label: '自訂' },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDateRange(d.id as any)}
                  className={`py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    dateRange === d.id
                      ? 'bg-white text-[#9a4600] shadow-xs'
                      : 'text-[#564338]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Project Checkboxes */}
            <div className="flex flex-col gap-1.5 mt-1">
              <span className="text-[11px] text-[#564338] font-semibold">
                納入專案手帳：
              </span>
              {projects.map((p) => {
                const checked = selectedProjectIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#f1f4f1] cursor-pointer text-[12px] text-[#181c1b]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProject(p.id)}
                      className="accent-[#9a4600] w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="truncate">{p.name}</span>
                  </label>
                );
              })}
            </div>

            {/* Extra Field Toggles */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-[#ecefeb]">
              <label className="flex items-center gap-2 text-[11px] text-[#564338] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHours}
                  onChange={(e) => setIncludeHours(e.target.checked)}
                  className="accent-[#106c47]"
                />
                <span>包含專注工時與進度百分比</span>
              </label>

              <label className="flex items-center gap-2 text-[11px] text-[#564338] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBlockers}
                  onChange={(e) => setIncludeBlockers(e.target.checked)}
                  className="accent-[#106c47]"
                />
                <span>自動標記關鍵阻塞 (Blockers)</span>
              </label>

              <label className="flex items-center gap-2 text-[11px] text-[#564338] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePetMilestone}
                  onChange={(e) => setIncludePetMilestone(e.target.checked)}
                  className="accent-[#106c47]"
                />
                <span>附帶下週萌寵里程碑目標</span>
              </label>
            </div>
          </div>

          {/* Desktop Sync Pet Supervisor Widget */}
          <div className="bg-[#ffdea9]/30 p-3 rounded-2xl border border-[#ffba27]/30 flex items-center gap-2.5">
            <img
              alt="Mascot Supervisor"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
              src={ASSETS.catDesk}
            />
            <div className="flex flex-col text-[11px] text-[#5e4100] leading-snug">
              <span className="font-bold">阿吉正在核對你的週報數據喵！</span>
              <span>已收錄 6 筆進度與 8.5h 專注工時。</span>
            </div>
          </div>
        </div>

        {/* Right Live Document Canvas (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-2.5">
          {/* Canvas Toolbar */}
          <div className="bg-white p-2.5 rounded-2xl shadow-xs border border-[#ecefeb] flex items-center justify-between flex-wrap gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#f1f4f1] p-0.5 rounded-xl border border-[#ecefeb]">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-white text-[#9a4600] shadow-xs'
                    : 'text-[#564338]'
                }`}
              >
                預覽排版
              </button>
              <button
                onClick={() => setViewMode('markdown')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  viewMode === 'markdown'
                    ? 'bg-white text-[#9a4600] shadow-xs'
                    : 'text-[#564338]'
                }`}
              >
                Markdown 源代碼
              </button>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-[#8a7266]">
              <span>約 {markdownContent.length} 字</span>
              <span>・</span>
              <span>6 項重點</span>
            </div>

            {/* Quick Export Actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => copyToClipboard(markdownContent, 'Markdown 代碼')}
                className="px-2.5 py-1 rounded-lg bg-[#f1f4f1] hover:bg-[#ecefeb] text-[#181c1b] text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="複製 Markdown"
              >
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                <span>複製 MD</span>
              </button>

              <button
                onClick={() =>
                  copyToClipboard(
                    markdownContent.replace(/[#*`>_-]/g, ''),
                    '純文字格式'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-[#f1f4f1] hover:bg-[#ecefeb] text-[#181c1b] text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="複製純文字"
              >
                <span className="material-symbols-outlined text-[14px]">text_fields</span>
                <span>純文字</span>
              </button>

              <button
                onClick={() =>
                  handleDownload(
                    `Pawject_Report_${new Date().toISOString().slice(0, 10)}.md`,
                    markdownContent
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-[#ffdbc9] text-[#763300] hover:bg-[#ff8a3d] hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="下載 Markdown 檔案"
              >
                <span className="material-symbols-outlined text-[14px]">download</span>
                <span>下載 .MD</span>
              </button>
            </div>
          </div>

          {/* Document Content Box */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#ecefeb] min-h-[420px] font-sans">
            {viewMode === 'markdown' ? (
              <textarea
                readOnly
                value={markdownContent}
                className="w-full h-96 p-3 bg-[#f1f4f1] rounded-xl font-mono text-[12px] text-[#181c1b] leading-relaxed resize-none focus:outline-none border border-[#ecefeb]"
              />
            ) : (
              <div className="prose max-w-none text-[#181c1b] leading-relaxed space-y-3">
                <div className="border-b border-[#ecefeb] pb-3">
                  <h2 className="text-[19px] font-bold text-[#181c1b] flex items-center gap-2">
                    <span>🐾</span>
                    <span>2024 年第 43 週工作週報 (Pawject Weekly Summary)</span>
                  </h2>
                  <div className="flex items-center gap-2 text-[11px] text-[#564338] mt-1 flex-wrap">
                    <span>報告人：陳立凡 (Lead PM)</span>
                    <span>•</span>
                    <span>週期：2024.10.21 - 2024.10.27</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#ffdea9] text-[#271900] font-bold text-[10px]">
                      伴侶：阿吉 (Lv.8)
                    </span>
                  </div>
                </div>

                {/* Rendered Preview Sections */}
                <div className="space-y-4 pt-1">
                  <div>
                    <h3 className="text-[14px] font-bold text-[#9a4600] flex items-center gap-1 mb-1">
                      <span>一、本週核心成果突破 (Highlights)</span>
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-[13px] text-[#2d312f] pl-1">
                      <li>
                        <strong>品牌網站改版 2024</strong>：達成進度 78%，完成首頁
                        Hero Section 視覺微調與多螢幕響應式驗收。
                      </li>
                      <li>
                        <strong>貓咪健康管家 App</strong>：TestFlight V1.2.0 已順利提交
                        Apple 審核，預計下週正式推出。
                      </li>
                      <li>
                        <strong>客戶 Q3 季會</strong>：完成提案簡報前導大綱與商業效益模型設計。
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-[14px] font-bold text-[#9a4600] flex items-center gap-1 mb-1">
                      <span>二、各專案進度與工時明細 (Project Breakdown)</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      {projects
                        .filter((p) => selectedProjectIds.includes(p.id))
                        .map((p) => (
                          <div
                            key={p.id}
                            className="bg-[#f1f4f1] p-3 rounded-xl border border-[#ecefeb]"
                          >
                            <div className="flex justify-between items-center text-[12px] font-bold">
                              <span className="truncate">{p.name}</span>
                              <span className="text-[#9a4600]">{p.progress}%</span>
                            </div>
                            <p className="text-[11px] text-[#564338] mt-1 line-clamp-2">
                              {p.latestMemo}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>

                  {includeBlockers && (
                    <div>
                      <h3 className="text-[14px] font-bold text-[#7d5800] flex items-center gap-1 mb-1">
                        <span>三、遭遇問題與因應措施 (Blockers & Mitigations)</span>
                      </h3>
                      <div className="p-2.5 rounded-xl bg-[#ffdea9]/20 border border-[#ffba27]/30 text-[12px] text-[#5e4100] space-y-1">
                        <div>
                          • <strong>外部 API 連線延遲</strong>：已改用本地快取機制，載入時間自 1.8s 降至 240ms。
                        </div>
                        <div>
                          • <strong>季會排程衝突</strong>：已與利害關係人對齊，將提案改為週五下午以實體會議進行。
                        </div>
                      </div>
                    </div>
                  )}

                  {includePetMilestone && (
                    <div>
                      <h3 className="text-[14px] font-bold text-[#106c47] flex items-center gap-1 mb-1">
                        <span>四、下週目標規劃與萌寵加倍里程碑 (Next Week Objectives)</span>
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-[13px] text-[#2d312f] pl-1">
                        <li>完成品牌網站首頁動態驗收，解鎖「金牌飼養員」徽章</li>
                        <li>貓咪健康管家 App Store 正式上線，投餵頂級海鮮盛宴罐</li>
                        <li>維持連續打卡 15 天，挑戰解鎖新萌友「柴犬·波波」技能！</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Target Format Converters Toolbar */}
          <div className="bg-white p-3 rounded-2xl shadow-xs border border-[#ecefeb] flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] font-bold text-[#181c1b] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#9a4600]">
                send
              </span>
              快速轉發至工作團隊應用：
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  copyToClipboard(
                    `> 🐾 *Pawject 週報提要*\n${markdownContent.slice(0, 300)}...`,
                    'Slack 格式'
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-[#f1f4f1] hover:bg-[#ecefeb] text-[11px] font-bold text-[#181c1b] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>💬 複製到 Slack / Teams</span>
              </button>

              <button
                onClick={() =>
                  copyToClipboard(markdownContent, 'Notion 區塊代碼')
                }
                className="px-3 py-1.5 rounded-xl bg-[#f1f4f1] hover:bg-[#ecefeb] text-[11px] font-bold text-[#181c1b] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>📑 複製到 Notion</span>
              </button>

              <button
                onClick={() => {
                  window.location.href = `mailto:?subject=${encodeURIComponent(
                    '2024第43週工作週報 - Pawject'
                  )}&body=${encodeURIComponent(
                    markdownContent.replace(/[#*`>_-]/g, '')
                  )}`;
                }}
                className="px-3 py-1.5 rounded-xl bg-[#9a4600] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:bg-[#ff8a3d] transition-colors"
              >
                <span>✉️ Email 送出</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed top-20 inset-x-4 max-w-md mx-auto z-50 transition-all duration-300 transform">
          <div className="rounded-2xl bg-[#2d312f] text-white p-3.5 shadow-2xl flex items-center gap-2.5 border border-white/10">
            <span className="text-[20px]">📋</span>
            <span className="text-[12px] font-bold">{copiedToast}</span>
          </div>
        </div>
      )}
    </div>
  );
};
