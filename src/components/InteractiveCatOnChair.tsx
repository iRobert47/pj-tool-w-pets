import React, { useEffect, useRef, useState } from 'react';
import { catAudio } from '../utils/catAudio';

interface InteractiveCatOnChairProps {
  mode?: 'sitting' | 'sleeping' | 'stretching';
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showControls?: boolean;
  onIntimacyGain?: (amount: number) => void;
  onFeed?: (amount: number) => void;
  className?: string;
  inPomodoro?: boolean;
}

export const InteractiveCatOnChair: React.FC<InteractiveCatOnChairProps> = ({
  mode: initialMode = 'sitting',
  size = 'md',
  showControls = true,
  onIntimacyGain,
  onFeed,
  className = '',
  inPomodoro = false,
}) => {
  // Poses: sitting (椅子端坐), sleeping (蜷縮酣睡), stretching (伸大懶腰)
  const [currentPose, setCurrentPose] = useState<'sitting' | 'sleeping' | 'stretching'>(
    inPomodoro ? 'sleeping' : initialMode
  );

  // Tools: pet (撫摸), teaser (逗貓棒), treat (餵小魚乾)
  const [activeTool, setActiveTool] = useState<'pet' | 'teaser' | 'treat'>('pet');

  // Animation & Interaction states
  const [isPetting, setIsPetting] = useState<boolean>(false);
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const [isBellRinging, setIsBellRinging] = useState<boolean>(false);
  const [isBattingPaw, setIsBattingPaw] = useState<boolean>(false);
  const [isEating, setIsEating] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(true);

  // Dynamic eye tracking (normalized -1 to 1)
  const [pupilOffset, setPupilOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [headTilt, setHeadTilt] = useState<number>(0);

  // Wand/Feather position
  const [wandPos, setWandPos] = useState<{ x: number; y: number }>({ x: 180, y: 80 });

  // Floating feedback particles
  const [particles, setParticles] = useState<
    { id: number; text: string; x: number; y: number; color?: string }[]
  >([]);

  // Speech bubble
  const [dialogue, setDialogue] = useState<string>(
    inPomodoro
      ? '呼嚕嚕... 秒喵在椅子上陪你專注，加油喵... zZ'
      : '喵～我是秒喵！今天要在椅子上陪你一起努力喔🐾'
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const petTimerRef = useRef<any>(null);

  // Natural spontaneous blinking
  useEffect(() => {
    if (currentPose === 'sleeping') return;
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 220);
    }, 3800 + Math.random() * 2500);

    return () => clearInterval(blinkInterval);
  }, [currentPose]);

  // Handle pointer movement for Eye Tracking & Teaser Wand
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update wand position if in teaser mode
    if (activeTool === 'teaser') {
      setWandPos({ x, y });

      // If teaser feather gets close to cat head/paws, cat bats at it!
      const catCenterX = rect.width / 2;
      const catCenterY = rect.height * 0.45;
      const dist = Math.hypot(x - catCenterX, y - catCenterY);

      if (dist < 80 && !isBattingPaw && currentPose !== 'sleeping') {
        triggerPawBat();
      }
    }

    // Eye pupil tracking
    const relX = (x / rect.width - 0.5) * 2;
    const relY = (y / rect.height - 0.45) * 2;

    // Clamped offsets
    setPupilOffset({
      x: Math.max(-1, Math.min(1, relX)),
      y: Math.max(-1, Math.min(1, relY)),
    });

    // Subtle head tilt toward pointer
    setHeadTilt(relX * 6);
  };

  // Trigger floating particle
  const spawnParticle = (text: string, x?: number, y?: number, color?: string) => {
    const newId = Date.now() + Math.random();
    const spawnX = x !== undefined ? x : 40 + Math.random() * 20;
    const spawnY = y !== undefined ? y : 25 + Math.random() * 15;
    setParticles((prev) => [...prev, { id: newId, text, x: spawnX, y: spawnY, color }]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newId));
    }, 1100);
  };

  // Bat paw at feather / toy
  const triggerPawBat = () => {
    setIsBattingPaw(true);
    catAudio.playMeow('happy');
    spawnParticle('🐾 撲抓！', 50, 30, '#ff8a3d');
    setDialogue('抓到啦！秒喵的身手可是很敏捷的喵～✨');
    onIntimacyGain?.(3);

    setTimeout(() => {
      setIsBattingPaw(false);
    }, 450);
  };

  // Petting start (hover / pointerdown)
  const handlePetStart = (e: React.PointerEvent) => {
    if (activeTool === 'teaser') {
      triggerPawBat();
      return;
    }
    if (activeTool === 'treat') {
      handleFeedTreat();
      return;
    }

    setIsPetting(true);
    catAudio.startPurr();

    // Spawn hearts & affection
    spawnParticle('❤️ 呼嚕嚕~', 45 + (Math.random() - 0.5) * 20, 20);
    onIntimacyGain?.(1);

    if (currentPose === 'sleeping') {
      setDialogue('呼嚕呼嚕... 主人的摸摸好溫柔... 繼續睡覺覺 zZ');
    } else {
      const petQuotes = [
        '呼嚕呼嚕～ 最喜歡在椅子上給主人摸頭了🐾',
        '好舒服喵～（瞇眼搖尾巴）🥰',
        '下巴也癢癢，主人順便抓抓好嗎～',
        '有秒喵守護，專注度 +100% 喵！✨',
      ];
      setDialogue(petQuotes[Math.floor(Math.random() * petQuotes.length)]);
    }

    // Set interval for continuous purring gain while holding
    if (petTimerRef.current) clearInterval(petTimerRef.current);
    petTimerRef.current = setInterval(() => {
      onIntimacyGain?.(1);
      spawnParticle('✨ +1 親密', 50 + (Math.random() - 0.5) * 25, 25, '#ff8a3d');
    }, 1800);
  };

  // Petting end
  const handlePetEnd = () => {
    if (isPetting) {
      setIsPetting(false);
      catAudio.stopPurr();
      catAudio.playMeow('gentle');
      if (petTimerRef.current) {
        clearInterval(petTimerRef.current);
        petTimerRef.current = null;
      }
    }
  };

  // Feed treat
  const handleFeedTreat = () => {
    if (isEating) return;
    setIsEating(true);
    catAudio.playMunch();
    spawnParticle('🐟 嚼嚼嚼~', 50, 40, '#106c47');
    spawnParticle('飽食度 +15', 50, 15, '#ff8a3d');
    setDialogue('太好吃了喵！脆脆香香的小魚乾最讚了～🥫💖');
    onFeed?.(15);
    onIntimacyGain?.(5);

    setTimeout(() => {
      setIsEating(false);
      catAudio.playMeow('happy');
    }, 1400);
  };

  // Ring collar bell
  const handleRingBell = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBellRinging(true);
    catAudio.playBell();
    spawnParticle('🔔 叮鈴～', 50, 45, '#ffd166');
    setDialogue('叮鈴鈴～ 秒喵的小金鈴鐺最響亮啦！');
    setTimeout(() => setIsBellRinging(false), 500);
  };

  // Scratch ear / head
  const handleTouchEar = (e: React.MouseEvent) => {
    e.stopPropagation();
    catAudio.playMeow('curious');
    spawnParticle('👂 抖抖耳朵', 35, 15);
    setDialogue('耳朵抖一抖～ 聽到主人靈感的聲音了喵！🐾');
  };

  // Sound toggle
  const toggleSound = () => {
    const newState = catAudio.toggleSound();
    setSoundOn(newState);
  };

  // Size styling
  const sizeClasses = {
    sm: 'w-48 h-48',
    md: 'w-64 h-64',
    lg: 'w-72 h-72',
    hero: 'w-80 h-80 sm:w-96 sm:h-96',
  }[size];

  return (
    <div
      className={`relative flex flex-col items-center select-none ${className}`}
      onPointerLeave={handlePetEnd}
    >
      {/* Speech Bubble */}
      <div className="relative mb-2.5 px-4 py-1.5 rounded-2xl bg-white shadow-[0_4px_16px_rgba(44,48,46,0.08)] border border-[#ecefeb] flex items-center gap-2 max-w-[95%] text-center transition-all duration-300">
        <span className="text-[#ff8a3d] text-[15px] shrink-0">💬</span>
        <span className="text-[12px] text-[#181c1b] font-medium leading-tight">
          {dialogue}
        </span>
        {/* Pointer tip */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-[#ecefeb] rotate-45" />
      </div>

      {/* Main Interactive Stage Container */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePetStart}
        onPointerUp={handlePetEnd}
        className={`relative ${sizeClasses} rounded-3xl bg-gradient-to-b from-[#ffdbc9]/20 via-[#ffdea9]/15 to-[#f1f4f1] border border-[#ecefeb] shadow-[0_8px_24px_-4px_rgba(154,70,0,0.1)] flex items-center justify-center overflow-hidden cursor-${
          activeTool === 'teaser' ? 'crosshair' : activeTool === 'treat' ? 'cell' : 'grab'
        } active:cursor-grabbing`}
      >
        {/* Cozy room ambient background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,222,169,0.35)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute top-2 left-3 text-[10px] text-[#8a7266] flex items-center gap-1 font-medium z-10 pointer-events-none">
          <span>🪑 椅子上的黑貓 · 秒喵</span>
          {isPetting && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#ffdbc9] text-[#9a4600] font-bold text-[9px] animate-pulse">
              撫摸中 🥰
            </span>
          )}
        </div>

        {/* Sound toggle button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSound();
          }}
          className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow-xs border border-[#ecefeb] flex items-center justify-center text-[#564338] transition-all cursor-pointer"
          title={soundOn ? '點擊關閉音效' : '點擊開啟音效'}
        >
          <span className="material-symbols-outlined text-[15px]">
            {soundOn ? 'volume_up' : 'volume_off'}
          </span>
        </button>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none z-30">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute font-bold text-[12px] animate-fade-up whitespace-nowrap drop-shadow-xs"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                color: p.color || '#9a4600',
                transition: 'all 0.8s ease-out',
              }}
            >
              {p.text}
            </div>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* SVG ILLUSTRATED CHAIR & BLACK CAT ANIMATION RIG                           */}
        {/* ========================================================================= */}
        <svg
          viewBox="0 0 320 320"
          className="w-full h-full object-contain filter drop-shadow-[0_6px_12px_rgba(44,48,46,0.12)]"
        >
          <defs>
            {/* Soft fur gradients for illustrated black cat */}
            <radialGradient id="blackCatBody" cx="45%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#373c44" />
              <stop offset="60%" stopColor="#22252a" />
              <stop offset="100%" stopColor="#15171a" />
            </radialGradient>

            <radialGradient id="blackCatHead" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#3d434c" />
              <stop offset="70%" stopColor="#25292f" />
              <stop offset="100%" stopColor="#17191c" />
            </radialGradient>

            {/* Glowing Amber Eyes */}
            <radialGradient id="catEyeAmber" cx="40%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#ffe66d" />
              <stop offset="60%" stopColor="#ffb703" />
              <stop offset="100%" stopColor="#fb8500" />
            </radialGradient>

            {/* Wooden Chair Gradient */}
            <linearGradient id="chairWood" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a3704c" />
              <stop offset="50%" stopColor="#875330" />
              <stop offset="100%" stopColor="#63391b" />
            </linearGradient>

            {/* Cushion Gradient */}
            <linearGradient id="cushionGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d4edd9" />
              <stop offset="70%" stopColor="#b6e0c0" />
              <stop offset="100%" stopColor="#94c8a2" />
            </linearGradient>

            {/* Gold Bell Gradient */}
            <radialGradient id="goldBell" cx="35%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#fff3b0" />
              <stop offset="50%" stopColor="#ffd166" />
              <stop offset="100%" stopColor="#e09f3e" />
            </radialGradient>

            {/* Floor Shadow */}
            <radialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(44,48,46,0.25)" />
              <stop offset="100%" stopColor="rgba(44,48,46,0)" />
            </radialGradient>
          </defs>

          {/* 1. FLOOR SHADOW */}
          <ellipse cx="160" cy="285" rx="105" ry="18" fill="url(#floorShadow)" />

          {/* 2. WOODEN CHAIR (VINTAGE ARMCHAIR / CHAIR) */}
          <g id="wooden-chair">
            {/* Chair Backrest Slats */}
            <rect x="110" y="70" width="8" height="90" rx="4" fill="url(#chairWood)" />
            <rect x="135" y="60" width="8" height="100" rx="4" fill="url(#chairWood)" />
            <rect x="160" y="55" width="8" height="105" rx="4" fill="url(#chairWood)" />
            <rect x="185" y="60" width="8" height="100" rx="4" fill="url(#chairWood)" />
            <rect x="210" y="70" width="8" height="90" rx="4" fill="url(#chairWood)" />

            {/* Curved Top Rail of Chair */}
            <path
              d="M 90 85 C 130 50, 190 50, 230 85 C 220 95, 100 95, 90 85 Z"
              fill="url(#chairWood)"
            />

            {/* Chair Back Uprights */}
            <rect x="90" y="80" width="12" height="110" rx="4" fill="url(#chairWood)" />
            <rect x="220" y="80" width="12" height="110" rx="4" fill="url(#chairWood)" />

            {/* Chair Armrests */}
            <path
              d="M 75 160 C 85 145, 115 150, 118 165 C 118 175, 75 175, 75 160 Z"
              fill="url(#chairWood)"
            />
            <path
              d="M 245 160 C 235 145, 205 150, 202 165 C 202 175, 245 175, 245 160 Z"
              fill="url(#chairWood)"
            />

            {/* Soft Chair Cushion (Mint / Sage Green with piping) */}
            <ellipse cx="160" cy="205" rx="78" ry="32" fill="#8cb998" />
            <ellipse cx="160" cy="200" rx="76" ry="28" fill="url(#cushionGrad)" />
            {/* Cushion button tufts */}
            <circle cx="130" cy="200" r="3" fill="#6d9d7b" opacity="0.6" />
            <circle cx="160" cy="205" r="3" fill="#6d9d7b" opacity="0.6" />
            <circle cx="190" cy="200" r="3" fill="#6d9d7b" opacity="0.6" />

            {/* Chair Front Legs */}
            <rect x="98" y="210" width="12" height="72" rx="4" fill="url(#chairWood)" />
            <rect x="212" y="210" width="12" height="72" rx="4" fill="url(#chairWood)" />
            {/* Chair Rear Legs (darker) */}
            <rect x="115" y="200" width="9" height="65" rx="3" fill="#542e14" opacity="0.8" />
            <rect x="198" y="200" width="9" height="65" rx="3" fill="#542e14" opacity="0.8" />

            {/* Front Stretch Bar */}
            <rect x="100" y="250" width="124" height="6" rx="2" fill="url(#chairWood)" />
          </g>

          {/* ========================================================================= */}
          {/* 3. BLACK CAT "秒喵" (MIAOMIAO)                                            */}
          {/* ========================================================================= */}
          {currentPose === 'sitting' && (
            <g
              id="black-cat-sitting"
              className="transition-transform duration-300"
              style={{
                transform: `rotate(${headTilt * 0.15}deg)`,
                transformOrigin: '160px 210px',
              }}
            >
              {/* SWISHING TAIL */}
              <path
                d="M 205 210 C 235 215, 265 190, 245 155 C 235 140, 220 155, 230 170 C 240 185, 220 205, 195 215 Z"
                fill="url(#blackCatBody)"
                className="animate-tail origin-[205px_210px]"
                style={{
                  animation: isPetting
                    ? 'tailWagFast 0.6s ease-in-out infinite alternate'
                    : 'tailWag 3.2s ease-in-out infinite alternate',
                }}
              />

              {/* CAT BODY (Breathing rhythm) */}
              <g
                style={{
                  animation: 'catBreathing 3.6s ease-in-out infinite',
                  transformOrigin: '160px 210px',
                }}
              >
                {/* Back legs & haunches */}
                <ellipse cx="128" cy="205" rx="24" ry="18" fill="#1b1d22" />
                <ellipse cx="192" cy="205" rx="24" ry="18" fill="#1b1d22" />

                {/* Torso */}
                <path
                  d="M 132 155 C 122 175, 120 215, 160 215 C 200 215, 198 175, 188 155 C 180 142, 140 142, 132 155 Z"
                  fill="url(#blackCatBody)"
                />

                {/* Front White Paws / Mittens resting neatly on cushion */}
                <ellipse cx="146" cy="216" rx="10" ry="6" fill="#f8faf9" />
                <ellipse cx="174" cy="216" rx="10" ry="6" fill="#f8faf9" />
                {/* Toe dividers */}
                <line x1="144" y1="214" x2="144" y2="219" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="148" y1="214" x2="148" y2="219" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="172" y1="214" x2="172" y2="219" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="176" y1="214" x2="176" y2="219" stroke="#cbd5e1" strokeWidth="1" />
              </g>

              {/* BAT PLAYFUL PAW (If teasing or clicked) */}
              {isBattingPaw && (
                <g className="animate-paw-bat origin-[180px_180px]">
                  <path
                    d="M 175 175 C 190 160, 215 130, 220 125 C 228 120, 235 130, 225 138 C 210 152, 185 185, 175 185 Z"
                    fill="url(#blackCatBody)"
                  />
                  {/* Paw pad */}
                  <ellipse cx="225" cy="126" rx="7" ry="6" fill="#f8faf9" />
                  <circle cx="225" cy="127" r="3.5" fill="#ffb4a2" />
                  <circle cx="221" cy="122" r="1.5" fill="#ffb4a2" />
                  <circle cx="225" cy="121" r="1.5" fill="#ffb4a2" />
                  <circle cx="229" cy="122" r="1.5" fill="#ffb4a2" />
                </g>
              )}

              {/* CAT HEAD & EARS (Interactive Tilt & Touch) */}
              <g
                style={{
                  transform: `translate(${headTilt * 0.5}px, ${headTilt * 0.15}px) rotate(${headTilt}deg)`,
                  transformOrigin: '160px 140px',
                  transition: 'transform 0.15s ease-out',
                }}
              >
                {/* Left Ear */}
                <g onClick={handleTouchEar} className="cursor-pointer">
                  <polygon
                    points="126,128 114,84 148,105"
                    fill="url(#blackCatHead)"
                    className={isPetting ? 'animate-pulse' : ''}
                  />
                  <polygon points="127,122 120,93 144,107" fill="#ffb4a2" opacity="0.85" />
                  <path d="M 125 105 Q 132 108 128 118" stroke="#f8faf9" strokeWidth="1.2" />
                </g>

                {/* Right Ear */}
                <g onClick={handleTouchEar} className="cursor-pointer">
                  <polygon
                    points="194,128 206,84 172,105"
                    fill="url(#blackCatHead)"
                    className={isPetting ? 'animate-pulse' : ''}
                  />
                  <polygon points="193,122 200,93 176,107" fill="#ffb4a2" opacity="0.85" />
                  <path d="M 195 105 Q 188 108 192 118" stroke="#f8faf9" strokeWidth="1.2" />
                </g>

                {/* Head Silhouette */}
                <ellipse cx="160" cy="132" rx="38" ry="32" fill="url(#blackCatHead)" />
                {/* Cheeks fluff */}
                <ellipse cx="132" cy="140" rx="14" ry="12" fill="url(#blackCatHead)" />
                <ellipse cx="188" cy="140" rx="14" ry="12" fill="url(#blackCatHead)" />

                {/* Blush on cheeks when petted */}
                {isPetting && (
                  <>
                    <ellipse cx="136" cy="142" rx="7" ry="4" fill="#ff8a8a" opacity="0.65" />
                    <ellipse cx="184" cy="142" rx="7" ry="4" fill="#ff8a8a" opacity="0.65" />
                  </>
                )}

                {/* EYES */}
                {!isPetting && !isBlinking ? (
                  <>
                    {/* Left Eye */}
                    <ellipse cx="144" cy="130" rx="11" ry="13" fill="url(#catEyeAmber)" />
                    {/* Left Pupil (Tracks cursor!) */}
                    <ellipse
                      cx={144 + pupilOffset.x * 4.5}
                      cy={130 + pupilOffset.y * 3.5}
                      rx="4"
                      ry="9"
                      fill="#121316"
                    />
                    {/* Left Eye Sparkle / Catchlight */}
                    <circle cx="142" cy="126" r="2.5" fill="#ffffff" />
                    <circle cx="146" cy="133" r="1.2" fill="#ffffff" opacity="0.8" />

                    {/* Right Eye */}
                    <ellipse cx="176" cy="130" rx="11" ry="13" fill="url(#catEyeAmber)" />
                    {/* Right Pupil (Tracks cursor!) */}
                    <ellipse
                      cx={176 + pupilOffset.x * 4.5}
                      cy={130 + pupilOffset.y * 3.5}
                      rx="4"
                      ry="9"
                      fill="#121316"
                    />
                    {/* Right Eye Sparkle */}
                    <circle cx="174" cy="126" r="2.5" fill="#ffffff" />
                    <circle cx="178" cy="133" r="1.2" fill="#ffffff" opacity="0.8" />
                  </>
                ) : (
                  /* Happy Squint / Blinking Eyes (^ ﻌ ^) */
                  <>
                    <path
                      d="M 134 132 Q 144 122 154 132"
                      fill="none"
                      stroke="#ffd166"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 166 132 Q 176 122 186 132"
                      fill="none"
                      stroke="#ffd166"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </>
                )}

                {/* Cute Pink Nose */}
                <polygon points="157,141 163,141 160,145" fill="#ffb4a2" />

                {/* Mouth Line */}
                <path
                  d="M 160 145 Q 155 151 150 149 M 160 145 Q 165 151 170 149"
                  fill="none"
                  stroke="#475569"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />

                {/* Delicate White Whiskers */}
                <g opacity="0.85">
                  {/* Left Whiskers */}
                  <line
                    x1="140"
                    y1="144"
                    x2="105"
                    y2="138"
                    stroke="#f8faf9"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="138"
                    y1="148"
                    x2="102"
                    y2="150"
                    stroke="#f8faf9"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="140"
                    y1="152"
                    x2="108"
                    y2="160"
                    stroke="#f8faf9"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />

                  {/* Right Whiskers */}
                  <line
                    x1="180"
                    y1="144"
                    x2="215"
                    y2="138"
                    stroke="#f8faf9"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="182"
                    y1="148"
                    x2="218"
                    y2="150"
                    stroke="#f8faf9"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="180"
                    y1="152"
                    x2="212"
                    y2="160"
                    stroke="#f8faf9"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </g>

                {/* Red Collar with Golden Bell */}
                <path
                  d="M 136 157 Q 160 168 184 157"
                  fill="none"
                  stroke="#e63946"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {/* Bell (Interactive click) */}
                <g
                  onClick={handleRingBell}
                  className="cursor-pointer transition-transform duration-200"
                  style={{
                    transform: isBellRinging ? 'scale(1.3) rotate(15deg)' : 'scale(1)',
                    transformOrigin: '160px 166px',
                  }}
                >
                  <circle cx="160" cy="166" r="6.5" fill="url(#goldBell)" />
                  <circle cx="160" cy="168" r="1.8" fill="#784400" />
                  <line x1="157" y1="165" x2="163" y2="165" stroke="#784400" strokeWidth="0.8" />
                </g>
              </g>
            </g>
          )}

          {/* ========================================================================= */}
          {/* 4. SLEEPING POSE (CUSHION SNOOZE)                                         */}
          {/* ========================================================================= */}
          {currentPose === 'sleeping' && (
            <g
              id="black-cat-sleeping"
              style={{
                animation: 'catBreathing 4s ease-in-out infinite',
                transformOrigin: '160px 200px',
              }}
            >
              {/* Curled Sleeping Cat Body on Cushion */}
              <ellipse cx="160" cy="195" rx="55" ry="32" fill="url(#blackCatBody)" />

              {/* Curled Tail Wrapping Body */}
              <path
                d="M 215 195 C 225 210, 185 224, 135 218 C 115 216, 110 205, 118 198"
                fill="none"
                stroke="url(#blackCatBody)"
                strokeWidth="14"
                strokeLinecap="round"
              />

              {/* Tucked Head */}
              <circle cx="132" cy="186" r="24" fill="url(#blackCatHead)" />
              {/* Left ear flat */}
              <polygon points="112,175 120,162 132,170" fill="url(#blackCatHead)" />
              <polygon points="115,173 121,165 130,171" fill="#ffb4a2" />

              {/* Sleeping happy eye lines (u u) */}
              <path
                d="M 124 188 Q 130 194 136 188"
                fill="none"
                stroke="#ffd166"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Cute nose */}
              <polygon points="138,193 142,193 140,196" fill="#ffb4a2" />

              {/* Tucked paws */}
              <ellipse cx="145" cy="204" rx="8" ry="6" fill="#f8faf9" />

              {/* Collar & Bell */}
              <path
                d="M 120 196 Q 132 205 142 198"
                fill="none"
                stroke="#e63946"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="134" cy="204" r="4.5" fill="url(#goldBell)" />

              {/* Floating Animated Zzz */}
              <g className="animate-bounce origin-[110px_150px]">
                <text x="100" y="160" fill="#9a4600" fontSize="16" fontWeight="bold">
                  Z
                </text>
                <text x="92" y="146" fill="#9a4600" fontSize="12" fontWeight="bold" opacity="0.8">
                  z
                </text>
                <text x="86" y="136" fill="#9a4600" fontSize="9" fontWeight="bold" opacity="0.6">
                  z
                </text>
              </g>
            </g>
          )}

          {/* ========================================================================= */}
          {/* 5. STRETCHING POSE (PLAYFUL ARCH & YAWN)                                  */}
          {/* ========================================================================= */}
          {currentPose === 'stretching' && (
            <g id="black-cat-stretching">
              {/* Tail sticking straight up with curl */}
              <path
                d="M 215 160 C 225 125, 235 95, 215 80 C 205 72, 195 85, 205 98 C 215 110, 208 140, 205 165 Z"
                fill="url(#blackCatBody)"
              />

              {/* Arched rear body */}
              <ellipse cx="195" cy="170" rx="30" ry="24" fill="url(#blackCatBody)" />
              {/* Back paws rooted */}
              <ellipse cx="205" cy="206" rx="10" ry="8" fill="#f8faf9" />

              {/* Stretched down spine */}
              <path
                d="M 195 155 Q 165 185 130 195 L 120 215 L 180 205 Z"
                fill="url(#blackCatBody)"
              />

              {/* Front paws stretched far forward */}
              <ellipse cx="110" cy="216" rx="14" ry="6" fill="#f8faf9" />
              <ellipse cx="125" cy="216" rx="14" ry="6" fill="#f8faf9" />

              {/* Head low to ground stretching */}
              <circle cx="136" cy="190" r="22" fill="url(#blackCatHead)" />
              <polygon points="120,180 126,165 138,175" fill="url(#blackCatHead)" />
              <polygon points="144,175 152,165 158,180" fill="url(#blackCatHead)" />

              {/* Yawning mouth / Closed happy eyes */}
              <ellipse cx="132" cy="194" rx="5" ry="6" fill="#ff8a8a" />
              <path
                d="M 126 186 Q 130 182 134 186 M 138 186 Q 142 182 146 186"
                fill="none"
                stroke="#ffd166"
                strokeWidth="2"
              />

              {/* Bell */}
              <circle cx="145" cy="200" r="5" fill="url(#goldBell)" />
            </g>
          )}

          {/* ========================================================================= */}
          {/* 6. INTERACTIVE TOYS OVERLAY (TEASER WAND OR FISH TREAT)                   */}
          {/* ========================================================================= */}
          {activeTool === 'teaser' && (
            <g
              id="teaser-wand-visual"
              style={{
                transform: `translate(${wandPos.x - 40}px, ${wandPos.y - 40}px)`,
                pointerEvents: 'none',
              }}
            >
              {/* Wand Stick */}
              <line x1="50" y1="50" x2="10" y2="10" stroke="#b45309" strokeWidth="3" />
              {/* Elastic String */}
              <path d="M 50 50 Q 55 60 52 70" fill="none" stroke="#cbd5e1" strokeWidth="1" />
              {/* Fluffy Feathers */}
              <path d="M 52 70 C 65 65, 75 75, 60 85 Z" fill="#ff8a3d" />
              <path d="M 52 70 C 40 75, 45 88, 56 88 Z" fill="#ffb703" />
              <path d="M 52 70 C 55 85, 65 92, 52 95 Z" fill="#e63946" />
              <circle cx="52" cy="70" r="3" fill="#ffd166" />
            </g>
          )}

          {/* Snack Saucer when feeding */}
          {isEating && (
            <g
              id="snack-saucer"
              className="animate-bounce"
              style={{ transformOrigin: '160px 225px' }}
            >
              <ellipse cx="160" cy="225" rx="20" ry="8" fill="#ffffff" stroke="#ecefeb" />
              {/* Gold Dried Fish */}
              <path
                d="M 152 225 C 156 221, 166 221, 170 225 C 166 229, 156 229, 152 225 Z"
                fill="#ffb703"
              />
              <polygon points="152,225 147,222 147,228" fill="#ffb703" />
              <circle cx="166" cy="224" r="1" fill="#784400" />
            </g>
          )}
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE CONTROLS TOOLBAR (撫摸 / 逗貓棒 / 餵食 & 姿勢切換)             */}
      {/* ========================================================================= */}
      {showControls && (
        <div className="flex flex-col items-center gap-2.5 mt-3 w-full max-w-sm px-2">
          {/* Action Tools Row */}
          <div className="flex items-center justify-center gap-1.5 p-1 bg-white rounded-2xl border border-[#ecefeb] shadow-xs w-full">
            <button
              onClick={() => {
                setActiveTool('pet');
                catAudio.playMeow('gentle');
                setDialogue('點擊或拖曳秒喵，可以摸頭和撓下巴喔～🐾');
              }}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                activeTool === 'pet'
                  ? 'bg-[#ffdea9] text-[#7d5800] shadow-xs'
                  : 'text-[#564338] hover:bg-[#f1f4f1]'
              }`}
            >
              <span>✋</span>
              <span>撫摸擼貓</span>
            </button>

            <button
              onClick={() => {
                setActiveTool('teaser');
                setCurrentPose('sitting');
                catAudio.playMeow('happy');
                setDialogue('晃動逗貓棒，秒喵的眼睛和爪子會跟著抓撲喔！🪶');
              }}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                activeTool === 'teaser'
                  ? 'bg-[#ffdbc9] text-[#9a4600] shadow-xs'
                  : 'text-[#564338] hover:bg-[#f1f4f1]'
              }`}
            >
              <span>🪶</span>
              <span>逗貓棒</span>
            </button>

            <button
              onClick={() => {
                setActiveTool('treat');
                handleFeedTreat();
              }}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                activeTool === 'treat'
                  ? 'bg-[#a1f4c5] text-[#00482d] shadow-xs'
                  : 'text-[#564338] hover:bg-[#f1f4f1]'
              }`}
            >
              <span>🐟</span>
              <span>餵小魚乾</span>
            </button>
          </div>

          {/* Pose Selector Row */}
          <div className="flex items-center justify-between w-full text-[11px] text-[#564338] px-1">
            <span className="font-medium">椅子狀態：</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setCurrentPose('sitting');
                  catAudio.playMeow('gentle');
                  setDialogue('端端正正坐在椅子上，認真守護你的目標喵！🪑');
                }}
                className={`px-2 py-0.8 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  currentPose === 'sitting'
                    ? 'bg-[#181c1b] text-white shadow-xs'
                    : 'bg-[#f1f4f1] text-[#564338] hover:bg-[#ecefeb]'
                }`}
              >
                🪑 端坐
              </button>

              <button
                onClick={() => {
                  setCurrentPose('sleeping');
                  catAudio.playPurr();
                  setDialogue('在軟綿綿的坐墊上打瞌睡... 呼嚕嚕 zZ');
                }}
                className={`px-2 py-0.8 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  currentPose === 'sleeping'
                    ? 'bg-[#181c1b] text-white shadow-xs'
                    : 'bg-[#f1f4f1] text-[#564338] hover:bg-[#ecefeb]'
                }`}
              >
                💤 酣睡
              </button>

              <button
                onClick={() => {
                  setCurrentPose('stretching');
                  catAudio.playMeow('curious');
                  setDialogue('工作一段落，跟秒喵一起伸個大懶腰吧喵！🐾');
                }}
                className={`px-2 py-0.8 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  currentPose === 'stretching'
                    ? 'bg-[#181c1b] text-white shadow-xs'
                    : 'bg-[#f1f4f1] text-[#564338] hover:bg-[#ecefeb]'
                }`}
              >
                🐾 伸展
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS keyframes for organic cat animations */}
      <style>{`
        @keyframes tailWag {
          0% { transform: rotate(-6deg); }
          100% { transform: rotate(12deg); }
        }
        @keyframes tailWagFast {
          0% { transform: rotate(-15deg); }
          100% { transform: rotate(22deg); }
        }
        @keyframes catBreathing {
          0% { transform: scaleY(1); }
          50% { transform: scaleY(1.022); }
          100% { transform: scaleY(1); }
        }
        @keyframes pawBat {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(-25deg) translateY(-8px); }
          100% { transform: rotate(0deg); }
        }
        .animate-paw-bat {
          animation: pawBat 0.4s ease-out;
        }
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(6px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(-16px); }
          100% { opacity: 0; transform: translateY(-28px); }
        }
        .animate-fade-up {
          animation: fadeUp 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
