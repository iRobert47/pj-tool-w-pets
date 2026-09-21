import React, { useState } from 'react';
import { PRD_MARKDOWN } from '../data/prdDocument';

export const PrdViewer: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(PRD_MARKDOWN);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([PRD_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Pawject_Product_Requirements_Document_PRD.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-28 gap-4 pt-3">
      {/* Top Header Card */}
      <div className="rounded-2xl bg-white p-5 shadow-xs border border-[#ecefeb] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#ffdbc9] text-[#763300] flex items-center justify-center text-2xl font-bold shadow-xs">
            📑
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] font-bold text-[#181c1b]">
                產品需求規格書 (PRD)
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#a1f4c5] text-[#00482d] text-[10px] font-bold">
                v2.4 Final
              </span>
            </div>
            <p className="text-[12px] text-[#564338] mt-0.5">
              完整產品設計定義、架構模型、用戶旅程與虛擬萌寵陪伴數值平衡體系。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f1f4f1] hover:bg-[#ecefeb] text-[#181c1b] text-[12px] font-bold transition-all cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? '已複製全文' : '複製 PRD 規格'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#9a4600] hover:bg-[#ff8a3d] text-white text-[12px] font-bold transition-all cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>下載 PRD.md</span>
          </button>
        </div>
      </div>

      {/* Main Formatted Document Container */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#ecefeb] text-[#181c1b] space-y-6">
        {/* Document Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[#f1f4f1] text-[12px]">
          <div>
            <span className="text-[#8a7266] block">產品名稱</span>
            <strong className="text-[#181c1b]">Pawject 萌寵手帳</strong>
          </div>
          <div>
            <span className="text-[#8a7266] block">產品類型</span>
            <strong className="text-[#181c1b]">專案日程與手帳工具</strong>
          </div>
          <div>
            <span className="text-[#8a7266] block">主要受眾</span>
            <strong className="text-[#181c1b]">設計師、PM、自律學生</strong>
          </div>
          <div>
            <span className="text-[#8a7266] block">設計風格</span>
            <strong className="text-[#9a4600]">日系手帳暖心美學</strong>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-2">
          <h2 className="text-[17px] font-bold text-[#9a4600] flex items-center gap-1.5 border-b border-[#ecefeb] pb-1.5">
            <span>1. 產品概述與背景 (Product Overview)</span>
          </h2>
          <p className="text-[13px] text-[#2d312f] leading-relaxed">
            現代專案管理工具（如 Jira、Notion、Trello）偏向嚴肅的企業進度監控，容易產生「待辦疲勞」與焦慮。
            Pawject 打破這種冰冷感，將<strong>專案推進、日常隨筆與專注計時</strong>轉化為對<strong>虛擬伴侶動物的陪伴與餵食</strong>，
            讓每一次微小努力都能即時獲得溫暖的正向情緒價值。
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-2">
          <h2 className="text-[17px] font-bold text-[#9a4600] flex items-center gap-1.5 border-b border-[#ecefeb] pb-1.5">
            <span>2. 核心功能規格模組 (Core Feature Modules)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-[#f1f4f1]/80 border border-[#ecefeb]">
              <h3 className="text-[14px] font-bold text-[#181c1b] flex items-center gap-1">
                <span>🐾 模組一：今日日程與守護儀表板</span>
              </h3>
              <ul className="list-disc list-inside text-[12px] text-[#564338] mt-1.5 space-y-1">
                <li>即時萌寵狀態：心靈台詞、飽食度(85%)、守護天數與升級進度條</li>
                <li>撫摸微互動：點擊頭像/按鈕噴發心型愛心粒子與隨機語音回應</li>
                <li>週曆膠囊滑桿：快速切換檢視週一至週日完成打卡圓點</li>
                <li>手帳時間軸任務：戳章勾選完成、分類標籤、一鍵轉入專注或記一筆</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f1f4f1]/80 border border-[#ecefeb]">
              <h3 className="text-[14px] font-bold text-[#181c1b] flex items-center gap-1">
                <span>✏️ 模組二：靈感手帳快速記錄 (Quick Log)</span>
              </h3>
              <ul className="list-disc list-inside text-[12px] text-[#564338] mt-1.5 space-y-1">
                <li>一鍵歸檔到所屬專案（支援動態新增專案）</li>
                <li>4大分類晶片：💡 靈感筆記、✅ 任務進度、👥 會議紀錄、🐞 問題追蹤</li>
                <li>滑桿互動：投入專注時數(0.5h~8h)與專案進度推進(+5%~+50%)</li>
                <li>犒賞餵食選擇：鮮美鮪魚罐、手撕嫩雞胸、頂級牛肉凍，送出噴發彩花</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f1f4f1]/80 border border-[#ecefeb]">
              <h3 className="text-[14px] font-bold text-[#181c1b] flex items-center gap-1">
                <span>📊 模組三：專案總覽看板與甘特圖 (Project Board)</span>
              </h3>
              <ul className="list-disc list-inside text-[12px] text-[#564338] mt-1.5 space-y-1">
                <li>雙重視圖：精美卡片模式 vs 甘特時間軸模式 (Timeline)</li>
                <li>手帳統計橫幅：進行中專案數、本月記事量、養成總餵食次數</li>
                <li>即時關鍵字搜尋與狀態過濾（全部、進行中、即將截止、已封存）</li>
                <li>可隨時建立全新專案抽屜，並預覽達成後獎勵之小魚乾</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f1f4f1]/80 border border-[#ecefeb]">
              <h3 className="text-[14px] font-bold text-[#181c1b] flex items-center gap-1">
                <span>⏱️ 模組四：沉浸專注番茄鐘 (Pomodoro Focus)</span>
              </h3>
              <ul className="list-disc list-inside text-[12px] text-[#564338] mt-1.5 space-y-1">
                <li>中心酣睡小貓圖像 (ASSETS) 與環形倒數計時視覺</li>
                <li>3 種時間模式：25 min 經典、50 min 深度、15 min 快速衝刺</li>
                <li>4 種療癒白噪音：貓咪呼嚕聲、窗外細雨、木質咖啡館、壁爐木炭</li>
                <li>完注獎勵：防中斷激勵，結算即刻獲得小魚乾 ×3 與親密度 +25</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f1f4f1]/80 border border-[#ecefeb]">
              <h3 className="text-[14px] font-bold text-[#181c1b] flex items-center gap-1">
                <span>🏡 模組五：萌寵樂園與圖鑑 (Pet Sanctuary)</span>
              </h3>
              <ul className="list-disc list-inside text-[12px] text-[#564338] mt-1.5 space-y-1">
                <li>日系和風生活客廳大舞台，支援摸摸頭、整理玩具、換裝紅領巾</li>
                <li>萌友名冊：橘貓·阿吉(啟用)、柴犬·波波(可切換)、水豚·泡泡、垂耳兔·麻糬</li>
                <li>2x2 榮譽勳章牆：記事達人、恆毅力之火、專案終結者、頂級飼育員</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f1f4f1]/80 border border-[#ecefeb]">
              <h3 className="text-[14px] font-bold text-[#181c1b] flex items-center gap-1">
                <span>📤 模組六：結構化匯出中心 (Export Studio)</span>
              </h3>
              <ul className="list-disc list-inside text-[12px] text-[#564338] mt-1.5 space-y-1">
                <li>多種範本預設：標準工作週報、會議結論速報、客戶進度彙整、簡約純條列</li>
                <li>即時 Markdown 排版預覽與純文字切換，支援一鍵下載 .MD</li>
                <li>一鍵複製轉發至 Notion、Slack / Teams 或 Email 商務格式</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-2">
          <h2 className="text-[17px] font-bold text-[#9a4600] flex items-center gap-1.5 border-b border-[#ecefeb] pb-1.5">
            <span>3. 視覺設計規範與色彩語意 (Design Tokens)</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px]">
            <div className="p-2.5 rounded-xl bg-[#ffdbc9]/40 border border-[#ffdbc9]">
              <span className="font-bold text-[#763300] block">主色 Amber Orange</span>
              <span className="text-[10px] text-[#564338]">#ff8a3d / #9a4600</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#ffdea9]/40 border border-[#ffba27]/30">
              <span className="font-bold text-[#5e4100] block">次色 Honey Gold</span>
              <span className="text-[10px] text-[#564338]">#ffb702 / #7d5800</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#a1f4c5]/40 border border-[#a1f4c5]">
              <span className="font-bold text-[#00482d] block">輔色 Sage Mint</span>
              <span className="text-[10px] text-[#564338]">#68b98e / #106c47</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f1f4f1] border border-[#ecefeb]">
              <span className="font-bold text-[#181c1b] block">背景 Cream Ivory</span>
              <span className="text-[10px] text-[#564338]">#f7faf7 / #ffffff</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
