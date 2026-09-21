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

type ToolPosition = {
  x: number;
  y: number;
};

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

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

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
  const playCooldownRef = useRef(false);
  const snackTimerRef = useRef<number | null>(null);

  const [interactionMode, setInteractionMode] = useState<InteractionMode>('pet');
  const [riveFailed, setRiveFailed] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [inputNames, setInputNames] = useState<string[]>([]);
  const [toolPosition, setToolPosition] = useState<ToolPosition>({ x: 50, y: 54 });
  const [pointerInside, setPointerInside] = useState(false);
  const [pointerDown, setPointerDown] = useState(false);
  const [snackVisible, setSnackVisible] = useState(false);

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

  useEffect(
    () => () => {
      if (snackTimerRef.current !== null) {
        window.clearTimeout(snackTimerRef.current);
      }
    },
    []
  );

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

  const getPointerPosition = (clientX: number, clientY: number) => {
    if (!stageRef.current) return null;
    const rect = stageRef.current.getBoundingClientRect();

    return {
      x: clamp(((clientX - rect.left) / rect.width) * 100, 2, 98),
      y: clamp(((clientY - rect.top) / rect.height) * 100, 2, 98),
      rect,
    };
  };

  const updateLook = (clientX: number, clientY: number) => {
    if (!stageRef.current || !rive || inPomodoro || mode === 'sleeping') return;

    const rect = stageRef.current.getBoundingClientRect();
    const nx = clamp(
      (clientX - (rect.left + rect.width / 2)) / (rect.width / 2),
      -1,
      1
    );
    const ny = clamp(
      (clientY - (rect.top + rect.height / 2)) / (rect.height / 2),
      -1,
      1
    );

    setMatchingNumber('lookX', nx);
    setMatchingNumber('lookY', ny);
  };

  const triggerPlayReaction = () => {
    if (playCooldownRef.current) return;

    playCooldownRef.current = true;
    fireMatchingTrigger('play');
    setMatchingBoolean('play', true);
    catAudio.playMeow('happy');
    onIntimacyGain?.(1);
    showFeedback('撲！');

    window.setTimeout(() => setMatchingBoolean('play', false), 420);
    window.setTimeout(() => {
      playCooldownRef.current = false;
    }, 900);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const pointer = getPointerPosition(event.clientX, event.clientY);
    if (!pointer) return;

    setPointerInside(true);
    setToolPosition({ x: pointer.x, y: pointer.y });
    updateLook(event.clientX, event.clientY);

    if (interactionMode === 'play' && !inPomodoro && mode !== 'sleeping') {
      const distanceFromCat = Math.hypot(
        pointer.x - 50,
        (pointer.y - 50) * 0.9
      );

      if (distanceFromCat < 24) {
        triggerPlayReaction();
      }
    }

    if (interactionMode === 'pet' && pointerDown) {
      setMatchingBoolean('pet', true);
    }
  };

  const showSnack = () => {
    if (snackTimerRef.current !== null) {
      window.clearTimeout(snackTimerRef.current);
    }
    setSnackVisible(true);
    snackTimerRef.current = window.setTimeout(() => {
      setSnackVisible(false);
      snackTimerRef.current = null;
    }, 1050);
  };

  const handleInteraction = () => {
    if (interactionMode === 'treat') {
      fireMatchingTrigger('treat');
      setMatchingBoolean('treat', true);
      window.setTimeout(() => setMatchingBoolean('treat', false), 520);
      showSnack();
      catAudio.playMunch();
      onFeed?.(15);
      onIntimacyGain?.(4);
      showFeedback('小魚乾來了');
      return;
    }

    if (interactionMode === 'play') {
      triggerPlayReaction();
      onIntimacyGain?.(2);
      showFeedback('抓得到嗎？');
      return;
    }

    fireMatchingTrigger('pet');
    setMatchingBoolean('pet', true);
    catAudio.startPurr();
    onIntimacyGain?.(1);
    showFeedback('呼嚕嚕');
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const pointer = getPointerPosition(event.clientX, event.clientY);
    if (pointer) {
      setToolPosition({ x: pointer.x, y: pointer.y });
    }

    setPointerInside(true);
    setPointerDown(true);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is optional on older browsers.
    }

    handleInteraction();
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    setPointerDown(false);

    if (interactionMode === 'pet') {
      setMatchingBoolean('pet', false);
      catAudio.stopPurr();
      catAudio.playMeow('gentle');
    }

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore unsupported pointer-capture releases.
    }
  };

  const handlePointerLeave = () => {
    if (!pointerDown) {
      setPointerInside(false);
    }
  };

  const switchInteractionMode = (nextMode: InteractionMode) => {
    setInteractionMode(nextMode);
    setPointerDown(false);
    setMatchingBoolean('pet', false);
    setMatchingBoolean('play', false);
    setMatchingBoolean('treat', false);
    catAudio.stopPurr();

    if (nextMode === 'pet') showFeedback('用手指摸摸牠');
    if (nextMode === 'play') showFeedback('晃動逗貓棒');
    if (nextMode === 'treat') showFeedback('把小魚乾送過去');
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
        ? '逗貓棒模式'
        : interactionMode === 'treat'
          ? '餵小魚乾'
          : '手指摸摸';

  const controls: Array<{
    id: InteractionMode;
    icon: string;
    label: string;
  }> = [
    { id: 'pet', icon: 'touch_app', label: '摸摸' },
    { id: 'play', icon: 'toys', label: '逗貓棒' },
    { id: 'treat', icon: 'restaurant', label: '小魚乾' },
  ];

  const showTool = pointerInside && !inPomodoro && mode !== 'sleeping';

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
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className={`relative ${sizeClasses} overflow-hidden rounded-[32px] border border-[#e5e8e4] bg-[radial-gradient(circle_at_50%_25%,#ffffff_0%,#f6f8f5_58%,#edf2ed_100%)] shadow-[0_18px_45px_-28px_rgba(24,28,27,0.45)]`}
        style={{ touchAction: 'none' }}
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

        {showTool && interactionMode === 'pet' && (
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute z-30 -translate-x-[32%] -translate-y-[18%] text-[34px] drop-shadow-[0_5px_8px_rgba(24,28,27,0.22)] transition-transform duration-75 ${
              pointerDown ? 'scale-90' : 'scale-100'
            }`}
            style={{ left: `${toolPosition.x}%`, top: `${toolPosition.y}%` }}
          >
            👆
          </div>
        )}

        {showTool && interactionMode === 'play' && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-30 h-24 w-24 -translate-x-[18%] -translate-y-[82%] drop-shadow-[0_5px_8px_rgba(24,28,27,0.18)]"
            style={{ left: `${toolPosition.x}%`, top: `${toolPosition.y}%` }}
          >
            <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
              <line
                x1="13"
                y1="12"
                x2="72"
                y2="72"
                stroke="#875330"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M72 72 Q81 78 78 88"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="1.7"
              />
              <path d="M78 87 C91 78 97 88 84 96 Z" fill="#ff8a3d" />
              <path d="M78 87 C66 88 67 99 82 97 Z" fill="#ffb703" />
              <path d="M78 87 C82 99 93 100 86 89 Z" fill="#e63946" />
              <circle cx="78" cy="87" r="3.5" fill="#ffd166" />
            </svg>
          </div>
        )}

        {showTool && interactionMode === 'treat' && (
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 text-[30px] drop-shadow-[0_5px_8px_rgba(24,28,27,0.18)] transition-transform duration-100 ${
              pointerDown ? 'scale-90 rotate-[-8deg]' : 'scale-100'
            }`}
            style={{ left: `${toolPosition.x}%`, top: `${toolPosition.y}%` }}
          >
            🐟
          </div>
        )}

        {snackVisible && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[12%] left-1/2 z-20 -translate-x-1/2 animate-[petSnackIn_220ms_ease-out] text-center"
          >
            <div className="relative h-8 w-16 rounded-[50%] border border-[#e2e4e1] bg-white/95 shadow-[0_5px_12px_rgba(24,28,27,0.12)]">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[58%] text-[18px]">
                🐟
              </div>
            </div>
          </div>
        )}

        {feedback && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-40 -translate-x-1/2 rounded-full border border-white/70 bg-[#181c1b]/88 px-3 py-1.5 text-[10px] font-semibold text-white shadow-lg backdrop-blur">
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
                  switchInteractionMode(control.id);
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

      <style>{`
        @keyframes petSnackIn {
          0% { opacity: 0; transform: translate(-50%, 6px) scale(0.88); }
          100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
      `}</style>
    </div>
  );
};
