import React, { useState } from 'react';
import { ASSETS } from '../data/initialData';
import { Achievement, Pet } from '../types';
import { InteractiveCatOnChair } from './InteractiveCatOnChair';

interface PetSanctuaryProps {
  pets: Pet[];
  activePetId: string;
  onSwitchPet: (petId: string) => void;
  achievements: Achievement[];
  onPetActionFeedback: (action: string) => void;
  onIntimacyGain?: (amount: number) => void;
  onFeed?: (amount: number) => void;
}

export const PetSanctuary: React.FC<PetSanctuaryProps> = ({
  pets,
  activePetId,
  onSwitchPet,
  achievements,
  onPetActionFeedback,
  onIntimacyGain,
  onFeed,
}) => {
  const activePet = pets.find((p) => p.id === activePetId) || pets[0];

  const [dialogue, setDialogue] = useState<string>(
    '喵！主人今天的工作也辛苦啦～'
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAvatarRotating, setIsAvatarRotating] = useState<boolean>(false);
  const [floatingHearts, setFloatingHearts] = useState<
    { id: number; left: number; top: number }[]
  >([]);

  const triggerHearts = () => {
    const newHearts = Array.from({ length: 3 }).map((_, i) => ({
      id: Date.now() + i,
      left: 40 + Math.random() * 20,
      top: 30 + Math.random() * 20,
    }));
    setFloatingHearts((prev) => [...prev, ...newHearts]);
    setTimeout(() => {
      setFloatingHearts((prev) =>
        prev.filter((h) => !newHearts.some((nh) => nh.id === h.id))
      );
    }, 850);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleAction = (action: 'pet' | 'toy' | 'dress') => {
    onPetActionFeedback(action);

    if (action === 'pet') {
      setDialogue('（蹭蹭你的手）呼嚕呼嚕～最喜歡主人摸頭了！🐾');
      triggerHearts();
      showToast('🐾 摸摸頭成功！親密度 +5');
    } else if (action === 'toy') {
      setDialogue('喵嗚！毛線球滾走啦，阿吉馬上去抓～🧶');
      setIsAvatarRotating(true);
      setTimeout(() => setIsAvatarRotating(false), 400);
      showToast('🧶 玩具整理完畢，心情值提升！');
    } else if (action === 'dress') {
      setDialogue('這條新領巾好看嗎？今天也要元氣滿滿！🎀');
      triggerHearts();
      showToast('🎀 阿吉換上了最喜歡的手作紅領巾！');
    }
  };

  const handlePetClick = () => {
    triggerHearts();
    const dialogues = [
      '喵嗚！今天的工作記一筆了嗎？✨',
      '呼嚕呼嚕...主人好溫柔呀～💖',
      '累了的話就休息五分鐘吧喵！☕',
      '阿吉會一直在這裡陪著你哦！🐾',
    ];
    setDialogue(dialogues[Math.floor(Math.random() * dialogues.length)]);
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 pb-28 gap-4 pt-3 relative">
      {/* Pet Habitat Showcase (Living Room Stage) */}
      <section className="relative w-full rounded-2xl overflow-hidden shadow-xs bg-white border border-[#ecefeb] flex flex-col">
        {/* Cozy Room Backdrop Layer */}
        <div className="relative w-full h-64 bg-gradient-to-b from-[#ffdbc9]/30 via-[#ffdea9]/20 to-white overflow-hidden flex items-end justify-center">
          <img
            alt="Living Room Habitat"
            className="absolute inset-0 w-full h-full object-cover opacity-85"
            src={ASSETS.livingRoom}
          />

          {/* Living Room Decor & Ambient Floating Icons */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-full shadow-xs text-[#181c1b] border border-[#ecefeb]">
              <span
                className="material-symbols-outlined text-[#9a4600] text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                pets
              </span>
              <span className="text-[11px] font-bold">伴侶小屋 · 陽光客廳</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#ffdea9]/85 backdrop-blur-xs rounded-full text-[#271900] w-max text-[10px] font-medium border border-[#ffba27]/30">
              <span className="material-symbols-outlined text-[13px]">wb_sunny</span>
              <span>舒適微風 24°C</span>
            </span>
          </div>

          {/* Streak Pill Floating Top Right */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 bg-[#ff8a3d] text-white rounded-full shadow-xs text-[11px] font-bold">
            <span>相伴 {activePet.companionDays} 天</span>
          </div>

          {/* Interactive Pet Character Showcase */}
          {activePet.id === 'pet-miaomiao' ? (
            <div className="relative z-10 w-full mb-3 flex flex-col items-center">
              <InteractiveCatOnChair
                size="lg"
                showControls={true}
                onIntimacyGain={onIntimacyGain}
                onFeed={onFeed}
                className="w-full"
              />
            </div>
          ) : (
            <div
              onClick={handlePetClick}
              className="relative z-10 flex flex-col items-center mb-3 select-none cursor-pointer group"
            >
              {/* Speech Bubble Micro-interaction */}
              <div className="mb-2 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full shadow-xs text-[#181c1b] flex items-center gap-1 border border-[#ecefeb]">
                <span className="material-symbols-outlined text-[#7d5800] text-[15px]">
                  chat_bubble
                </span>
                <span className="text-[11px] font-bold">{dialogue}</span>
              </div>

              {/* Pet Illustrated Avatar */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <img
                  alt={activePet.name}
                  className={`w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(154,70,0,0.18)] transition-transform duration-200 ${
                    isAvatarRotating ? 'rotate-6 scale-105' : 'group-hover:scale-105'
                  }`}
                  src={activePet.standingUrl || activePet.avatarUrl}
                />

                {/* Floating Hearts */}
                <div className="absolute inset-0 pointer-events-none overflow-visible">
                  {floatingHearts.map((h) => (
                    <span
                      key={h.id}
                      className="absolute text-xl animate-bounce"
                      style={{ left: `${h.left}%`, top: `${h.top}%` }}
                    >
                      ❤️
                    </span>
                  ))}
                </div>
              </div>

              {/* Character Name Pill & Level */}
              <div className="mt-1 flex items-center gap-1 px-3 py-1 bg-[#f1f4f1]/90 rounded-full shadow-xs border border-[#ecefeb]">
                <span className="w-2 h-2 rounded-full bg-[#106c47] animate-ping" />
                <span className="text-[11px] font-bold text-[#181c1b]">
                  {activePet.name} (Lv.{activePet.level})
                </span>
                <span className="text-[11px] text-[#9a4600] font-bold">
                  心情: 愉悅 💕
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Status Meters Card */}
        <div className="p-4 flex flex-col gap-3 bg-white">
          <div className="grid grid-cols-2 gap-2.5">
            {/* Hunger Bar */}
            <div className="bg-[#f1f4f1] p-2.5 rounded-xl flex flex-col gap-1 border border-[#ecefeb]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[11px] text-[#564338] font-bold">
                  <span className="material-symbols-outlined text-[#7d5800] text-[15px]">
                    lunch_dining
                  </span>
                  飽食度
                </span>
                <span className="text-[11px] font-bold text-[#7d5800]">
                  {activePet.hunger}%
                </span>
              </div>
              <div className="w-full h-2 bg-[#e0e3e0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ffb702] rounded-full transition-all duration-500"
                  style={{ width: `${activePet.hunger}%` }}
                />
              </div>
            </div>

            {/* Intimacy Bar */}
            <div className="bg-[#f1f4f1] p-2.5 rounded-xl flex flex-col gap-1 border border-[#ecefeb]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[11px] text-[#564338] font-bold">
                  <span
                    className="material-symbols-outlined text-[#9a4600] text-[15px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    favorite
                  </span>
                  親密度
                </span>
                <span className="text-[11px] font-bold text-[#9a4600]">
                  {activePet.intimacy}/500
                </span>
              </div>
              <div className="w-full h-2 bg-[#e0e3e0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ff8a3d] rounded-full transition-all duration-500"
                  style={{ width: `${(activePet.intimacy / 500) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tactile Action Stamp Buttons */}
          <div className="grid grid-cols-3 gap-2 mt-1">
            <button
              onClick={() => handleAction('pet')}
              className="flex flex-col items-center justify-center py-2 px-1 bg-[#ffdbc9]/40 active:bg-[#ff8a3d] active:text-white text-[#763300] rounded-xl transition-all active:scale-95 shadow-xs border border-[#ffdbc9] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">pets</span>
              <span className="text-[11px] font-bold mt-0.5">摸摸頭 🐾</span>
              <span className="text-[9px] text-[#9a4600] font-bold opacity-90">
                +5 親密
              </span>
            </button>

            <button
              onClick={() => handleAction('toy')}
              className="flex flex-col items-center justify-center py-2 px-1 bg-[#ffdea9]/40 active:bg-[#ffb702] active:text-[#271900] text-[#5e4100] rounded-xl transition-all active:scale-95 shadow-xs border border-[#ffdea9] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                sports_baseball
              </span>
              <span className="text-[11px] font-bold mt-0.5">整理玩具 🧶</span>
              <span className="text-[9px] text-[#7d5800] font-bold opacity-90">
                心情提升
              </span>
            </button>

            <button
              onClick={() => handleAction('dress')}
              className="flex flex-col items-center justify-center py-2 px-1 bg-[#a1f4c5]/40 active:bg-[#106c47] active:text-white text-[#00482d] rounded-xl transition-all active:scale-95 shadow-xs border border-[#a1f4c5] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">styler</span>
              <span className="text-[11px] font-bold mt-0.5">換裝打扮 🎀</span>
              <span className="text-[9px] text-[#106c47] font-bold opacity-90">
                小紅領巾
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Companion Roster / Pet Switcher Section */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#9a4600] text-[18px]">
              groups
            </span>
            <h2 className="text-[15px] font-bold text-[#181c1b]">萌友圖鑑名冊</h2>
          </div>
          <span className="text-[10px] text-[#564338] font-bold bg-[#ecefeb] px-2.5 py-0.5 rounded-full">
            已解鎖 {pets.filter((p) => p.unlocked).length} / {pets.length}
          </span>
        </div>

        {/* Pet Cards Stack */}
        <div className="flex flex-col gap-2.5">
          {pets.map((p) => {
            const isActive = p.id === activePetId;
            return (
              <div
                key={p.id}
                className={`relative p-3.5 rounded-2xl border shadow-xs flex items-start gap-3 transition-all ${
                  isActive
                    ? 'bg-white border-[#ff8a3d]/50 ring-1 ring-[#ff8a3d]/20'
                    : p.unlocked
                    ? 'bg-white border-[#ecefeb]'
                    : 'bg-[#f1f4f1]/80 border-[#ecefeb] opacity-80'
                }`}
              >
                <div className="relative w-14 h-14 rounded-xl bg-[#f1f4f1] shrink-0 flex items-center justify-center overflow-hidden border border-[#ecefeb]">
                  <img
                    alt={p.name}
                    className={`w-12 h-12 object-cover ${
                      !p.unlocked ? 'opacity-35 grayscale' : ''
                    }`}
                    src={p.avatarUrl}
                  />
                  {p.unlocked ? (
                    <span className="absolute bottom-0 right-0 bg-[#9a4600] text-white text-[9px] font-bold px-1 rounded-tl">
                      Lv.{p.level}
                    </span>
                  ) : (
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[14px] font-bold text-[#181c1b] truncate">
                        {p.name}
                      </span>
                      {isActive && (
                        <span className="px-1.5 py-0.2 bg-[#ffdbc9] text-[#763300] text-[9px] font-bold rounded">
                          啟用中
                        </span>
                      )}
                    </div>

                    {p.unlocked && !isActive && (
                      <button
                        onClick={() => {
                          onSwitchPet(p.id);
                          showToast(`✨ 已切換陪伴夥伴為「${p.name}」！`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#ffdea9] hover:bg-[#ffb702] text-[#271900] text-[10px] font-bold shadow-xs active:scale-95 transition-transform flex items-center gap-0.5 shrink-0 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[12px]">
                          sync_alt
                        </span>
                        切換陪伴
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-[#564338] mt-0.5">{p.title}</p>

                  {p.unlocked ? (
                    <div className="mt-1 flex items-center gap-1 px-2 py-0.5 bg-[#f1f4f1] rounded-lg text-[#564338] text-[10px]">
                      <span className="material-symbols-outlined text-[#9a4600] text-[14px]">
                        auto_awesome
                      </span>
                      <span className="font-medium truncate">{p.perk}</span>
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-col gap-0.5">
                      <div className="w-full h-1.5 bg-[#e0e3e0] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#8a7266] rounded-full"
                          style={{
                            width: `${
                              ((p.unlockProgress?.current || 0) /
                                (p.unlockProgress?.target || 1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-[9px] text-[#8a7266] text-right font-medium">
                        {p.unlockProgress?.remainingText}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Achievement Badges Wall */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#7d5800] text-[18px]">
              military_tech
            </span>
            <h2 className="text-[15px] font-bold text-[#181c1b]">榮譽成就勳章牆</h2>
          </div>
          <span className="text-[10px] text-[#564338] font-bold bg-[#ecefeb] px-2.5 py-0.5 rounded-full">
            解鎖進度 {achievements.filter((a) => a.achieved).length} /{' '}
            {achievements.length}
          </span>
        </div>

        {/* 2x2 Bento Badge Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="bg-white p-3.5 rounded-2xl shadow-xs border border-[#ecefeb] flex flex-col items-center text-center relative overflow-hidden"
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center text-[24px] shadow-xs mb-1 ${
                  ach.achieved ? 'bg-[#ffdea9]/50' : 'bg-[#f1f4f1]'
                }`}
              >
                {ach.icon}
              </div>
              <span className="text-[13px] font-bold text-[#181c1b]">
                {ach.name}
              </span>
              <span className="text-[10px] text-[#564338] mt-0.5">{ach.desc}</span>

              {ach.achieved ? (
                <div className="mt-2 px-2.5 py-0.5 bg-[#a1f4c5]/60 text-[#00482d] rounded-full text-[10px] font-bold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[13px]">
                    check_circle
                  </span>
                  已達成
                </div>
              ) : (
                <div className="mt-2 w-full flex flex-col items-center gap-1">
                  <div className="w-full h-1.5 bg-[#e0e3e0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#ffb702] rounded-full"
                      style={{ width: `${ach.progressPercent || 50}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-[#7d5800] font-bold">
                    {ach.progressPercent}% 進度
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 inset-x-4 max-w-sm mx-auto z-50 transition-all duration-300 transform flex justify-center pointer-events-none">
          <div className="bg-[#2d312f] text-white px-4 py-2 rounded-full shadow-xl text-[12px] font-bold flex items-center gap-1.5 border border-white/10">
            <span className="material-symbols-outlined text-[#ffdea9] text-[18px]">
              verified
            </span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
