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

        {showControls && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#171819]/72 px-3 py-1.5 text-[9px] font-medium text-white/90 backdrop-blur">
            移動手指看眼神 · 點觸摸貓咪逗牠玩
          </div>
        )}
      </div>

      <div className="mt-1.5 text-[9px] text-[#9a8e84]">
        Step 2 · 手指模式 Finger Mode
      </div>
    </div>
  );
};
