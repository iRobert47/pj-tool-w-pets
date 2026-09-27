import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';
import { hhmm, localDateOf, relLabel } from '../lib/dates';
import type { Task } from '../lib/api';

export type SheetAction = 'done' | 'tomorrow' | 'weekend' | 'focus' | 'someday' | 'delete';

/** 點一下任務跳出的選單 */
export default function TaskSheet({ task, projectName, color, onClose, onAction }: {
  task: Task | null; projectName: string; color: string; onClose: () => void; onAction: (a: SheetAction) => void;
}) {
  if (!task) return null;
  const done = !!task.done_at;
  const isEvent = task.kind === 'event';
  const when = task.start_at
    ? `${relLabel(localDateOf(task.start_at))} ${hhmm(task.start_at)}${task.end_at ? '–' + hhmm(task.end_at) : ''}`
    : task.due_date ? `${relLabel(task.due_date)}${task.due_at ? ' ' + hhmm(task.due_at) + ' 前' : ''}` : '沒排時間';
  const actions: { k: SheetAction; icon: string; label: string; primary?: boolean; danger?: boolean }[] = [
    ...(isEvent ? [] : [{ k: 'done' as const, icon: done ? '↺' : '✓', label: done ? '取消完成' : '完成', primary: true }]),
    { k: 'tomorrow', icon: '→', label: '明天做' },
    { k: 'weekend', icon: '⇥', label: '這週末' },
    ...(isEvent ? [] : [{ k: 'focus' as const, icon: '◷', label: '開始專注' }]),
    { k: 'someday', icon: '…', label: '之後再說' },
    { k: 'delete', icon: '✕', label: '刪除', danger: true },
  ];
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable style={s.dim} onPress={onClose} accessibilityLabel="關閉" />
      <View style={s.sheet}>
        <View style={s.grab} />
        <View style={s.meta}><View style={[s.dot, { backgroundColor: color }]} /><Text style={s.metaText}>{projectName}</Text></View>
        <Text style={s.title}>{task.title}</Text>
        <Text style={s.when}>{when}</Text>
        <View style={s.grid}>
          {actions.map((a) => (
            <Pressable key={a.k} onPress={() => onAction(a.k)} style={({ pressed }) => [s.act, a.primary && s.actPrimary, pressed && { opacity: 0.75 }]}>
              <Text style={[s.icon, a.primary && { color: '#FFFFFF' }, a.danger && { color: colors.due }]}>{a.icon}</Text>
              <Text style={[s.label, a.primary && { color: '#FFFFFF' }, a.danger && { color: colors.due }]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(17,17,17,0.32)' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 34 },
  grab: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D8D8D8', alignSelf: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  metaText: { fontSize: 12, color: colors.ink3 },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: 4 },
  when: { fontSize: 13, color: colors.ink2, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  act: { width: '31.5%', height: 72, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', gap: 6 },
  actPrimary: { backgroundColor: colors.ink },
  icon: { fontSize: 18, color: colors.ink },
  label: { fontSize: 13, fontWeight: '600', color: colors.ink },
});
