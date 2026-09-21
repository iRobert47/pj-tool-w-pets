import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alignment,
  Fit,
  Layout,
  StateMachineInputType,
  useRive,
} from '@rive-app/react-canvas';
import { catAudio } from '../utils/catAudio';
import { InteractiveCatOnChair as LegacyInteractiveCatOnChair } from './LegacyInteractiveCatOnChair';

interface InteractiveCatOnChairProps {
  mode?: 'sitting' | 'sleeping' | 'stretching';
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showControls?: boolean;
  onIntimacyGain?: (amount: number) => void;
  onFeed?: (amount: number) => void;
  className?: string;
  inPomodoro?: boolean;
}

type InteractionMode = 'pet' | 'play' | 'treat';

const RIVE_SOURCE =
  'https://public.rive.app/community/runtime-files/23404-43796-interactive-cute-black-cat.riv';
const RIVE_MARKETPLACE_URL =
  'https://rive.app/marketplace/23404-43796-interactive-cute-black-cat/';
const STATE_MACHINE = 'State Machine 1';
const ARTBOARD = 'Artboard';

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const aliases: Record<string, string[]> = {
  pet: ['pet', 'touch', 'happy', 'love', 'stroke', 'pat'],
  play: ['play', 'toy', 'paw', 'bat', 'jump', 'tease', 'active'],
  treat: ['treat', 'feed', 'eat', 'food', 'snack'],
  sleep: ['sleep', 'rest', 'break'],
  focus: ['focus', 'work', 'working', 'pomodoro'],
  idle: ['idle', 'sit', 'sitting', 'default'],
  lookX: ['lookx', 'eyex', 'gazex', 'mousex', 'cursorx', 'x'],
  lookY: ['looky', 'eyey', 'gazey', 'mousey', 'cursory', 'y'],
};

const matchesAlias = (name: string, key: keyof typeof aliases) => {
  const candidate = normalize(name);
  return aliases[key].some((alias) => candidate.includes(alias));
};

export const InteractiveCatOnChair: React.FC<InteractiveCatOnChairProps> = ({
  mode = 'sitting',
  size = 'md',
  showControls = true,
  onIntimacyGain,
  onFeed,
  className = '',
  inPomodoro = false,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('pet');
  const [riveFailed, setRiveFailed] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [inputNames, setInputNames] = useState<string[]>([]);

  const { rive, RiveComponent } = useRive({
    src: RIVE_SOURCE,
    artboard: ARTBOARD,
    stateMachines: STATE_MACHINE,
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    onLoadError: () => setRiveFailed(true),
  });

  useEffect(() => {
    if (!rive) return;
    try {
      const inputs = rive.stateMachineInputs(STATE_MACHINE) ?? [];
      setInputNames(inputs.map((input) => input.name));
    } catch {
      setInputNames([]);
    }
  }, [rive]);

  const stateInputs = useMemo(() => {
    if (!rive) return [];
    try {
      return rive.stateMachineInputs(STATE_MACHINE) ?? [];
    } catch {
      return [];
    }
  }, [rive, inputNames]);

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 1100);
  };

  const fireMatchingTrigger = (key: keyof typeof aliases) => {
    const input = stateInputs.find(
      (candidate) =>
        candidate.type === StateMachineInputType.Trigger &&
        matchesAlias(candidate.name, key)
    );
    input?.fire();
    return Boolean(input);
  };

  const setMatchingBoolean = (key: keyof typeof aliases, value: boolean) => {
    let changed = false;
    stateInputs.forEach((input) => {
      if (
        input.type === StateMachineInputType.Boolean &&
        matchesAlias(input.name, key)
      ) {
        input.value = value;
        changed = true;
      }
    });
    return changed;
  };

  const setMatchingNumber = (key: keyof typeof aliases, value: number) => {
    const input = stateInputs.find(
      (candidate) =>
        candidate.type === StateMachineInputType.Number &&
        matchesAlias(candidate.name, key)
    );
    if (!input) return false;
    input.value = value;
    return true;
  };

  useEffect(() => {
    if (!rive) return;

    const wantsSleep = inPomodoro || mode === 'sleeping';
    const wantsFocus = inPomodoro;
    const wantsIdle = !wantsSleep && mode === 'sitting';

    setMatchingBoolean('sleep', wantsSleep);
    setMatchingBoolean('focus', wantsFocus);
    setMatchingBoolean('idle', wantsIdle);

    if (mode === 'stretching') {
      fireMatchingTrigger('play');
    }
  }, [rive, mode, inPomodoro, inputNames]);

  const updateLook = (clientX: number, clientY: number) => {
    if (!stageRef.current || !rive || inPomodoro || mode === 'sleeping') return;

    const rect = stageRef.current.getBoundingClientRect();
    const nx = Math.max(
      -1,
      Math.min(1, (clientX - (rect.left + rect.width / 2)) / (rect.width / 2))
    );
    const ny = Math.max(
      -1,
      Math.min(1, (clientY - (rect.top + rect.height / 2)) / (rect.height / 2))
    );

    setMatchingNumber('lookX', nx);
    setMatchingNumber('lookY', ny);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    updateLook(event.clientX, event.clientY);
  };

  const handleInteraction = () => {
    if (interactionMode === 'treat') {
      fireMatchingTrigger('treat');
      setMatchingBoolean('treat', true);
      window.setTimeout(() => setMatchingBoolean('treat', false), 500);
      catAudio.playMunch();
      onFeed?.(15);
      onIntimacyGain?.(4);
      showFeedback('吃得很滿足');
      return;
    }

    if (interactionMode === 'play') {
      fireMatchingTrigger('play');
      setMatchingBoolean('play', true);
      window.setTimeout(() => setMatchingBoolean('play', false), 500);
      catAudio.playMeow('happy');
      onIntimacyGain?.(3);
      showFeedback('抓到你了');
      return;
    }

    fireMatchingTrigger('pet');
    setMatchingBoolean('pet', true);
    window.setTimeout(() => setMatchingBoolean('pet', false), 450);
    catAudio.startPurr();
    window.setTimeout(() => catAudio.stopPurr(), 900);
    onIntimacyGain?.(1);
    showFeedback('呼嚕嚕');
  };

  if (riveFailed) {
    return (
      <LegacyInteractiveCatOnChair
        mode={mode}
        size={size}
        showControls={showControls}
        onIntimacyGain={onIntimacyGain}
        onFeed={onFeed}
        className={className}
        inPomodoro={inPomodoro}
      />
    );
  }

  const sizeClasses = {
    sm: 'w-48 h-48',
    md: 'w-64 h-64',
    lg: 'w-72 h-72',
    hero: 'w-80 h-80 sm:w-96 sm:h-96',
  }[size];

  const statusText =
    inPomodoro || mode === 'sleeping'
      ? '陪你安靜專注'
      : interactionMode === 'play'
        ? '準備撲抓'
        : interactionMode === 'treat'
          ? '聞到零食了'
          : '正在看著你';

  const controls: Array<{
    id: InteractionMode;
    icon: string;
    label: string;
  }> = [
    { id: 'pet', icon: 'touch_app', label: '摸摸' },
    { id: 'play', icon: 'toys', label: '陪玩' },
    { id: 'treat', icon: 'restaurant', label: '零食' },
  ];

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      <div className="mb-2 flex items-center gap-2 rounded-full border border-[#ecefeb] bg-white/92 px-3 py-1.5 shadow-[0_3px_12px_rgba(44,48,46,0.05)] backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-[#106c47]" />
        <span className="text-[11px] font-semibold text-[#564338]">
          {statusText}
        </span>
      </div>

      <div
        ref={stageRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handleInteraction}
        className={`relative ${sizeClasses} overflow-hidden rounded-[32px] border border-[#e5e8e4] bg-[radial-gradient(circle_at_50%_25%,#ffffff_0%,#f6f8f5_58%,#edf2ed_100%)] shadow-[0_18px_45px_-28px_rgba(24,28,27,0.45)]`}
      >
        <div className="absolute inset-0 z-[1]">
          <RiveComponent
            className="h-full w-full"
            aria-label="秒喵 Rive interactive character"
          />
        </div>

        <div className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-white/84 px-2.5 py-1 text-[9px] font-semibold text-[#564338] backdrop-blur-md">
          <span className="material-symbols-outlined text-[13px] text-[#9a4600]">
            pets
          </span>
          秒喵 · Rive
        </div>

        {feedback && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/70 bg-[#181c1b]/88 px-3 py-1.5 text-[10px] font-semibold text-white shadow-lg backdrop-blur">
            {feedback}
          </div>
        )}
      </div>

      {showControls && !inPomodoro && (
        <div className="mt-2.5 flex items-center gap-1 rounded-full border border-[#e8ebe7] bg-white/92 p-1 shadow-[0_4px_16px_rgba(44,48,46,0.05)]">
          {controls.map((control) => {
            const active = interactionMode === control.id;
            return (
              <button
                key={control.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setInteractionMode(control.id);
                }}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-semibold transition-all ${
                  active
                    ? 'bg-[#181c1b] text-white shadow-sm'
                    : 'text-[#6d716e] hover:bg-[#f1f4f1] hover:text-[#181c1b]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {control.icon}
                </span>
                {control.label}
              </button>
            );
          })}
        </div>
      )}

      <a
        href={RIVE_MARKETPLACE_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-1.5 text-[9px] text-[#8d918e] underline-offset-2 hover:underline"
      >
        Character: Floey · Rive Marketplace · CC BY
      </a>
    </div>
  );
};
