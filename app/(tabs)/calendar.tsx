// 02 行事曆：一週的行程（依日期），或日期 × 品牌的截止表（依品牌）；下面是「之後再說」
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/lib/theme';
import { addDays, fromIso, hhmm, relLabel, shortLabel, todayIso, weekOf } from '../../src/lib/dates';
import { Task, listProjects, listSomeday, listTasks, moveTask, setDone, taskDay } from '../../src/lib/api';
import { useData } from '../../src/lib/useData';
import { Segmented } from '../../src/components/ui';

export default function Calendar() {
  const insets = useSafeAreaInsets();
  const [anchor, setAnchor] = useState(todayIso());
  const [view, setView] = useState<'date' | 'brand'>('date');
  const days = weekOf(anchor);
  const { data } = useData(async () => {
    const [projects, tasks, someday] = await Promise.all([listProjects(), listTasks(days[0], days[6]), listSomeday()]);
    return { projects, tasks, someday };
  }, [days[0]], 'calendar');
  const projects = data?.projects ?? [];
  const tasks = data?.tasks ?? [];
  const byId = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);
  const colorOf = (t: Task) => (t.project_id && byId[t.project_id]?.color) || '#A3A3A3';
  const today = todayIso();
  const title = `${fromIso(days[0]).getMonth() + 1}/${fromIso(days[0]).getDate()} – ${fromIso(days[6]).getMonth() + 1}/${fromIso(days[6]).getDate()}`;

  return (
    <View style={[s.screen, { paddingTop: insets.top + 8 }]}>
      <View style={s.head}>
        <Pressable onPress={() => setAnchor(addDays(anchor, -7))} hitSlop={10}><Text style={s.arrow}>‹</Text></Pressable>
        <Pressable onPress={() => setAnchor(todayIso())}><Text style={s.title}>{title}</Text></Pressable>
        <Pressable onPress={() => setAnchor(addDays(anchor, 7))} hitSlop={10}><Text style={s.arrow}>›</Text></Pressable>
        <View style={{ marginLeft: 'auto' }}><Segmented value={view} onChange={setView} options={[['date', '依日期'], ['brand', '依品牌']]} /></View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        {view === 'date' ? days.map((d) => {
          const items = tasks.filter((t) => taskDay(t) === d).sort((a, b) => ((a.start_at ?? a.due_at ?? 'z') < (b.start_at ?? b.due_at ?? 'z') ? -1 : 1));
          return (
            <View key={d} style={s.day}>
              <Text style={[s.dayTitle, d === today && { color: colors.due }]}>{relLabel(d)}{d === today ? '' : ''}  <Text style={s.dayCount}>{items.length ? `${items.length} 件` : ''}</Text></Text>
              {items.map((t) => (
                <Pressable key={t.id} onPress={() => t.kind !== 'event' && setDone(t, !t.done_at)} style={s.item}>
                  <View style={[s.bar, { backgroundColor: colorOf(t) }]} />
                  <Text style={s.time}>{t.start_at ? hhmm(t.start_at) : t.due_at ? hhmm(t.due_at) + '前' : t.kind === 'milestone' ? '◆' : ''}</Text>
                  <Text style={[s.itemTitle, t.done_at && s.done]} numberOfLines={1}>{t.title}</Text>
                  {t.kind === 'deadline' ? <Text style={s.badge}>截止</Text> : null}
                </Pressable>
              ))}
            </View>
          );
        }) : (
          <View style={{ marginTop: 10 }}>
            <View style={s.gridHead}>
              <View style={s.gridDate} />
              {projects.map((p) => <Text key={p.id} style={[s.gridProj, { color: p.color }]} numberOfLines={1}>{p.short_name || p.name}</Text>)}
            </View>
            {days.map((d) => (
              <View key={d} style={[s.gridRow, d === today && { backgroundColor: colors.dueBg }]}>
                <Text style={s.gridDate}>{shortLabel(d)}</Text>
                {projects.map((p) => {
                  const ds = tasks.filter((t) => t.project_id === p.id && t.due_date === d && ['deadline', 'milestone', 'day_task'].includes(t.kind));
                  return (
                    <View key={p.id} style={s.gridCell}>
                      {ds.map((t) => <Text key={t.id} style={[s.cellText, t.done_at && s.done]} numberOfLines={2}>{t.kind === 'milestone' ? '◆ ' : ''}{t.title}</Text>)}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        <View style={{ marginTop: 26 }}>
          <Text style={s.dayTitle}>之後再說 <Text style={s.dayCount}>{data?.someday.length ?? 0} 件</Text></Text>
          {(data?.someday ?? []).map((t) => (
            <View key={t.id} style={s.item}>
              <View style={[s.bar, { backgroundColor: colorOf(t) }]} />
              <Text style={[s.itemTitle, { marginLeft: 8 }]} numberOfLines={1}>{t.title}</Text>
              <Pressable onPress={() => moveTask(t, today)} style={s.small}><Text style={s.smallText}>排到今天</Text></Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 6 },
  arrow: { fontSize: 26, color: colors.ink2, width: 20, textAlign: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.ink },
  day: { marginTop: 18 },
  dayTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  dayCount: { fontSize: 12, fontWeight: '400', color: colors.ink3 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, borderBottomWidth: 1, borderBottomColor: colors.line },
  bar: { width: 4, height: 24, borderRadius: 2 },
  time: { width: 56, fontSize: 12, color: colors.ink2, fontVariant: ['tabular-nums'] },
  itemTitle: { flex: 1, fontSize: 15, color: colors.ink },
  done: { color: colors.muted, textDecorationLine: 'line-through' },
  badge: { fontSize: 11, fontWeight: '700', color: colors.due },
  small: { height: 30, paddingHorizontal: 10, borderRadius: 8, backgroundColor: colors.card, justifyContent: 'center' },
  smallText: { fontSize: 12, fontWeight: '600', color: colors.ink },
  gridHead: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: colors.ink, paddingBottom: 6 },
  gridRow: { flexDirection: 'row', minHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 6 },
  gridDate: { width: 54, fontSize: 12, color: colors.ink2, fontWeight: '600' },
  gridProj: { flex: 1, fontSize: 12, fontWeight: '700', paddingHorizontal: 3 },
  gridCell: { flex: 1, paddingHorizontal: 3, gap: 3 },
  cellText: { fontSize: 11.5, color: colors.ink, lineHeight: 15 },
});
