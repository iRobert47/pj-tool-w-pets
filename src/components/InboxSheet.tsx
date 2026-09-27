// 通知匣（設計稿：從上方掉下來的面板）：接下來、秒喵、成就
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';

export type InboxItem = { id: string; section: '接下來' | '秒喵' | '成就'; title: string; sub: string; tint: string; action?: { label: string; onPress: () => void } };

export default function InboxSheet({ open, items, onClose, topInset }: { open: boolean; items: InboxItem[]; onClose: () => void; topInset: number }) {
  const y = useRef(new Animated.Value(-40)).current;
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!open) return;
    y.setValue(-40); op.setValue(0);
    Animated.parallel([
      Animated.spring(y, { toValue: 0, friction: 9, tension: 80, useNativeDriver: true }),
      Animated.timing(op, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [open, y, op]);
  const sections = (['接下來', '秒喵', '成就'] as const).map((sec) => ({ sec, list: items.filter((i) => i.section === sec) })).filter((x) => x.list.length);

  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.dim} onPress={onClose} accessibilityLabel="關閉通知匣" />
      <Animated.View style={[s.panel, { paddingTop: topInset + 12, opacity: op, transform: [{ translateY: y }] }]}>
        <View style={s.head}>
          <Text style={s.title}>通知匣</Text>
          <Pressable onPress={onClose} hitSlop={10} style={s.close}><Text style={s.closeText}>✕</Text></Pressable>
        </View>
        <ScrollView style={{ maxHeight: 460 }}>
          {sections.length === 0 ? <Text style={s.empty}>目前沒有新的通知。</Text> : null}
          {sections.map(({ sec, list }) => (
            <View key={sec}>
              <Text style={s.sec}>{sec}</Text>
              {list.map((it, i) => (
                <View key={it.id} style={[s.row, i < list.length - 1 && s.line]}>
                  <View style={[s.dotBox, { backgroundColor: it.tint }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemTitle} numberOfLines={1}>{it.title}</Text>
                    <Text style={s.itemSub} numberOfLines={1}>{it.sub}</Text>
                  </View>
                  {it.action ? (
                    <Pressable onPress={() => { onClose(); it.action!.onPress(); }} style={s.act}><Text style={s.actText}>{it.action.label}</Text></Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
        <View style={s.grab} />
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,17,17,0.3)' },
  panel: { position: 'absolute', left: 0, right: 0, top: 0, backgroundColor: '#FFFFFF', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingHorizontal: 20, paddingBottom: 12, shadowColor: '#28190A', shadowOpacity: 0.22, shadowRadius: 25, shadowOffset: { width: 0, height: 20 }, elevation: 10 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 18, color: colors.ink2 },
  sec: { fontSize: 12, fontWeight: '700', letterSpacing: 0.7, color: colors.ink3, marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  line: { borderBottomWidth: 1, borderBottomColor: colors.line },
  dotBox: { width: 36, height: 36, borderRadius: 10 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  itemSub: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  act: { height: 36, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: '#CBCBCB', justifyContent: 'center' },
  actText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  empty: { fontSize: 14, color: colors.ink3, paddingVertical: 20 },
  grab: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D8D8D8', alignSelf: 'center', marginTop: 6 },
});
