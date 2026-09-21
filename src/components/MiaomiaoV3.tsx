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

const RIVE_SOURCE = '/rive/miaomiao-v3.riv?v=32-clean-20260922';
const ARTBOARD = 'MiaomiaoV3';
const STATE_MACHINE = 'MiaomiaoV3StateMachine';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const MiaomiaoV3: React.FC<MiaomiaoV3Props> = ({
  mode = 'sitting',
  size = 'md',
  className = '',
  inPomodoro = false,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const targetLookRef = useRef({ x: 50, y: 50 });
  const currentLookRef = useRef({ x: 50, y: 50 });
  const animationFrameRef = useRef<number | null>(null);
  const pointerInsideRef = useRef(false);
  const lifeTimerRef = useRef<number | null>(null);
  const [riveFailed, setRiveFailed] = useState(false);
  const [inputVersion, setInputVersion] = useState(0);
  const [isWatching, setIsWatching] = useState(false);

  const { rive, RiveComponent } = useRive({
    src: RIVE_SOURCE,
    artboard: ARTBOARD,
    stateMachines: STATE_MACHINE,
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
      return rive.stateMachineInputs(STATE_MACHINE) ?? [];
    } catch {
      return [];
    }
  }, [rive, inputVersion]);

  const inputByName = (name: string) =>
    stateInputs.find((input) => input.name === name);

  const setNumber = (name: string, value: number) => {
    const input = inputByName(name);
    if (input?.type !== StateMachineInputType.Number) return false;
    input.value = value;
    return true;
  };

  const setBoolean = (name: string, value: boolean) => {
    const input = inputByName(name);
    if (input?.type !== StateMachineInputType.Boolean) return false;
    input.value = value;
    return true;
  };

  const fireTrigger = (name: string) => {
    const input = inputByName(name);
    if (input?.type !== StateMachineInputType.Trigger) return false;
    input.fire();
    return true;
  };

  useEffect(() => {
    if (!rive) return;
    setBoolean('isIdle', mode === 'sitting' && !inPomodoro);
    setBoolean('isFocused', inPomodoro);
  }, [rive, mode, inPomodoro, inputVersion]);

  useEffect(() => {
    if (!rive) return;

    const tick = () => {
      const current = currentLookRef.current;
      const target = targetLookRef.current;

      // Pupils react first, but ease toward the target instead of snapping.
      current.x += (target.x - current.x) * 0.14;
      current.y += (target.y - current.y) * 0.14;

      if (Math.abs(target.x - current.x) < 0.02) current.x = target.x;
      if (Math.abs(target.y - current.y) < 0.02) current.y = target.y;

      setNumber('lookX', current.x);
      setNumber('lookY', current.y);
      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [rive, inputVersion]);

  useEffect(() => {
    if (!rive || mode === 'sleeping') return;

    const scheduleNext = () => {
      const delay = 2200 + Math.random() * 2400;
      lifeTimerRef.current = window.setTimeout(() => {
        if (!pointerInsideRef.current) {
          // Quiet micro-saccades keep Miaomiao alive even when untouched.
          targetLookRef.current = {
            x: 43 + Math.random() * 14,
            y: 44 + Math.random() * 12,
          };

          if (Math.random() > 0.58) {
            fireTrigger('earTwitchNow');
          }
          if (Math.random() > 0.78) {
            fireTrigger('blinkNow');
          }
        }
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => {
      if (lifeTimerRef.current !== null) {
        window.clearTimeout(lifeTimerRef.current);
      }
    };
  }, [rive, inputVersion, mode]);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!stageRef.current || mode === 'sleeping') return;
    pointerInsideRef.current = true;

    const rect = stageRef.current.getBoundingClientRect();
    targetLookRef.current = {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 5, 95),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 8, 92),
    };
    setIsWatching(true);
  };

  const handlePointerEnter = () => {
    pointerInsideRef.current = true;
    setIsWatching(true);
    // Small secondary response: the ear notices before the body does.
    if (Math.random() > 0.45) fireTrigger('earTwitchNow');
  };

  const handlePointerDown = () => {
    fireTrigger('blinkNow');
  };

  const handlePointerLeave = () => {
    pointerInsideRef.current = false;
    setIsWatching(false);
    targetLookRef.current = { x: 50, y: 50 };
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
        <div className={`${sizeClasses} grid place-items-center rounded-[36px] border border-[#ddd5cb] bg-[#f5f1eb]`}>
          <div className="text-center">
            <div className="text-sm font-semibold text-[#292725]">Miaomiao V3.2</div>
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
          MIAOMIAO V3.2 · CLEAN ILLUSTRATED RIG
        </span>
      </div>

      <div
        ref={stageRef}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerDown={handlePointerDown}
        onPointerLeave={handlePointerLeave}
        className={`relative ${sizeClasses} overflow-hidden rounded-[36px] border border-[#ded7cf] bg-[radial-gradient(circle_at_50%_20%,#fbfaf7_0%,#f0ebe4_65%,#e8e0d7_100%)] shadow-[0_24px_60px_-34px_rgba(27,24,22,0.5)]`}
        style={{ touchAction: 'none' }}
      >
        <div className="absolute inset-0 z-[1]">
          <RiveComponent
            className="h-full w-full"
            aria-label="Miaomiao V3.2 clean illustrated black cat"
          />
        </div>

        <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
          <div
            className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-medium backdrop-blur transition-all duration-200 ${
              isWatching
                ? 'border-[#cfc4b8] bg-[#fbf8f3]/92 text-[#4f4943]'
                : 'border-[#e4ddd5] bg-[#fbf8f3]/78 text-[#8a8178]'
            }`}
          >
            {isWatching ? '秒喵注意到你了' : 'Idle · Blink · Look · Tail · Ear'}
          </div>
        </div>
      </div>

      <div className="mt-1.5 text-[8px] tracking-[0.06em] text-[#9b938b]">
        CLEAN ILLUSTRATED CHARACTER RIG · V3.2
      </div>
    </div>
  );
};
