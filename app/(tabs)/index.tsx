// 01 今天：週條、秒喵、專案進度、今天要做的事
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../src/lib/theme';
import { WEEKDAYS, addDays, fromIso, hhmm, todayIso, weekOf } from '../../src/lib/dates';
import { Project, Task, addTask, deleteTask, getPet, getProfile, listProjects, listTasks, moveTask, restoreTask, setDone, taskDay, updateTask } from '../../src/lib/api';
import { useData } from '../../src/lib/useData';
import WeekStrip from '../../src/components/WeekStrip';
import ProjectProgress from '../../src/components/ProjectProgress';
import TaskRow from '../../src/components/TaskRow';
import TaskSheet, { SheetAction } from '../../src/components/TaskSheet';
import Cat from '../../src/components/Cat';
import { Segmented, SectionTitle } from '../../src/components/ui';

const NO_PROJECT: Project = { id: '__none', name: '其他', short_name: '其他', aliases: [], color: '#A3A3A3', area: 'work', status: 'active', sort_order: 999, due_on: null };

export default function Today() {
  const insets = useSafeAreaInsets();
  const [day, setDay] = useState(todayIso());
  const [mode, setMode] = useState<'project' | 'time'>('project');
  const [adding, setAdding] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sel, setSel] = useState<Task | null>(null);
  const [toast, setToast] = useState<{ msg: string; undo?: () => void } | null>(null);
  const [purr, setPurr] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const today = todayIso();
  const week = weekOf(day);
  const { data } = useData(async () => {
    const [projects, tasks, profile, pet] = await Promise.all([
      listProjects(),
      listTasks(week[0] < today ? week[0] : today, addDays(today, 14) > week[6] ? addDays(today, 14) : week[6]),
      getProfile(),
      getPet(),
    ]);
    return { projects, tasks, profile, pet };
  }, [week[0]]);

  const projects = data?.projects ?? [];
  const tasks = data?.tasks ?? [];
  const byId = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);
  const projOf = (t: Task) => (t.project_id && byId[t.project_id]) || NO_PROJECT;

  const dayTasks = tasks.filter((t) => taskDay(t) === day);
  const openTasks = dayTasks.filter((t) => t.kind !== 'event');
  const doneCount = openTasks.filter((t) => t.done_at).length;

  const dots: Record<string, string[]> = {};
  tasks.forEach((t) => {
    const d = taskDay(t);
    if (!d || t.kind === 'event') return;
    (dots[d] ||= []).push(t.done_at ? '#D4D4D4' : projOf(t).color);
  });

  // 秒喵的一句話：下一件有時間的事
  const nowTs = Date.now();
  const next = tasks.filter((t) => t.start_at && !t.done_at && new Date(t.start_at).getTime() > nowTs).sort((a, b) => (a.start_at! < b.start_at! ? -1 : 1))[0];
  const petName = data?.pet?.name ?? '秒喵';
  const name = data?.profile?.display_name ?? '';
  const catLine = purr ? '呼嚕呼嚕……好，繼續。'
    : day !== today ? (day < today ? `這天你做完了 ${doneCount} 件。` : '這天先排好，到時候我提醒你。')
    : next ? `${hhmm(next.start_at)} 有「${next.title}」，先做手上的吧。`
    : openTasks.length && doneCount === openTasks.length ? `${name || '你'}，今天的都做完了！` : `${name ? name + '，' : ''}今天先挑一件小的開始。`;

  function flash(msg: string, undo?: () => void) {
    clearTimeout(toastTimer.current);
    setToast({ msg, undo });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  async function commitDraft(p: Project) {
    const v = draft.trim();
    if (!v) { setAdding(null); return; }
    setDraft('');
    await addTask({ title: v, projectId: p.id === '__none' ? null : p.id, area: p.area, date: day });
  }

  async function onAction(a: SheetAction) {
    const t = sel!;
    setSel(null);
    const before = { ...t };
    if (a === 'done') await setDone(t, !t.done_at);
    if (a === 'tomorrow') { await moveTask(t, addDays(taskDay(t) ?? today, 1)); flash(`「${t.title}」移到明天`, () => updateTask(t.id, pick(before))); }
    if (a === 'weekend') { const sat = weekOf(today)[6]; await moveTask(t, sat <= today ? addDays(sat, 7) : sat); flash(`「${t.title}」移到週六`, () => updateTask(t.id, pick(before))); }
    if (a === 'someday') { await updateTask(t.id, { kind: 'someday', due_date: null, due_at: null, start_at: null, end_at: null, remind_at: null }); flash(`「${t.title}」放到之後再說`, () => updateTask(t.id, pick(before))); }
    if (a === 'delete') { await deleteTask(t); flash(`已刪除「${t.title}」`, () => restoreTask(before)); }
    if (a === 'focus') router.push({ pathname: '/focus', params: { taskId: t.id, title: t.title, projectId: t.project_id ?? '' } });
  }

  // 分組
  const groups: { key: string; title: string; color: string; tint: string; project?: Project; items: Task[] }[] = [];
  if (mode === 'project') {
    const list = [...projects];
    if (dayTasks.some((t) => !t.project_id || !byId[t.project_id])) list.push(NO_PROJECT);
    list.forEach((p) => {
      const items = dayTasks.filter((t) => projOf(t).id === p.id).sort(sortTasks);
      groups.push({ key: p.id, title: p.name, color: p.color, tint: p.color + '22', project: p, items });
    });
  } else {
    const slot = (t: Task) => { const h = t.start_at ? new Date(t.start_at).getHours() : t.due_at ? new Date(t.due_at).getHours() : -1; return h < 0 ? 'any' : h < 12 ? 'am' : h < 18 ? 'pm' : 'eve'; };
    ([['any', '隨時'], ['am', '上午'], ['pm', '下午'], ['eve', '晚上']] as const).forEach(([k, label]) => {
      const items = dayTasks.filter((t) => slot(t) === k).sort(sortTasks);
      if (items.length) groups.push({ key: k, title: label, color: colors.ink2, tint: colors.card, items });
    });
  }

  const d = fromIso(day);
  return (
    <View style={[s.screen, { paddingTop: insets.top + 8 }]}>
      <View style={s.header}>
        <View>
          <Text style={s.month}>{d.getMonth() + 1} 月</Text>
          <Text style={s.sub}>{day === today ? '今天' : `${d.getMonth() + 1} 月 ${d.getDate()} 日`}・星期{WEEKDAYS[d.getDay()]}</Text>
        </View>
        <Pressable onPress={() => router.push('/focus')} style={s.focusPill} accessibilityLabel="開始專注">
          <Text style={s.focusText}>◷ 專注</Text>
        </Pressable>
      </View>
      <WeekStrip selected={day} onSelect={(x) => { setDay(x); setAdding(null); }} dots={dots} />

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.catCard}>
          <Cat size={70} happy={purr} onPress={() => { setPurr(true); setTimeout(() => setPurr(false), 1600); }} />
          <View style={{ flex: 1 }}>
            <Text style={s.catLine}>{catLine}</Text>
            <Text style={s.catSub}>{petName}{next && day === today ? `・下一件 ${hhmm(next.start_at)}` : ''}</Text>
          </View>
        </View>

        <View style={{ marginTop: 18 }}>
          <SectionTitle title="專案進度" sub="接下來的截止" right={<Pressable onPress={() => router.push('/calendar')} hitSlop={8}><Text style={s.link}>整週 ›</Text></Pressable>} />
          <View style={{ marginTop: 6 }}>
            {projects.length ? <ProjectProgress projects={projects} tasks={tasks} onPressProject={() => router.push('/projects')} />
              : <Text style={s.empty}>還沒有專案。到「專案」頁新增第一個品牌。</Text>}
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <SectionTitle title={day === today ? '今天要做的事' : `${d.getMonth() + 1}/${d.getDate()} 要做的事`} />
          <View style={s.toolbar}>
            <Text style={s.count}><Text style={s.countNum}>{doneCount}</Text> / {openTasks.length} 完成</Text>
            <Segmented value={mode} onChange={setMode} options={[['project', '依專案'], ['time', '依時段']]} />
          </View>

          {groups.map((g) => (
            <View key={g.key} style={{ marginTop: 10 }}>
              <View style={s.groupHead}>
                <View style={[s.groupChip, { backgroundColor: g.tint }]}><View style={[s.dot, { backgroundColor: g.color }]} /><Text style={s.groupTitle}>{g.title}</Text></View>
                {g.project ? (
                  <Pressable onPress={() => { setAdding(g.key); setDraft(''); }} hitSlop={10} style={s.plus} accessibilityLabel={`新增到${g.title}`}><Text style={s.plusText}>+</Text></Pressable>
                ) : null}
                <Text style={s.groupMeta}>{g.items.filter((t) => t.kind !== 'event' && !t.done_at).length ? `剩 ${g.items.filter((t) => t.kind !== 'event' && !t.done_at).length} 件` : g.items.length ? '都完成了' : ''}</Text>
              </View>
              {g.items.map((t) => (
                <TaskRow key={t.id} task={t} color={projOf(t).color} onToggle={() => setDone(t, !t.done_at)} onOpen={() => setSel(t)} />
              ))}
              {adding === g.key && g.project ? (
                <View style={[s.addRow, { borderBottomColor: g.color }]}>
                  <View style={s.addBox} />
                  <TextInput
                    autoFocus value={draft} onChangeText={setDraft} placeholder="輸入後按完成" placeholderTextColor={colors.muted}
                    style={s.addInput} returnKeyType="done" blurOnSubmit={false}
                    onSubmitEditing={() => commitDraft(g.project!)} onBlur={() => { if (!draft.trim()) setAdding(null); }}
                  />
                  <Pressable onPress={() => commitDraft(g.project!)} style={s.addBtn}><Text style={s.addBtnText}>加入</Text></Pressable>
                </View>
              ) : null}
            </View>
          ))}
          {groups.length === 0 ? <Text style={s.empty}>這天還沒有事。按下面的 ＋ 用一句話加。</Text> : null}
        </View>
      </ScrollView>

      {toast ? (
        <Animated.View style={s.toast}>
          <Text style={s.toastText} numberOfLines={1}>{toast.msg}</Text>
          {toast.undo ? <Pressable onPress={() => { toast.undo!(); setToast(null); }} hitSlop={8}><Text style={s.undo}>復原</Text></Pressable> : null}
        </Animated.View>
      ) : null}

      <TaskSheet task={sel} projectName={sel ? projOf(sel).name : ''} color={sel ? projOf(sel).color : colors.ink} onClose={() => setSel(null)} onAction={onAction} />
    </View>
  );
}

function sortTasks(a: Task, b: Task) {
  const ad = a.done_at ? 1 : 0, bd = b.done_at ? 1 : 0;
  if (ad !== bd) return ad - bd;
  const at = a.start_at ?? a.due_at ?? '9', bt = b.start_at ?? b.due_at ?? '9';
  return at < bt ? -1 : at > bt ? 1 : 0;
}

function pick(t: Task): Partial<Task> {
  return { kind: t.kind, due_date: t.due_date, due_at: t.due_at, start_at: t.start_at, end_at: t.end_at, remind_at: t.remind_at, postponed_count: t.postponed_count };
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  month: { fontSize: 24, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 13, color: colors.ink2, marginTop: 2 },
  focusPill: { height: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: colors.ink, justifyContent: 'center' },
  focusText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  content: { paddingHorizontal: 20, paddingBottom: 120 },
  catCard: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, padding: 8, paddingRight: 14, borderRadius: 16, backgroundColor: colors.card },
  catLine: { fontSize: 14, fontWeight: '600', color: colors.ink, lineHeight: 20 },
  catSub: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  link: { fontSize: 13, color: colors.ink2 },
  empty: { fontSize: 14, color: colors.ink3, paddingVertical: 16, lineHeight: 21 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  count: { fontSize: 13, color: colors.ink2 },
  countNum: { fontSize: 16, fontWeight: '700', color: colors.ink },
  groupHead: { flexDirection: 'row', alignItems: 'center', height: 38 },
  groupChip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 26, paddingHorizontal: 10, borderRadius: 13 },
  groupTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  dot: { width: 7, height: 7, borderRadius: 4 },
  plus: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  plusText: { fontSize: 22, color: colors.ink3 },
  groupMeta: { marginLeft: 'auto', fontSize: 12, color: colors.muted },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, borderBottomWidth: 1.5 },
  addBox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.8, borderStyle: 'dashed', borderColor: '#C4C4C4', marginLeft: 0, marginRight: 8 },
  addInput: { flex: 1, fontSize: 15, color: colors.ink, height: 44 },
  addBtn: { height: 34, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.ink, justifyContent: 'center' },
  addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  toast: { position: 'absolute', left: 20, right: 20, bottom: 100, height: 50, borderRadius: 14, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  toastText: { flex: 1, color: '#FFFFFF', fontSize: 14 },
  undo: { color: colors.toastAccent, fontSize: 14, fontWeight: '700' },
});
