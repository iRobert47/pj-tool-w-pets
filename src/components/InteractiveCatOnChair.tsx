import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alignment,
  Fit,
  Layout,
  StateMachineInputType,
  useRive,
} from '@rive-app/react-canvas';
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

const RIVE_SOURCE = '/rive/miaomiao-v3.riv';
const STATE_MACHINE = 'MiaomiaoV3StateMachine';
const ARTBOARD = 'MiaomiaoV3';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// 逗貓棒模式 (Wand Mode): the grab zone is centered on the rig's front
// paws. Derived from scene.rml's artboard coords (body_rig at y=236, paw_L/R
// at local y=116 -> 352 absolute) as a percentage of the 500x500 artboard;
// safe to treat as a percentage of the stage too since both are square and
// Fit.Contain maps them 1:1 with no letterboxing.
const WAND_ZONE = { x: 50, y: 70.4, radius: 14 };
const WAND_REST_POS = { x: 82, y: 16 };
const WAND_GRAB_COOLDOWN_MS = 900;

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
  const [riveFailed, setRiveFailed] = useState(false);
  const [inputNames, setInputNames] = useState<string[]>([]);
  // 手指模式 (Finger Mode): intimacyLevel is app-owned and fed into the rig
  // before each pet -- it decides belly-touch outcome (flip vs. dodge) and
  // grows slowly so that outcome unlocks with repeated gentle petting.
  const [intimacy, setIntimacy] = useState(20);

  // 逗貓棒模式 (Wand Mode): the wand is a draggable toy layered over the
  // stage. wasInZoneRef/coolingDownRef track transition + cooldown state
  // outside React state so the drag handler can read them synchronously
  // without waiting on a re-render.
  const [wandPos, setWandPos] = useState(WAND_REST_POS);
  const [isDraggingWand, setIsDraggingWand] = useState(false);
  const wasInZoneRef = useRef(false);
  const coolingDownRef = useRef(false);

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

  const getInput = (name: string) =>
    stateInputs.find((input) => input.name === name);

  const setNumber = (name: string, value: number) => {
    const input = getInput(name);
    if (input?.type !== StateMachineInputType.Number) return;
    input.value = value;
  };

  const setBoolean = (name: string, value: boolean) => {
    const input = getInput(name);
    if (input?.type !== StateMachineInputType.Boolean) return;
    input.value = value;
  };

  const fireTrigger = (name: string) => {
    const input = getInput(name);
    if (input?.type === StateMachineInputType.Trigger) {
      input.fire();
    }
  };

  useEffect(() => {
    if (!rive) return;
    setBoolean('isIdle', true);
    setBoolean('isFocused', inPomodoro);
  }, [rive, inPomodoro, inputNames]);

  const updateLook = (clientX: number, clientY: number) => {
    if (!stageRef.current || !rive) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = clamp(((clientX - rect.left) / rect.width) * 100, 8, 92);
    const y = clamp(((clientY - rect.top) / rect.height) * 100, 10, 90);
    setNumber('lookX', x);
    setNumber('lookY', y);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    setBoolean('isFocused', true);
    updateLook(event.clientX, event.clientY);
  };

  const handlePointerLeave = () => {
    setBoolean('isFocused', inPomodoro);
    setNumber('lookX', 50);
    setNumber('lookY', 50);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    updateLook(event.clientX, event.clientY);
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;

    // 手指模式: zone is a rough guess from tap position -- top band reads as
    // head/cheek/back, a trailing column on the right (where the tail
    // curls) reads as tail, everything else is belly. touchZone/
    // intimacyLevel/petTouchNow match the PetReaction layer added in
    // scene.rml's Batch 1.
    const relX = (event.clientX - rect.left) / rect.width;
    const relY = (event.clientY - rect.top) / rect.height;
    const touchZone = relY < 0.42 ? 0 : relX > 0.72 ? 2 : 1;

    setNumber('touchZone', touchZone);
    setNumber('intimacyLevel', intimacy);
    fireTrigger('petTouchNow');

    setIntimacy((prev) => Math.min(100, prev + 6));
    onIntimacyGain?.(1);
  };

  const triggerGrab = () => {
    if (coolingDownRef.current) return;
    coolingDownRef.current = true;
    setBoolean('isCoolingDown', true);
    fireTrigger('grabNow');
    onIntimacyGain?.(1);
    setTimeout(() => {
      coolingDownRef.current = false;
      setBoolean('isCoolingDown', false);
    }, WAND_GRAB_COOLDOWN_MS);
  };

  const handleWandPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDraggingWand(true);
  };

  const handleWandPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 4, 96);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 4, 96);
    setWandPos({ x, y });
    updateLook(event.clientX, event.clientY);

    // 步驟1「視線先追」已由上面的 updateLook 涵蓋。以下是步驟2「進抓取區」
    // 的距離判定，和步驟3「爪子抓」在剛進入範圍那一刻觸發。
    const inZone =
      Math.hypot(x - WAND_ZONE.x, y - WAND_ZONE.y) <= WAND_ZONE.radius;
    setBoolean('wandInGrabZone', inZone);
    if (inZone && !wasInZoneRef.current) {
      triggerGrab();
    }
    wasInZoneRef.current = inZone;
  };

  const handleWandPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    setIsDraggingWand(false);
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

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      <div
        ref={stageRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        className={`relative ${sizeClasses} overflow-hidden rounded-[30px] border border-[#e9e2d9] bg-[#f7f2ec] shadow-[0_20px_48px_-30px_rgba(38,32,28,0.45)]`}
        style={{ touchAction: 'none' }}
      >
        <div className="absolute inset-0">
          <RiveComponent
            className="h-full w-full"
            aria-label="秒喵 Miaomiao V3 illustrated Rive character"
          />
        </div>

        {/* 逗貓棒模式: grab-zone hint, only shown while actively dragging so
            the idle view stays clean. */}
        {isDraggingWand && (
          <div
            className="pointer-events-none absolute z-10 rounded-full border-2 border-dashed border-[#c98a4b]/70"
            style={{
              left: `${WAND_ZONE.x}%`,
              top: `${WAND_ZONE.y}%`,
              width: `${WAND_ZONE.radius * 2}%`,
              height: `${WAND_ZONE.radius * 2}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}

        {/* 逗貓棒模式: draggable toy. Its own pointer handlers stop
            propagation so grabbing it never also fires the finger-mode pet
            reaction on the stage underneath. */}
        <div
          onPointerDown={handleWandPointerDown}
          onPointerMove={handleWandPointerMove}
          onPointerUp={handleWandPointerUp}
          className="absolute z-20 cursor-grab touch-none active:cursor-grabbing"
          style={{
            left: `${wandPos.x}%`,
            top: `${wandPos.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          role="button"
          aria-label="逗貓棒玩具，可拖曳靠近貓咪"
        >
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <line x1="8" y1="24" x2="20" y2="10" stroke="#8d6f57" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="21" cy="8" r="5" fill="#c98a4b" />
            <circle cx="21" cy="8" r="5" fill="#c98a4b" fillOpacity="0.001" stroke="#e0a86e" strokeWidth="1.5" />
          </svg>
        </div>

        {showControls && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#171819]/72 px-3 py-1.5 text-[9px] font-medium text-white/90 backdrop-blur">
            移動手指看眼神 · 點觸摸貓咪逗牠玩 · 拖曳逗貓棒到爪子附近
          </div>
        )}
      </div>

      <div className="mt-1.5 text-[9px] text-[#9a8e84]">
        Step 3 · 手指模式 + 逗貓棒模式
      </div>
    </div>
  );
};
