// 03 專案：每個品牌的進度（完成比例、下一個截止），可以新增品牌
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notice } from '../../src/lib/notice';
import { colors } from '../../src/lib/theme';
import { addDays, relLabel, todayIso } from '../../src/lib/dates';
import { addProject, listProjects, listTasks } from '../../src/lib/api';
import { useData } from '../../src/lib/useData';
import { Button } from '../../src/components/ui';

const PALETTE = ['#FF7A59', '#5B7FA6', '#7FA578', '#8E6FA8', '#E0A526', '#3AA5A0', '#D9669A'];

export default function Projects() {
  const insets = useSafeAreaInsets();
  const today = todayIso();
  const { data } = useData(async () => {
    const [projects, tasks] = await Promise.all([listProjects(), listTasks(addDays(today, -60), addDays(today, 90))]);
    return { projects, tasks };
  }, [], 'projects');
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState<'all' | 'active' | 'attention'>('all');
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);

  async function create() {
    if (!name.trim()) return;
    try { await addProject(name.trim(), color); setName(''); setAdding(false); }
    catch (e) { notice('新增失敗', String(e)); }
  }

  return (
    <View style={[s.screen, { paddingTop: insets.top + 8 }]}>
      <View style={s.head}>
        <Text style={s.title}>專案</Text>
        <View style={s.headActions}>
          <Pressable style={s.iconButton} onPress={() => notice('搜尋', '專案搜尋功能準備中。')}><Text style={s.iconText}>⌕</Text></Pressable>
          <Pressable style={s.iconButton} onPress={() => notice('通知匣', '目前沒有新的專案通知。')}><Text style={s.iconText}>♢</Text></Pressable>
          <Pressable onPress={() => setAdding(!adding)} hitSlop={10}><Text style={s.add}>{adding ? '取消' : '＋'}</Text></Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <View style={s.tabs}>
          {([['all', '全部'], ['active', '進行中'], ['attention', '需要處理']] as const).map(([key, label]) => (
            <Pressable key={key} style={[s.tab, tab === key && s.tabOn]} onPress={() => setTab(key)}><Text style={[s.tabText, tab === key && s.tabTextOn]}>{label}</Text></Pressable>
          ))}
        </View>
        <View style={s.reviewBanner}>
          <View style={{ flex: 1 }}><Text style={s.reviewEyebrow}>WEEKLY REVIEW</Text><Text style={s.reviewTitle}>整理這週，讓下週更輕鬆</Text><Text style={s.reviewSub}>3 個專案有待確認的截止日</Text></View>
          <Pressable style={s.reviewButton} onPress={() => notice('週回顧', '週回顧流程準備中。')}><Text style={s.reviewButtonText}>開始 ›</Text></Pressable>
        </View>
        {adding ? (
          <View style={s.form}>
            <TextInput value={name} onChangeText={setName} placeholder="品牌／專案名稱" placeholderTextColor={colors.muted} style={s.input} autoFocus />
            <View style={s.palette}>
              {PALETTE.map((c) => <Pressable key={c} onPress={() => setColor(c)} style={[s.swatch, { backgroundColor: c }, color === c && s.swatchOn]} />)}
            </View>
            <Button label="建立" onPress={create} disabled={!name.trim()} />
          </View>
        ) : null}

        {(data?.projects ?? []).filter((p) => tab !== 'active' || p.status === 'active').map((p) => {
          const ts = (data?.tasks ?? []).filter((t) => t.project_id === p.id && t.kind !== 'event');
          const done = ts.filter((t) => t.done_at).length;
          const pct = ts.length ? Math.round((done / ts.length) * 100) : 0;
          const next = ts.filter((t) => !t.done_at && t.due_date && t.due_date >= today && ['deadline', 'milestone'].includes(t.kind)).sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))[0];
          const later = ts.filter((t) => !t.done_at && t.due_date && t.due_date >= today).length;
          if (tab === 'attention' && !next) return null;
          return (
            <View key={p.id} style={s.card}>
              <View style={s.cardHead}>
                <View style={[s.dot, { backgroundColor: p.color }]} />
                <Text style={s.name}>{p.name}</Text>
                <Text style={s.pct}>{pct}%</Text>
              </View>
              <View style={s.track}><View style={[s.fill, { width: `${pct}%`, backgroundColor: p.color }]} /></View>
              <Text style={s.meta}>完成 {done} / {ts.length}・還有 {later} 件排在後面</Text>
              {next ? (
                <View style={s.next}>
                  <Text style={s.nextLabel}>下一個{next.kind === 'milestone' ? '里程碑' : '截止'}</Text>
                  <Text style={s.nextTitle} numberOfLines={1}>{next.kind === 'milestone' ? '◆ ' : ''}{next.title}</Text>
                  <Text style={[s.nextDate, next.due_date! <= addDays(today, 1) && { color: colors.due }]}>{relLabel(next.due_date!)}</Text>
                </View>
              ) : null}
            </View>
          );
        })}
        {data && !data.projects.length && !adding ? <Text style={s.empty}>還沒有專案。按右上角「＋ 新品牌」開始。</Text> : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink },
  headActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  iconButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: colors.ink, fontSize: 20 },
  add: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', lineHeight: 34, fontSize: 22, fontWeight: '500', color: '#FFFFFF', backgroundColor: colors.ink },
  tabs: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  tab: { height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: colors.card, justifyContent: 'center' },
  tabOn: { backgroundColor: colors.ink },
  tabText: { color: colors.ink2, fontSize: 12.5, fontWeight: '600' },
  tabTextOn: { color: '#FFFFFF' },
  reviewBanner: { minHeight: 106, padding: 16, marginBottom: 18, borderRadius: 20, backgroundColor: '#F4EFE5', flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewEyebrow: { color: '#9A8160', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  reviewTitle: { color: colors.ink, fontSize: 15, fontWeight: '700', marginTop: 5 },
  reviewSub: { color: colors.ink3, fontSize: 11.5, marginTop: 4 },
  reviewButton: { height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: '#FFFFFF', justifyContent: 'center' },
  reviewButtonText: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  form: { gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.card, marginBottom: 14 },
  input: { height: 48, borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 14, fontSize: 16, color: colors.ink },
  palette: { flexDirection: 'row', gap: 10 },
  swatch: { width: 30, height: 30, borderRadius: 15 },
  swatchOn: { borderWidth: 3, borderColor: colors.ink },
  card: { borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 14, marginBottom: 12, backgroundColor: '#FFFFFF' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.ink },
  pct: { fontSize: 14, fontWeight: '700', color: colors.ink },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.card, marginTop: 10, overflow: 'hidden' },
  fill: { height: 6 },
  meta: { fontSize: 12, color: colors.ink3, marginTop: 8 },
  next: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line },
  nextLabel: { fontSize: 12, color: colors.ink3 },
  nextTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.ink },
  nextDate: { fontSize: 13, fontWeight: '700', color: colors.ink2 },
  empty: { fontSize: 14, color: colors.ink3, marginTop: 20 },
});
