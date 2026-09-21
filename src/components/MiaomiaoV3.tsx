import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alignment,
  Fit,
  Layout,
  StateMachineInputType,
  useRive,
} from '@rive-app/react-canvas';

interface MiaomiaoV3Props {
  mode?: 'sitting' | 'sleeping' | 'stretching';
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showControls?: boolean;
  onIntimacyGain?: (amount: number) => void;
  onFeed?: (amount: number) => void;
  className?: string;
  inPomodoro?: boolean;
}

/**
 * Miaomiao V3 — Illustrated Rig / Step 1
 *
 * Visual benchmark:
 * We intentionally start from the earlier illustrated Rive character that the
 * product review preferred. Step 1 is only about the "alive at rest" baseline:
 * idle, blink, gaze, ear motion and tail motion. Advanced pet / wand / snack
 * interactions are deliberately not exposed in this preview.
 *
 * Runtime alias:
 * Product-facing artboard/state-machine names are MiaomiaoV3 /
 * MiaomiaoV3StateMachine. The benchmark .riv's embedded names remain Artboard /
 * State Machine 1 until the proprietary illustrated asset is re-authored.
 */
const V3_RIVE_SOURCE =
  'https://public.rive.app/community/runtime-files/23404-43796-interactive-cute-black-cat.riv';
const V3_ARTBOARD_RUNTIME = 'Artboard';
const V3_STATE_MACHINE_RUNTIME = 'State Machine 1';

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const aliases = {
  lookX: ['lookx', 'eyex', 'gazex', 'mousex', 'cursorx', 'x'],
  lookY: ['looky', 'eyey', 'gazey', 'mousey', 'cursory', 'y'],
  idle: ['idle', 'sit', 'sitting', 'default'],
  focus: ['focus', 'work', 'working', 'pomodoro'],
};

const matchesAlias = (name: string, candidates: string[]) => {
  const candidate = normalize(name);
  return candidates.some((alias) => candidate.includes(alias));
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const MiaomiaoV3: React.FC<MiaomiaoV3Props> = ({
  mode = 'sitting',
  size = 'md',
  className = '',
  inPomodoro = false,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [riveFailed, setRiveFailed] = useState(false);
  const [inputVersion, setInputVersion] = useState(0);
  const [isWatching, setIsWatching] = useState(false);

  const { rive, RiveComponent } = useRive({
    src: V3_RIVE_SOURCE,
    artboard: V3_ARTBOARD_RUNTIME,
    stateMachines: V3_STATE_MACHINE_RUNTIME,
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    onLoad: () => setInputVersion((v) => v + 1),
    onLoadError: () => setRiveFailed(true),
  });

  const stateInputs = useMemo(() => {
    if (!rive) return [];
    try {
      return rive.stateMachineInputs(V3_STATE_MACHINE_RUNTIME) ?? [];
    } catch {
      return [];
    }
  }, [rive, inputVersion]);

  const setNumberByAlias = (key: 'lookX' | 'lookY', value: number) => {
    const input = stateInputs.find(
      (candidate) =>
        candidate.type === StateMachineInputType.Number &&
        matchesAlias(candidate.name, aliases[key])
    );
    if (!input) return false;
    input.value = value;
    return true;
  };

  const setBooleanByAlias = (key: 'idle' | 'focus', value: boolean) => {
    let changed = false;
    stateInputs.forEach((input) => {
      if (
        input.type === StateMachineInputType.Boolean &&
        matchesAlias(input.name, aliases[key])
      ) {
        input.value = value;
        changed = true;
      }
    });
    return changed;
  };

  useEffect(() => {
    if (!rive) return;
    setBooleanByAlias('focus', inPomodoro);
    setBooleanByAlias('idle', mode === 'sitting' && !inPomodoro);
  }, [rive, mode, inPomodoro, inputVersion]);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!stageRef.current || !rive || mode === 'sleeping') return;

    const rect = stageRef.current.getBoundingClientRect();
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);

    // The benchmark file may expose gaze as -1..1 or 0..100 depending on
    // runtime revision. Prefer the direct 0..100 product contract first.
    const hasX = setNumberByAlias('lookX', x);
    const hasY = setNumberByAlias('lookY', y);

    // If the file itself owns gaze internally, keep the pointer presence as a
    // subtle UI cue rather than forcing synthetic animation in React.
    setIsWatching(hasX || hasY);
  };

  const handlePointerLeave = () => {
    setIsWatching(false);
    setNumberByAlias('lookX', 50);
    setNumberByAlias('lookY', 50);
  };

  const sizeClasses = {
    sm: 'w-48 h-48',
    md: 'w-64 h-64',
    lg: 'w-72 h-72',
    hero: 'w-80 h-80 sm:w-96 sm:h-96',
  }[size];

  if (riveFailed) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div
          className={`${sizeClasses} grid place-items-center rounded-[36px] border border-[#ddd5cb] bg-[#f5f1eb] text-center shadow-[0_22px_55px_-38px_rgba(25,22,20,0.42)]`}
        >
          <div>
            <div className="text-sm font-semibold text-[#292725]">Miaomiao V3</div>
            <div className="mt-1 text-[10px] text-[#8c8379]">Rive asset unavailable</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      <div className="mb-2 flex items-center gap-2 rounded-full border border-[#e9e2d9] bg-[#fbf8f3]/95 px-3 py-1.5 shadow-[0_5px_18px_rgba(37,33,29,0.05)] backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-[#252625]" />
        <span className="text-[10px] font-semibold tracking-[0.08em] text-[#615b55]">
          MIAOMIAO V3 · ILLUSTRATED RIG
        </span>
      </div>

      <div
        ref={stageRef}
        onPointerMove={handlePointerMove}
        onPointerEnter={() => setIsWatching(true)}
        onPointerLeave={handlePointerLeave}
        className={`relative ${sizeClasses} overflow-hidden rounded-[36px] border border-[#ded7cf] bg-[radial-gradient(circle_at_50%_20%,#fbfaf7_0%,#f0ebe4_65%,#e8e0d7_100%)] shadow-[0_24px_60px_-34px_rgba(27,24,22,0.5)]`}
        style={{ touchAction: 'none' }}
      >
        <div className="absolute inset-x-[13%] bottom-[8%] h-[10%] rounded-[50%] bg-[#554c44]/10 blur-md" />

        <div className="absolute inset-0 z-[1]">
          <RiveComponent
            className="h-full w-full"
            aria-label="Miaomiao V3 illustrated black cat"
          />
        </div>

        <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
          <div
            className={`rounded-full border px-2.5 py-1 text-[9px] font-medium backdrop-blur transition-all duration-200 ${
              isWatching
                ? 'border-[#cfc4b8] bg-[#fbf8f3]/92 text-[#4f4943]'
                : 'border-[#e4ddd5] bg-[#fbf8f3]/78 text-[#8a8178]'
            }`}
          >
            {isWatching ? '秒喵正在看你' : 'Idle · Blink · Look · Tail · Ear'}
          </div>
        </div>
      </div>

      <a
        href="https://rive.app/marketplace/23404-43796-interactive-cute-black-cat/"
        target="_blank"
        rel="noreferrer"
        className="mt-1.5 text-[8px] text-[#9b938b] underline-offset-2 hover:underline"
      >
        Step 1 visual benchmark · Floey / Rive Marketplace · CC BY
      </a>
    </div>
  );
};
