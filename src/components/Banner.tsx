// 頂部提醒橫幅（設計稿：下一小時行程／截止快到了）。滑下來、6 秒後自己收進通知匣。
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../lib/theme';

export type BannerAction = { label: string; onPress: () => void; primary?: boolean };

export default function Banner({ kind, eyebrow, right, title, body, actions, onAutoHide, top }: {
  kind: 'meeting' | 'due';
  eyebrow: string; right: string; title: string; body: string;
  actions: BannerAction[];
  onAutoHide: () => void;
  top: number;
}) {
  const y = useRef(new Animated.Value(-30)).current;
  const op = useRef(new Animated.Value(0)).current;
  const hideRef = useRef(onAutoHide);
  hideRef.current = onAutoHide;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(y, { toValue: 0, friction: 8, tension: 90, useNativeDriver: true }),
      Animated.timing(op, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(y, { toValue: -20, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(op, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start(() => hideRef.current());
    }, 6000);
    return () => clearTimeout(t);
  }, [y, op]);

  return (
    <Animated.View accessibilityRole="alert" style={[s.card, { top, opacity: op, transform: [{ translateY: y }] }]}>
      <View style={[s.icon, { backgroundColor: kind === 'meeting' ? '#E6EEF6' : colors.dueBg }]}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={kind === 'meeting' ? '#4A6B90' : colors.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          {kind === 'meeting'
            ? <><Rect x={3.5} y={5} width={17} height={15} rx={3} /><Path d="M3.5 10h17M8 3v4M16 3v4" /></>
            : <><Path d="M12 7v5l3 2" /><Path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" /></>}
        </Svg>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={s.row}><Text style={[s.eyebrow, kind === 'due' && { color: colors.ink, fontWeight: '600' }]}>{eyebrow}</Text><Text style={s.right}>{right}</Text></View>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        <Text style={s.body}>{body}</Text>
        <View style={s.actions}>
          {actions.map((a) => (
            <Pressable key={a.label} onPress={a.onPress} style={a.primary ? s.primary : s.ghost}>
              <Text style={a.primary ? s.primaryText : s.ghostText}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: { position: 'absolute', left: 12, right: 12, zIndex: 20, flexDirection: 'row', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 20, paddingTop: 14, paddingHorizontal: 14, paddingBottom: 12, shadowColor: '#3C280A', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 14 }, elevation: 8 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { fontSize: 12, color: colors.ink3 },
  right: { fontSize: 12, color: colors.ink3 },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 2 },
  body: { fontSize: 13, lineHeight: 19, color: colors.ink2, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  primary: { height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.ink, justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  ghost: { height: 40, paddingHorizontal: 10, justifyContent: 'center' },
  ghostText: { color: colors.ink2, fontSize: 13, fontWeight: '600' },
});
