import React, { useEffect, useRef, useState } from 'react';
import { ASSETS } from '../data/initialData';
import { Pet, ScheduleItem } from '../types';
import { InteractiveCatOnChair } from './InteractiveCatOnChair';

interface PomodoroTimerProps {
  pet: Pet;
  targetTask?: ScheduleItem | null;
  onFinishPomodoro: (rewardFish: number, rewardIntimacy: number) => void;
  onSwitchTask?: () => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  pet,
  targetTask,
  onFinishPomodoro,
  onSwitchTask,
}) => {
  const [mode, setMode] = useState<25 | 50 | 15>(25);
  const [timeLeft, setTimeLeft] = useState<number>(18 * 60 + 39); // default 18:39
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [completedTomatoes, setCompletedTomatoes] = useState<number>(2);
  const [selectedNoise, setSelectedNoise] = useState<
    'purr' | 'rain' | 'cafe' | 'fire' | 'none'
  >('purr');
  const [volume, setVolume] = useState<number>(60);
  const [finishToast, setFinishToast] = useState<string | null>(null);

  // Web Audio Context for real soothing sound synthesis (purr, rain, cafe ambient)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Mode change
  const handleModeChange = (newMode: 25 | 50 | 15) => {
    setMode(newMode);
    setTimeLeft(newMode * 60);
    setIsRunning(true);
  };

  // Timer interval
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Audio synthesis for white noise
  useEffect(() => {
    if (selectedNoise === 'none' || !isRunning || volume === 0) {
      if (noiseNodeRef.current) {
        noiseNodeRef.current.disconnect();
        noiseNodeRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Generate brown/pink noise
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise simulation for gentle purr/rain
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 2.5;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Filter depending on noise type
      const filter = ctx.createBiquadFilter();
      if (selectedNoise === 'purr') {
        filter.type = 'lowpass';
        filter.frequency.value = 180; // deep cozy cat purr rumble
      } else if (selectedNoise === 'rain') {
        filter.type = 'bandpass';
        filter.frequency.value = 800; // gentle rain
      } else if (selectedNoise === 'cafe') {
        filter.type = 'lowpass';
        filter.frequency.value = 450; // cozy muffled cafe
      } else {
        filter.type = 'lowpass';
        filter.frequency.value = 300; // warm fire crackle
      }

      const gain = ctx.createGain();
      gain.gain.value = (volume / 100) * 0.12;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();

      noiseNodeRef.current = noise;

      return () => {
        try {
          noise.stop();
          noise.disconnect();
        } catch {
          // ignore
        }
      };
    } catch {
      // Audio not permitted or user interaction required
    }
  }, [selectedNoise, isRunning, volume]);

  const handleFinish = () => {
    setCompletedTomatoes((c) => Math.min(4, c + 1));
    onFinishPomodoro(3, 25);
    setFinishToast('🎉 番茄鐘專注完成！阿吉獲得小魚乾 ×3 與好感度 +25！');
    setTimeout(() => setFinishToast(null), 3500);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalSeconds = mode * 60;
  const progressRatio = (totalSeconds - timeLeft) / totalSeconds;
  const circumference = 2 * Math.PI * 112; // r=112
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 pb-28 gap-4 pt-3 relative">
      {/* Top Status & Target Project Sticky Bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-2xl shadow-xs border border-[#ecefeb]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[#9a4600] text-[16px] shrink-0">✦</span>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-[#564338] font-medium">當前專注任務</span>
              <span className="text-[13px] text-[#181c1b] font-bold truncate">
                {targetTask?.title || '品牌網站改版 2024 / Hero 設計驗收'}
              </span>
            </div>
          </div>
          {onSwitchTask && (
            <button
              onClick={onSwitchTask}
              className="flex items-center gap-1 bg-[#f1f4f1] px-2.5 py-1 rounded-lg text-[#564338] hover:bg-[#ecefeb] transition-colors text-[11px] font-semibold shrink-0 cursor-pointer"
            >
              <span>切換</span>
              <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
            </button>
          )}
        </div>

        {/* Mode Badge */}
        <div className="flex items-center justify-between px-1">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ffdea9]/50 text-[#5e4100] border border-[#ffba27]/30 text-[11px] font-bold">
            <span
              className="material-symbols-outlined text-[13px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bedtime
            </span>
            <span>沉浸專注中 · 勿擾模式已開啟</span>
          </div>
          <div className="flex items-center gap-1 text-[#564338] text-[11px] font-medium">
            <span>今日第</span>
            <span className="font-bold text-[#9a4600]">
              {completedTomatoes + 1}
            </span>
            <span>/ 4 顆番茄</span>
          </div>
        </div>
      </div>

      {/* Central Pet Habitat & Circular Pomodoro Clock */}
      <div className="relative flex flex-col items-center justify-center py-2">
        {/* Ambient Radial Breathing Halo */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#ffdea9]/45 via-[#ffdbc9]/40 to-[#a1f4c5]/35 blur-2xl opacity-75 animate-pulse" />

          {/* Circular Timer SVG Gauge */}
          <svg className="w-64 h-64 -rotate-90 transform relative z-10" viewBox="0 0 256 256">
            {/* Track */}
            <circle
              className="text-[#e6e9e6]"
              cx="128"
              cy="128"
              fill="none"
              r="112"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="7"
            />
            {/* Progress */}
            <circle
              className="text-[#ff8a3d] transition-all duration-1000"
              cx="128"
              cy="128"
              fill="none"
              r="112"
              stroke="currentColor"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              strokeWidth="7"
            />
          </svg>

          {/* Center Pet Interactive Companion Card Inside Gauge */}
          <div className="absolute w-48 h-48 rounded-full overflow-hidden shadow-[0_8px_24px_rgba(184,134,11,0.14)] z-20 flex items-center justify-center bg-gradient-to-b from-[#fffbf4] to-[#f4f1ea] ring-4 ring-white">
            <InteractiveCatOnChair
              mode={isRunning ? 'sleeping' : 'sitting'}
              size="sm"
              showControls={false}
              inPomodoro={true}
              className="w-full h-full"
            />
          </div>

          {/* Badge at bottom of ring */}
          <div className="absolute -bottom-1 z-20 bg-white px-3 py-1 rounded-full shadow-md flex items-center gap-1 border border-[#ecefeb]">
            <span
              className="material-symbols-outlined text-[15px] text-[#9a4600]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              pets
            </span>
            <span className="text-[11px] font-bold text-[#181c1b]">阿吉深睡中</span>
          </div>
        </div>

        {/* Countdown Display & Interval Indicators */}
        <div className="flex flex-col items-center mt-3">
          <div className="font-display text-[44px] leading-none font-extrabold tracking-tight text-[#181c1b] flex items-center gap-1 drop-shadow-xs">
            <span>{minutes < 10 ? `0${minutes}` : minutes}</span>
            <span className={`text-[#ff8a3d] ${isRunning ? 'animate-pulse' : ''}`}>
              :
            </span>
            <span>{seconds < 10 ? `0${seconds}` : seconds}</span>
          </div>

          {/* Pomodoro Session Dots (4 Target) */}
          <div className="flex items-center gap-1.5 mt-2.5 bg-[#ecefeb] px-3 py-1 rounded-full border border-[#ddc1b3]/30">
            {Array.from({ length: 4 }).map((_, i) => {
              const isDone = i < completedTomatoes;
              const isCurrent = i === completedTomatoes;
              return (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    isDone
                      ? 'bg-[#106c47] text-white font-bold'
                      : isCurrent
                      ? 'bg-[#ff8a3d] text-white animate-pulse'
                      : 'bg-white text-[#8a7266]'
                  }`}
                >
                  {isDone ? (
                    <span className="material-symbols-outlined text-[12px]">check</span>
                  ) : isCurrent ? (
                    <span className="material-symbols-outlined text-[12px]">pets</span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8a7266]/40" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pet Sleep Reminder & Gamified Stakes Card */}
      <div className="flex flex-col bg-white p-3.5 rounded-2xl shadow-xs border border-[#ecefeb] relative overflow-hidden">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#ffdea9] flex items-center justify-center shrink-0 text-[#271900]">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-bold text-[#181c1b]">
              阿吉正在香甜熟睡中
            </span>
            <span className="text-[11px] text-[#564338] leading-relaxed">
              你的每一次專注都是給牠最好的安穩夢境。若中途切出或放棄，阿吉會被突然驚醒喵喵叫喔！
            </span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 flex items-center justify-between bg-[#f1f4f1] px-3 py-1.5 rounded-xl border border-[#ecefeb]">
          <span className="text-[11px] text-[#564338] font-medium">本次完注獎勵：</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#9a4600] flex items-center gap-0.5">
              🐟 酥脆小魚乾 × 3
            </span>
            <span className="text-[#8a7266] text-[10px]">・</span>
            <span className="text-[11px] font-bold text-[#106c47] flex items-center gap-0.5">
              💖 親密度 +25
            </span>
          </div>
        </div>
      </div>

      {/* Duration Mode Switcher */}
      <div className="flex flex-col gap-1">
        <span className="text-[11px] text-[#564338] font-semibold px-1">專注模式切換</span>
        <div className="grid grid-cols-3 gap-1.5 bg-[#f1f4f1] p-1 rounded-2xl border border-[#ecefeb]">
          {[
            { m: 25, label: '經典番茄' },
            { m: 50, label: '深度沉浸' },
            { m: 15, label: '快速衝刺' },
          ].map((item) => {
            const isSelected = mode === item.m;
            return (
              <button
                key={item.m}
                onClick={() => handleModeChange(item.m as any)}
                className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-[#181c1b] shadow-xs font-bold'
                    : 'text-[#564338] hover:text-[#181c1b]'
                }`}
              >
                <span
                  className={`text-[14px] font-bold ${
                    isSelected ? 'text-[#9a4600]' : ''
                  }`}
                >
                  {item.m} min
                </span>
                <span className="text-[10px] text-[#564338]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ambient Soundscapes (Cozy Ambient Sound Player) */}
      <div className="flex flex-col gap-2 bg-white p-3.5 rounded-2xl shadow-xs border border-[#ecefeb]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#9a4600] text-[18px]">
              headphones
            </span>
            <span className="text-[14px] font-bold text-[#181c1b]">專注白噪音</span>
          </div>
          {selectedNoise !== 'none' && isRunning && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffdbc9] text-[#763300] text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9a4600] animate-ping" />
              <span>播放中</span>
            </div>
          )}
        </div>

        {/* Ambient Chips */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          {[
            { id: 'purr', icon: '🐱', title: '貓咪呼嚕聲', sub: 'Purring' },
            { id: 'rain', icon: '🌧️', title: '窗外細雨', sub: 'Gentle Rain' },
            { id: 'cafe', icon: '☕', title: '木質咖啡館', sub: 'Cozy Cafe' },
            { id: 'fire', icon: '🔥', title: '溫暖壁爐', sub: 'Fireplace' },
          ].map((ch) => {
            const isChSelected = selectedNoise === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() =>
                  setSelectedNoise(isChSelected ? 'none' : (ch.id as any))
                }
                className={`flex items-center justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer border ${
                  isChSelected
                    ? 'bg-[#ffdbc9]/40 border-[#ff8a3d]/50 text-[#181c1b]'
                    : 'bg-[#f1f4f1] border-[#ecefeb] text-[#564338] hover:bg-[#ecefeb]'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[16px]">{ch.icon}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold truncate">{ch.title}</span>
                    <span className="text-[9px] text-[#8a7266]">{ch.sub}</span>
                  </div>
                </div>
                <span
                  className={`material-symbols-outlined text-[16px] ${
                    isChSelected ? 'text-[#9a4600]' : 'text-[#8a7266]'
                  }`}
                  style={{ fontVariationSettings: isChSelected ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {isChSelected ? 'volume_up' : 'volume_mute'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Volume Slider Well */}
        <div className="flex items-center gap-2 mt-1 pt-1">
          <span className="material-symbols-outlined text-[15px] text-[#8a7266]">
            volume_down
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(parseInt(e.target.value, 10))}
            className="flex-1 accent-[#9a4600] h-1.5 bg-[#ecefeb] rounded-full cursor-pointer"
          />
          <span className="material-symbols-outlined text-[15px] text-[#8a7266]">
            volume_up
          </span>
          <span className="text-[10px] text-[#564338] font-bold w-7 text-right">
            {volume}%
          </span>
        </div>
      </div>

      {/* Primary Action Controls */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsRunning((r) => !r)}
            className="h-12 flex items-center justify-center gap-1.5 bg-[#ecefeb] hover:bg-[#e0e3e0] text-[#181c1b] text-[13px] font-bold rounded-xl shadow-xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isRunning ? 'pause_circle' : 'play_circle'}
            </span>
            <span>{isRunning ? '暫停專注' : '繼續專注'}</span>
          </button>

          {/* Complete Session Early Button */}
          <button
            onClick={handleFinish}
            className="h-12 flex items-center justify-center gap-1.5 bg-[#ff8a3d] hover:bg-[#9a4600] text-white text-[13px] font-bold rounded-xl shadow-[0_4px_16px_-2px_rgba(184,134,11,0.25)] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              task_alt
            </span>
            <span>提前結算完成</span>
          </button>
        </div>

        {/* Warm Sticky Note Micro Banner */}
        <div className="flex items-center justify-center gap-1.5 bg-[#ffdea9]/30 px-3 py-1.5 rounded-xl text-[#5e4100] border border-[#ffba27]/25 text-[11px] font-medium">
          <span className="material-symbols-outlined text-[15px] text-[#7d5800]">
            sticky_note_2
          </span>
          <span>完成本階段可一鍵轉為專案筆記並餵食阿吉！</span>
        </div>
      </div>

      {/* Toast Notification */}
      {finishToast && (
        <div className="fixed top-20 inset-x-4 max-w-md mx-auto z-50 transition-all duration-300 transform">
          <div className="rounded-2xl bg-[#2d312f] text-white p-3.5 shadow-2xl flex items-center gap-2 border border-white/10">
            <span className="text-[22px]">✨</span>
            <span className="text-[12px] font-bold leading-tight">{finishToast}</span>
          </div>
        </div>
      )}
    </div>
  );
};
