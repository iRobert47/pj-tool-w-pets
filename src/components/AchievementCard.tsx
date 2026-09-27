// 成就卡（設計稿：置中卡片＋輕遮罩）
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';
import Cat from './Cat';

export default function AchievementCard({ open, title, body, onClose, onGo }: { open: boolean; title: string; body: string; onClose: () => void; onGo: () => void }) {
  const sc = useRef(new Animated.Value(0.86)).current;
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!open) return;
    sc.setValue(0.86); op.setValue(0);
    Animated.parallel([
      Animated.spring(sc, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
      Animated.timing(op, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [open, sc, op]);
  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
      <View style={s.dim}>
        <Animated.View accessibilityRole="alert" style={[s.card, { opacity: op, transform: [{ scale: sc }] }]}>
          <Text style={s.eyebrow}>成就達成</Text>
          <View style={s.halo}><Cat size={150} happy={open} /></View>
          <Text style={s.title}>{title}</Text>
          <Text style={s.body}>{body}</Text>
          <Pressable onPress={onGo} style={s.primary}><Text style={s.primaryText}>去看牠</Text></Pressable>
          <Pressable onPress={onClose} style={s.ghost}><Text style={s.ghostText}>收進通知匣</Text></Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(17,17,17,0.32)', justifyContent: 'center', paddingHorizontal: 30 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 28, paddingTop: 22, paddingHorizontal: 22, paddingBottom: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30, shadowOffset: { width: 0, height: 24 }, elevation: 12 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1.4, color: colors.ink },
  halo: { marginTop: 8, width: 160, height: 150, alignItems: 'center', justifyContent: 'center', borderRadius: 80, backgroundColor: colors.dueBg },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink, marginTop: 8 },
  body: { fontSize: 14, lineHeight: 22, color: colors.ink2, marginTop: 6, textAlign: 'center' },
  primary: { alignSelf: 'stretch', height: 48, borderRadius: 24, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  ghost: { alignSelf: 'stretch', height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  ghostText: { color: colors.ink2, fontSize: 14 },
});
