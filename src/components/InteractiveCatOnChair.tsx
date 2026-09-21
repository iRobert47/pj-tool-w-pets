import React, { useEffect, useMemo, useRef, useState } from 'react';
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

type InteractionMode = 'pet' | 'treat' | 'play';

type Gaze = {
  x: number;
  y: number;
};

const LOTTIE_PAGE_URL =
  'https://lottiefiles.com/free-animation/black-cat-3OBQxyPyXe';
const LOTTIE_EMBED_API = '/api/lottie-embed';
const LOTTIE_PREVIEW_URL =
  'https://assets-v2.lottiefiles.com/a/7ea04694-1182-11ee-a98e-1362e8508d70/TB9Ub8h2gy.png';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Eye anchor points are percentage-based so they scale with the pet stage.
 * Keep these values together to make future Lottie swaps easy to retune.
 */
const EYE_LAYOUT = {
  left: {
    left: '42.0%',
    top: '39.6%',
  },
  right: {
    left: '53.0%',
    top: '39.6%',
  },
};

export const InteractiveCatOnChair: React.FC<InteractiveCatOnChairProps> = ({
  mode: initialMode = 'sitting',
  size = 'md',
  showControls = true,
  onIntimacyGain,
  onFeed,
  className = '',
  inPomodoro = false,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [currentPose, setCurrentPose] = useState<
    'sitting' | 'sleeping' | 'stretching'
  >(inPomodoro ? 'sleeping' : initialMode);
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode>('pet');
  const [embedSrc, setEmbedSrc] = useState<string | null>(null);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [gaze, setGaze] = useState<Gaze>({ x: 0, y: 0 });
  const [isPointerInside, setIsPointerInside] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const resolveEmbed = async () => {
      try {
        const response = await fetch(LOTTIE_EMBED_API);
        if (!response.ok) throw new Error('Unable to resolve Lottie embed');
        const payload = await response.json();

        if (!cancelled && typeof payload?.src === 'string') {
          setEmbedSrc(payload.src);
        }
      } catch {
        // Fall back to the animation's preview artwork below.
      } finally {
        if (!cancelled) setIsLoadingEmbed(false);
      }
    };

    resolveEmbed();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!inPomodoro) return;
    setCurrentPose('sleeping');
    setGaze({ x: 0, y: 0 });
  }, [inPomodoro]);

  useEffect(() => {
    if (currentPose === 'sleeping') {
      setGaze({ x: 0, y: 0 });
    }
  }, [currentPose]);

  const sizeClasses = {
    sm: 'w-44 h-44',
    md: 'w-60 h-60',
    lg: 'w-72 h-72',
    hero: 'w-80 h-80 sm:w-96 sm:h-96',
  }[size];

  const ambientLabel = useMemo(() => {
    if (inPomodoro || currentPose === 'sleeping') return '安靜陪你專注';
    if (currentPose === 'stretching') return '正在伸懶腰';
    if (isPointerInside) return '正在看著你';
    return '今天也待在你身邊';
  }, [currentPose, inPomodoro, isPointerInside]);

  const gazeStrength = interactionMode === 'play' ? 3.2 : 2.2;
  const verticalStrength = interactionMode === 'play' ? 2.3 : 1.6;
  const treatYOffset = interactionMode === 'treat' ? 1.2 : 0;

  const updateGazeFromPoint = (clientX: number, clientY: number) => {
    if (!stageRef.current || currentPose === 'sleeping' || inPomodoro) {
      setGaze({ x: 0, y: 0 });
      return;
    }

    const rect = stageRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height * 0.42;

    const normalizedX = (clientX - centerX) / (rect.width / 2);
    const normalizedY = (clientY - centerY) / (rect.height / 2);

    setGaze({
      x: clamp(normalizedX, -1, 1),
      y: clamp(normalizedY, -1, 1),
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsPointerInside(true);
    updateGazeFromPoint(event.clientX, event.clientY);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsPointerInside(true);
    updateGazeFromPoint(event.clientX, event.clientY);
  };

  const handlePointerLeave = () => {
    setIsPointerInside(false);
    setGaze({ x: 0, y: 0 });
  };

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 1200);
  };

  const handleCharacterInteraction = () => {
    if (interactionMode === 'treat') {
      catAudio.playMunch();
      onFeed?.(15);
      onIntimacyGain?.(4);
      showFeedback('吃得很滿足');
      return;
    }

    if (interactionMode === 'play') {
      catAudio.playMeow('happy');
      onIntimacyGain?.(3);
      setCurrentPose('stretching');
      showFeedback('注意力被你吸引了');

      window.setTimeout(() => {
        if (!inPomodoro) setCurrentPose('sitting');
      }, 1100);

      return;
    }

    catAudio.startPurr();
    onIntimacyGain?.(1);
    showFeedback('呼嚕聲變大了一點');
    window.setTimeout(() => catAudio.stopPurr(), 900);
  };

  const controls: Array<{
    id: InteractionMode;
    icon: string;
    label: string;
  }> = [
    { id: 'pet', icon: 'touch_app', label: '摸摸' },
    { id: 'play', icon: 'toys', label: '陪玩' },
    { id: 'treat', icon: 'restaurant', label: '零食' },
  ];

  const pupilTransform = `translate(
    calc(-50% + ${gaze.x * gazeStrength}px),
    calc(-50% + ${gaze.y * verticalStrength + treatYOffset}px)
  )`;

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      <div className="mb-2 flex items-center gap-2 rounded-full border border-[#ecefeb] bg-white/90 px-3 py-1.5 shadow-[0_3px_12px_rgba(44,48,46,0.05)] backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-[#106c47]" />
        <span className="text-[11px] font-semibold tracking-[0.01em] text-[#564338]">
          {ambientLabel}
        </span>
      </div>

      <div
        ref={stageRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerLeave={handlePointerLeave}
        className={`relative ${sizeClasses} overflow-hidden rounded-[32px] border border-[#e5e8e4] bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,1)_0%,rgba(247,250,247,0.98)_45%,rgba(239,243,239,0.98)_100%)] shadow-[0_18px_45px_-28px_rgba(24,28,27,0.45)]`}
      >
        <div className="absolute inset-x-[16%] bottom-[12%] h-[18%] rounded-[50%] bg-black/[0.07] blur-xl" />
        <div className="absolute -right-8 top-4 h-24 w-24 rounded-full bg-[#ffdea9]/20 blur-2xl" />
        <div className="absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-[#a1f4c5]/20 blur-2xl" />

        <button
          type="button"
          aria-label="與秒喵互動"
          onClick={handleCharacterInteraction}
          className="absolute inset-0 z-10 cursor-pointer bg-transparent"
        />

        <div
          className="absolute inset-0 z-[1] flex items-center justify-center transition-transform duration-500"
          style={{
            transform:
              currentPose === 'sleeping'
                ? 'translateY(10px) scale(0.94)'
                : currentPose === 'stretching'
                  ? 'translateY(-4px) scale(1.04)'
                  : 'translateY(0) scale(1)',
          }}
        >
          {embedSrc ? (
            <iframe
              title="秒喵 Lottie animation"
              src={embedSrc}
              className="pointer-events-none h-[88%] w-[88%] border-0 bg-transparent"
              allow="autoplay"
              loading="eager"
            />
          ) : (
            <img
              src={LOTTIE_PREVIEW_URL}
              alt="秒喵黑貓動畫預覽"
              className={`h-[78%] w-[78%] object-contain drop-shadow-[0_14px_18px_rgba(24,28,27,0.12)] transition-all duration-700 ${
                isLoadingEmbed ? 'opacity-45 grayscale-[15%]' : 'opacity-100'
              }`}
              style={{
                animation:
                  currentPose === 'sleeping'
                    ? 'petFloat 4.8s ease-in-out infinite'
                    : 'petFloat 3.4s ease-in-out infinite',
              }}
            />
          )}
        </div>

        {currentPose !== 'sleeping' && !inPomodoro && (
          <div
            className="pointer-events-none absolute inset-0 z-[12]"
            aria-hidden="true"
          >
            <div
              className="absolute h-[5.6%] w-[5.6%]"
              style={EYE_LAYOUT.left}
            >
              <div
                className="absolute left-1/2 top-1/2 h-[62%] w-[34%] rounded-full bg-black/90 shadow-[0_0_0_0.5px_rgba(255,255,255,0.15)] transition-transform duration-100 ease-out"
                style={{ transform: pupilTransform }}
              >
                <span className="absolute left-[23%] top-[16%] h-[22%] w-[28%] rounded-full bg-white/75" />
              </div>
            </div>

            <div
              className="absolute h-[5.6%] w-[5.6%]"
              style={EYE_LAYOUT.right}
            >
              <div
                className="absolute left-1/2 top-1/2 h-[62%] w-[34%] rounded-full bg-black/90 shadow-[0_0_0_0.5px_rgba(255,255,255,0.15)] transition-transform duration-100 ease-out"
                style={{ transform: pupilTransform }}
              >
                <span className="absolute left-[23%] top-[16%] h-[22%] w-[28%] rounded-full bg-white/75" />
              </div>
            </div>
          </div>
        )}

        {feedback && (
          <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/70 bg-[#181c1b]/88 px-3 py-1.5 text-[10px] font-semibold text-white shadow-lg backdrop-blur">
            {feedback}
          </div>
        )}

        <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-white/82 px-2.5 py-1 text-[9px] font-semibold text-[#564338] backdrop-blur-md">
          <span className="material-symbols-outlined text-[13px] text-[#9a4600]">
            pets
          </span>
          秒喵
        </div>
      </div>

      {showControls && !inPomodoro && (
        <div className="mt-2.5 flex items-center gap-1 rounded-full border border-[#e8ebe7] bg-white/92 p-1 shadow-[0_4px_16px_rgba(44,48,46,0.05)]">
          {controls.map((control) => {
            const active = interactionMode === control.id;

            return (
              <button
                key={control.id}
                type="button"
                onClick={() => setInteractionMode(control.id)}
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
        href={LOTTIE_PAGE_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-1.5 text-[9px] text-[#8d918e] underline-offset-2 hover:underline"
      >
        Animation: Sara Proffit · LottieFiles
      </a>
    </div>
  );
};
