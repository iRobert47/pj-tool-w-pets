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

const RIVE_SOURCE = '/rive/miaomiao-v2.riv';
const STATE_MACHINE = 'MiaomiaoStateMachine';
const ARTBOARD = 'Miaomiao';

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const aliases: Record<string, string[]> = {
  pet: ['pet', 'touch', 'happy', 'love', 'stroke', 'pat', 'reactenjoy'],
  play: ['play', 'toy', 'paw', 'bat', 'jump', 'tease', 'active', 'pawreach', 'pawgrab'],
  treat: ['treat', 'feed', 'eat', 'food', 'snack', 'sniffsnack'],
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

  const getInput = (name: string) =>
    stateInputs.find((input) => input.name === name);

  const fireTrigger = (name: string) => {
    const input = getInput(name);
    if (input?.type !== StateMachineInputType.Trigger) return false;
    input.fire();
    return true;
  };

  const setBoolean = (name: string, value: boolean) => {
    const input = getInput(name);
    if (input?.type !== StateMachineInputType.Boolean) return false;
    input.value = value;
    return true;
  };

  const setNumber = (name: string, value: number) => {
    const input = getInput(name);
    if (input?.type !== StateMachineInputType.Number) return false;
    input.value = value;
    return true;
  };

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
    setBoolean('isSleeping', wantsSleep);
    setBoolean('isFocused', inPomodoro);

    if (!wantsSleep) {
      fireTrigger('wakeUp');
    }
    if (mode === 'stretching') {
      fireTrigger('stretch');
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

    setNumber('lookX', (nx + 1) * 50);
    setNumber('lookY', (ny + 1) * 50);
  };

  const triggerPlayReaction = (x = toolPosition.x, y = toolPosition.y) => {
    if (playCooldownRef.current) return;

    playCooldownRef.current = true;
    setBoolean('toolVisible', true);
    setBoolean('isWandActive', true);
    setNumber('toolX', x);
    setNumber('toolY', y);

    const distanceFromCat = Math.hypot(x - 50, (y - 50) * 0.9);
    if (distanceFromCat < 12) {
      fireTrigger('pawGrab');
      showFeedback('抓到了！');
    } else if (x < 50) {
      fireTrigger('pawReachLeft');
      showFeedback('左爪撲！');
    } else {
      fireTrigger('pawReachRight');
      showFeedback('右爪撲！');
    }

    catAudio.playMeow('happy');
    onIntimacyGain?.(1);

    window.setTimeout(() => {
      playCooldownRef.current = false;
    }, 720);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const pointer = getPointerPosition(event.clientX, event.clientY);
    if (!pointer) return;

    setPointerInside(true);
    setToolPosition({ x: pointer.x, y: pointer.y });
    setNumber('toolX', pointer.x);
    setNumber('toolY', pointer.y);
    setNumber('touchX', pointer.x);
    setNumber('touchY', pointer.y);
    setBoolean('toolVisible', true);
    setBoolean('isFingerActive', interactionMode === 'pet');
    setBoolean('isWandActive', interactionMode === 'play');
    setBoolean('isSnackActive', interactionMode === 'treat');
    updateLook(event.clientX, event.clientY);

    if (interactionMode === 'play' && !inPomodoro && mode !== 'sleeping') {
      const distanceFromCat = Math.hypot(
        pointer.x - 50,
        (pointer.y - 50) * 0.9
      );

      if (distanceFromCat < 24) {
        triggerPlayReaction(pointer.x, pointer.y);
      }
    }

    if (interactionMode === 'pet' && pointerDown) {
      setBoolean('isPetting', true);
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
      setBoolean('isSnackActive', true);
      setBoolean('toolVisible', true);
      fireTrigger('sniffSnack');
      showSnack();
      catAudio.playMunch();
      onFeed?.(15);
      onIntimacyGain?.(4);
      showFeedback('聞到了小魚乾');

      window.setTimeout(() => {
        fireTrigger('happyAfterEat');
        setBoolean('isSnackActive', false);
      }, 2100);
      return;
    }

    if (interactionMode === 'play') {
      triggerPlayReaction();
      onIntimacyGain?.(2);
      return;
    }

    setBoolean('isFingerActive', true);
    setBoolean('toolVisible', true);
    setBoolean('isPointerDown', true);
    setBoolean('isPetting', true);

    // Demo the three authored touch reactions by touch zone:
    // head = enjoy, torso = avoid, lower belly = belly-up.
    if (toolPosition.y < 46) {
      fireTrigger('reactEnjoy');
      showFeedback('呼嚕嚕');
      catAudio.startPurr();
    } else if (toolPosition.y > 62) {
      fireTrigger('reactBellyUp');
      showFeedback('翻肚肚');
      catAudio.startPurr();
    } else {
      fireTrigger('reactAvoid');
      showFeedback('躲一下');
      catAudio.playMeow('gentle');
    }

    onIntimacyGain?.(1);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const pointer = getPointerPosition(event.clientX, event.clientY);
    if (pointer) {
      setToolPosition({ x: pointer.x, y: pointer.y });
      setNumber('toolX', pointer.x);
      setNumber('toolY', pointer.y);
      setNumber('touchX', pointer.x);
      setNumber('touchY', pointer.y);
      setNumber('lookX', pointer.x);
      setNumber('lookY', pointer.y);
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

    setBoolean('isPointerDown', false);
    if (interactionMode === 'pet') {
      setBoolean('isPetting', false);
      catAudio.stopPurr();
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
      setBoolean('toolVisible', false);
      setBoolean('isFingerActive', false);
      setBoolean('isWandActive', false);
      setBoolean('isSnackActive', false);
    }
  };

  const switchInteractionMode = (nextMode: InteractionMode) => {
    setInteractionMode(nextMode);
    setPointerDown(false);
    fireTrigger('resetToIdle');
    setBoolean('isPetting', false);
    setBoolean('isPointerDown', false);
    setBoolean('isFingerActive', nextMode === 'pet');
    setBoolean('isWandActive', nextMode === 'play');
    setBoolean('isSnackActive', nextMode === 'treat');
    setBoolean('toolVisible', pointerInside);
    catAudio.stopPurr();

    if (nextMode === 'pet') showFeedback('摸頭、身體、肚肚反應不同');
    if (nextMode === 'play') showFeedback('把逗貓棒移到秒喵附近');
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
            <span className="material-symbols-outlined text-[38px] text-[#e6b894]">
              touch_app
            </span>
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
            <svg viewBox="0 0 64 32" className="h-8 w-14 overflow-visible" aria-hidden="true">
              <path d="M14 16 3 7v18l11-9Z" fill="#c28b5a" />
              <path d="M13 16c7-10 29-12 42 0-13 12-35 10-42 0Z" fill="#d7aa72" />
              <circle cx="45" cy="13" r="2" fill="#3f352d" />
              <path d="M24 11c6 3 8 7 0 11" fill="none" stroke="#b47b4b" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {snackVisible && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[12%] left-1/2 z-20 -translate-x-1/2 animate-[petSnackIn_220ms_ease-out] text-center"
          >
            <div className="relative h-8 w-16 rounded-[50%] border border-[#e2e4e1] bg-white/95 shadow-[0_5px_12px_rgba(24,28,27,0.12)]">
              <svg viewBox="0 0 64 32" className="absolute left-1/2 top-1/2 h-5 w-10 -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
                <path d="M14 16 3 7v18l11-9Z" fill="#c28b5a" />
                <path d="M13 16c7-10 29-12 42 0-13 12-35 10-42 0Z" fill="#d7aa72" />
                <circle cx="45" cy="13" r="2" fill="#3f352d" />
              </svg>
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

      <div className="mt-1.5 text-[9px] text-[#8d918e]">Miaomiao · Rive v2 prototype</div>


      <style>{`
        @keyframes petSnackIn {
          0% { opacity: 0; transform: translate(-50%, 6px) scale(0.88); }
          100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
      `}</style>
    </div>
  );
};
