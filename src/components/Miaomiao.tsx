import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import Cat from './Cat';

export type MiaomiaoAction = 'idle' | 'pet' | 'feed' | 'play';

const WEB_FRAMES: Record<MiaomiaoAction, { src: string; duration: number }[]> = {
  idle: [{ src: '/pets/miaomiao_01_sit_idle_side.svg', duration: 2400 }],
  pet: [
    { src: '/pets/miaomiao_02_stand_up.svg', duration: 180 },
    { src: '/pets/miaomiao_A1_pet.svg', duration: 1100 },
    { src: '/pets/miaomiao_C4_mood_up.svg', duration: 700 },
    { src: '/pets/miaomiao_07_sit_down.svg', duration: 260 },
  ],
  feed: [
    { src: '/pets/miaomiao_02_stand_up.svg', duration: 180 },
    { src: '/pets/miaomiao_C1_sniff.svg', duration: 550 },
    { src: '/pets/miaomiao_C2_approach.svg', duration: 450 },
    { src: '/pets/miaomiao_C3_eat.svg', duration: 900 },
    { src: '/pets/miaomiao_C4_mood_up.svg', duration: 650 },
    { src: '/pets/miaomiao_07_sit_down.svg', duration: 260 },
  ],
  play: [
    { src: '/pets/miaomiao_02_stand_up.svg', duration: 180 },
    { src: '/pets/miaomiao_B1_gaze_lock.svg', duration: 700 },
    { src: '/pets/miaomiao_B2_swipe.svg', duration: 650 },
    { src: '/pets/miaomiao_06_turn.svg', duration: 320 },
    { src: '/pets/miaomiao_07_sit_down.svg', duration: 260 },
  ],
};

const ALL_WEB_SOURCES = [...new Set(Object.values(WEB_FRAMES).flat().map((frame) => frame.src))];

export default function Miaomiao({
  size = 220,
  action = 'idle',
  actionKey = 0,
  onPress,
  onActionComplete,
}: {
  size?: number;
  action?: MiaomiaoAction;
  actionKey?: number;
  onPress?: () => void;
  onActionComplete?: () => void;
}) {
  const [frame, setFrame] = useState(0);
  const breathe = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const completeRef = useRef(onActionComplete);
  const sequence = useMemo(() => WEB_FRAMES[action], [action]);

  useEffect(() => {
    completeRef.current = onActionComplete;
  }, [onActionComplete]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    ALL_WEB_SOURCES.forEach((src) => { void Image.prefetch(src); });
  }, []);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  useEffect(() => {
    setFrame(0);
    if (action === 'idle') return;
    if (Platform.OS !== 'web') {
      const nativeTimer = setTimeout(() => completeRef.current?.(), 900);
      return () => clearTimeout(nativeTimer);
    }
    let index = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const advance = () => {
      timer = setTimeout(() => {
        if (cancelled) return;
        index += 1;
        if (index >= sequence.length) {
          completeRef.current?.();
          return;
        }
        Animated.timing(fade, { toValue: 0, duration: 75, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(({ finished }) => {
          if (!finished || cancelled) return;
          setFrame(index);
          requestAnimationFrame(() => {
            Animated.timing(fade, { toValue: 1, duration: 125, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(({ finished: entered }) => {
              if (entered && !cancelled) advance();
            });
          });
        });
      }, sequence[index].duration);
    };
    advance();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      fade.stopAnimation();
      fade.setValue(1);
    };
  }, [action, actionKey, fade, sequence]);

  if (Platform.OS !== 'web') {
    return <Cat size={size} happy={action !== 'idle'} onPress={onPress} />;
  }

  const scaleY = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.018] });
  const activeFrame = sequence[Math.min(frame, sequence.length - 1)];
  return (
    <Pressable accessibilityLabel="和秒喵互動" onPress={onPress} hitSlop={10}>
      <Animated.View style={[styles.stage, { width: size, height: size, opacity: fade, transform: [{ scaleY }] }]}>
        <Image source={{ uri: activeFrame.src }} resizeMode="contain" style={{ width: size, height: size }} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
