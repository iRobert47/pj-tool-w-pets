// 顯示 notice() 的提示條（放在最外層，任何畫面都看得到）
import React, { useEffect, useRef, useState } from 'react';
import { Animated, DeviceEventEmitter, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NOTICE } from '../lib/notice';
import { colors } from '../lib/theme';

export default function NoticeHost() {
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState<{ title: string; message?: string } | null>(null);
  const op = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(NOTICE, (m: { title: string; message?: string }) => {
      clearTimeout(timer.current);
      setMsg(m);
      op.setValue(0);
      Animated.timing(op, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(op, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setMsg(null));
      }, 2600);
    });
    return () => { sub.remove(); clearTimeout(timer.current); };
  }, [op]);
  if (!msg) return null;
  return (
    <Animated.View pointerEvents="none" style={[s.box, { top: insets.top + 10, opacity: op, transform: [{ translateY: op.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }]}>
      <Text style={s.title}>{msg.title}</Text>
      {msg.message ? <Text style={s.msg}>{msg.message}</Text> : null}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  box: { position: 'absolute', left: 20, right: 20, zIndex: 99, backgroundColor: colors.ink, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
  title: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  msg: { color: '#D9D9D9', fontSize: 13, marginTop: 2, lineHeight: 18 },
});
