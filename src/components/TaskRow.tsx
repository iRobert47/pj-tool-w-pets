import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../lib/theme';
import { hhmm, todayIso } from '../lib/dates';
import type { Task } from '../lib/api';

/** 一件事：左邊勾選（44pt 點擊範圍），點文字打開動作選單 */
export default function TaskRow({ task, color, onToggle, onOpen }: {
  task: Task; color: string; onToggle: () => void; onOpen: () => void;
}) {
  const done = !!task.done_at;
  const isEvent = task.kind === 'event';
  const hot = !done && (task.kind === 'deadline' || task.kind === 'milestone') && task.due_date === todayIso();
  let tag = '';
  if (task.start_at) tag = hhmm(task.start_at) + (task.end_at && !isEvent ? '–' + hhmm(task.end_at) : '');
  else if (task.due_at) tag = hhmm(task.due_at) + ' 前';
  else if (task.kind === 'deadline') tag = '截止';
  else if (task.kind === 'milestone') tag = '◆ 里程碑';
  const now = Date.now();
  const running = !done && task.start_at && task.end_at && new Date(task.start_at).getTime() <= now && now < new Date(task.end_at).getTime();

  return (
    <View style={s.row}>
      {isEvent ? (
        <View style={s.box} accessibilityElementsHidden>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
            <Rect x={3.5} y={5} width={17} height={15} rx={3} />
            <Path d="M3.5 10h17M8 3v4M16 3v4" />
          </Svg>
        </View>
      ) : (
        <Pressable onPress={onToggle} style={s.box} hitSlop={10} accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={`完成 ${task.title}`}>
          <View style={[s.check, { borderColor: done ? color : hot ? colors.due : '#C4C4C4', backgroundColor: done ? color : '#FFFFFF' }]}>
            {done ? (
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round"><Path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
            ) : null}
          </View>
        </Pressable>
      )}
      <Pressable onPress={onOpen} style={s.body}>
        <Text style={[s.title, done && s.done]} numberOfLines={1}>{task.title}</Text>
        {tag ? (
          <Text style={[s.tag, hot && s.tagHot, running && s.tagRun]}>{running ? '進行中・' + tag : tag}</Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48, borderBottomWidth: 1, borderBottomColor: colors.line },
  box: { width: 40, height: 44, justifyContent: 'center' },
  check: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.8, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  title: { flex: 1, fontSize: 15, color: colors.ink },
  done: { color: colors.muted, textDecorationLine: 'line-through' },
  tag: { fontSize: 12, color: colors.ink2, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, overflow: 'hidden', fontVariant: ['tabular-nums'] },
  tagHot: { color: colors.due, backgroundColor: colors.dueBg, fontWeight: '700' },
  tagRun: { color: '#FFFFFF', backgroundColor: colors.ink, fontWeight: '700' },
});
