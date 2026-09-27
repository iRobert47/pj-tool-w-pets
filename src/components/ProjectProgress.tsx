import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';
import { diffDays, hhmm, relLabel, todayIso } from '../lib/dates';
import type { Project, Task } from '../lib/api';

/** 首頁「專案進度」：每個品牌一列，列出最近的截止（今天、明天橘底） */
export default function ProjectProgress({ projects, tasks, onPressProject, onPressItem, onAdd }: {
  projects: Project[]; tasks: Task[]; onPressProject?: (p: Project) => void;
  onPressItem?: (t: Task, p: Project) => void;   // 點截止 → 編輯
  onAdd?: (p: Project) => void;                  // 列尾的 ＋ → 新增
}) {
  const today = todayIso();
  const DUE_KINDS = ['deadline', 'milestone', 'day_task'];
  return (
    <View style={s.card}>
      {projects.map((p, i) => {
        const ds = tasks
          .filter((t) => t.project_id === p.id && !t.done_at && t.due_date && t.due_date >= today && DUE_KINDS.includes(t.kind))
          .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1));
        const thisWeek = ds.filter((t) => diffDays(t.due_date!, today) <= 6).length;
        return (
          <View key={p.id} style={[s.row, i > 0 && s.rowLine]} accessibilityLabel={`${p.name}，${ds.length} 個截止`}>
            <View style={[s.bar, { backgroundColor: p.color }]} />
            <Pressable style={s.name} onPress={() => onPressProject?.(p)}>
              <Text style={s.nameText} numberOfLines={1}>{p.short_name || p.name}</Text>
              <Text style={s.count}>{thisWeek ? `本週 ${thisWeek} 件` : '本週沒有'}</Text>
            </Pressable>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, alignItems: 'center' }}>
              {ds.length === 0 ? <Text style={s.none}>近兩週沒有截止</Text> : null}
              {ds.slice(0, 6).map((t) => {
                const n = diffDays(t.due_date!, today);
                const hot = n <= 1;
                return (
                  <Pressable key={t.id} onPress={() => onPressItem?.(t, p)} style={({ pressed }) => [s.item, { backgroundColor: hot ? colors.dueBg : colors.card, opacity: pressed ? 0.7 : 1 }]} accessibilityLabel={`編輯 ${t.title}`}>
                    <Text style={[s.date, { color: hot ? colors.due : n <= 3 ? colors.ink : colors.ink3 }]}>
                      {relLabel(t.due_date!, today)}{t.due_at ? ' ' + hhmm(t.due_at) : ''}
                    </Text>
                    <Text style={s.title} numberOfLines={1}>{t.kind === 'milestone' ? '◆ ' : ''}{t.title}</Text>
                  </Pressable>
                );
              })}
              {onAdd ? (
                <Pressable onPress={() => onAdd(p)} style={s.add} accessibilityLabel={`新增${p.name}的截止`} hitSlop={6}>
                  <Text style={s.addText}>＋</Text>
                </Pressable>
              ) : null}
            </ScrollView>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 60, paddingHorizontal: 12, paddingVertical: 8 },
  rowLine: { borderTopWidth: 1, borderTopColor: colors.line },
  bar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  name: { width: 72 },
  nameText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  count: { fontSize: 11, color: colors.ink3, marginTop: 1 },
  none: { fontSize: 12, color: colors.muted },
  add: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: '#C9C9C9', alignItems: 'center', justifyContent: 'center' },
  addText: { fontSize: 17, color: colors.ink3, lineHeight: 19 },
  item: { borderRadius: 9, paddingHorizontal: 8, paddingVertical: 4, maxWidth: 130 },
  date: { fontSize: 11, fontWeight: '700' },
  title: { fontSize: 12, color: colors.ink },
});
