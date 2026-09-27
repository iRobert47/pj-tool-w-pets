// 01 今天：週條、秒喵、專案進度、今天要做的事
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../src/lib/theme';
import { WEEKDAYS, addDays, atTime, fromIso, hhmm, todayIso, weekOf } from '../../src/lib/dates';
import { Project, Task, addProject, addTask, deleteTask, getPet, getProfile, listProjects, listTasks, moveFields, moveTask, restoreTask, setDone, taskDay, updateTask } from '../../src/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Banner from '../../src/components/Banner';
import InboxSheet, { InboxItem } from '../../src/components/InboxSheet';
import AchievementCard from '../../src/components/AchievementCard';
import DeadlineSheet, { DeadlineDraft } from '../../src/components/DeadlineSheet';
import { useData } from '../../src/lib/useData';
import WeekStrip from '../../src/components/WeekStrip';
import ProjectProgress from '../../src/components/ProjectProgress';
import ProjectSheet from '../../src/components/ProjectSheet';
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
  const [inboxOpen, setInboxOpen] = useState(false);
  const [seen, setSeen] = useState(0);            // 打開通知匣時看過的數量
  const [dismissed, setDismissed] = useState<Record<string, true>>({});
  const [achv, setAchv] = useState(false);
  const [newProject, setNewProject] = useState(false);
  const [editDue, setEditDue] = useState<{ project: Project; task: Task | null } | null>(null);
  const [clock, setClock] = useState(Date.now());

  const today = todayIso();
  const week = weekOf(day);
  const { data, setData, reload } = useData(async () => {
    const [projects, tasks, profile, pet] = await Promise.all([
      listProjects(),
      listTasks(week[0] < today ? week[0] : today, addDays(today, 14) > week[6] ? addDays(today, 14) : week[6]),
      getProfile(),
      getPet(),
    ]);
    return { projects, tasks, profile, pet };
  }, [week[0]], 'today');

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

  // 每分鐘更新一次「現在」，讓提醒橫幅準時出現
  useEffect(() => { const t = setInterval(() => setClock(Date.now()), 60000); return () => clearInterval(t); }, []);

  // 先改畫面、再存資料庫：勾選／移動／刪除不用等伺服器
  function patchLocal(id: string, patch: Partial<Task> | null) {
    setData((prev) => prev && ({ ...prev, tasks: patch ? prev.tasks.map((x) => (x.id === id ? { ...x, ...patch } : x)) : prev.tasks.filter((x) => x.id !== id) }));
  }
  function insertLocal(t: Task) {
    setData((prev) => prev && ({ ...prev, tasks: [...prev.tasks, t] }));
  }
  function save(p: Promise<unknown>) {
    p.catch(() => { flash('沒存到，已經還原'); reload(); });
  }
  function toggle(t: Task) {
    patchLocal(t.id, { done_at: t.done_at ? null : new Date().toISOString() });
    save(setDone(t, !t.done_at));
  }

  // 提醒橫幅：60 分鐘內開始的行程、60 分鐘內到期的截止（按「我知道了」就不再跳）
  const todayKey = 'dismissed:' + today;
  useEffect(() => { AsyncStorage.getItem(todayKey).then((v) => { if (v) setDismissed(JSON.parse(v)); }).catch(() => {}); }, [todayKey]);
  function dismiss(id: string) {
    setDismissed((prev) => { const next = { ...prev, [id]: true as const }; AsyncStorage.setItem(todayKey, JSON.stringify(next)).catch(() => {}); return next; });
  }
  const soon = (ts: string | null) => ts != null && new Date(ts).getTime() - clock > 0 && new Date(ts).getTime() - clock <= 60 * 60000;
  const minsTo = (ts: string) => Math.max(1, Math.round((new Date(ts).getTime() - clock) / 60000));
  const upcoming = tasks.filter((t) => !t.done_at && t.start_at && soon(t.start_at)).sort((a, b) => (a.start_at! < b.start_at! ? -1 : 1))[0];
  const dueSoon = tasks.filter((t) => !t.done_at && t.due_at && soon(t.due_at)).sort((a, b) => (a.due_at! < b.due_at! ? -1 : 1))[0];
  const bannerTask = [upcoming, dueSoon].find((t) => t && !dismissed[t.id + (t.due_at && t === dueSoon ? ':due' : '')]);

  // 通知匣內容
  const inboxItems: InboxItem[] = [];
  tasks.filter((t) => !t.done_at && t.start_at && new Date(t.start_at).getTime() > clock && taskDay(t) === today).slice(0, 3)
    .forEach((t) => inboxItems.push({ id: t.id, section: '接下來', title: `${hhmm(t.start_at)} ${t.title}`, sub: `${minsTo(t.start_at!)} 分鐘後${t.location ? '・' + t.location : ''}`, tint: '#E6EEF6' }));
  tasks.filter((t) => !t.done_at && t.due_at && taskDay(t) === today && new Date(t.due_at).getTime() > clock)
    .forEach((t) => inboxItems.push({ id: t.id + ':due', section: '接下來', title: `${hhmm(t.due_at)} 前・${t.title}`, sub: '今天截止', tint: colors.dueBg }));
  if (data?.pet && data.pet.fullness < 40) inboxItems.push({ id: 'pet-hungry', section: '秒喵', title: `${data.pet.name}肚子有點餓`, sub: '專注 20 分鐘就能換一條小魚乾', tint: '#F4EFE5', action: { label: '去看看', onPress: () => router.push('/space') } });
  else inboxItems.push({ id: 'pet-hi', section: '秒喵', title: `${data?.pet?.name ?? '秒喵'}在窗邊等你`, sub: '忙完記得回來摸摸牠', tint: '#F4EFE5', action: { label: '去看看', onPress: () => router.push('/space') } });
  const todayDone = tasks.filter((t) => taskDay(t) === today && t.kind !== 'event' && t.done_at).length;
  if (todayDone >= 3) inboxItems.push({ id: 'achv-half', section: '成就', title: '今天過半了', sub: `完成 ${todayDone} 件・解鎖新動作「伸懶腰」`, tint: colors.dueBg });
  const badge = Math.max(0, inboxItems.length - seen);

  // 成就：今天第 3 件完成時跳一次
  const prevDone = useRef<number | null>(null);
  useEffect(() => {
    if (!data) return;
    const was = prevDone.current;
    prevDone.current = todayDone;
    if (was !== null && was < 3 && todayDone >= 3) {
      AsyncStorage.getItem('achv:' + today).then((v) => { if (!v) { setAchv(true); AsyncStorage.setItem('achv:' + today, '1').catch(() => {}); } }).catch(() => setAchv(true));
    }
  }, [todayDone, data, today]);

  // 專案進度：新增／編輯／刪除截止（畫面先變，背景再存）
  function saveDeadline(d: DeadlineDraft) {
    if (!editDue) return;
    const { project, task } = editDue;
    setEditDue(null);
    const due_at = d.time ? atTime(d.date, d.time) : null;
    if (task) {
      const patch: Partial<Task> = { title: d.title, due_date: d.date, due_at, kind: d.milestone ? 'milestone' : task.kind === 'milestone' ? 'deadline' : task.kind };
      patchLocal(task.id, patch);
      save(updateTask(task.id, patch));
    } else {
      insertLocal({ id: 'tmp-' + Date.now(), project_id: project.id, kind: d.milestone ? 'milestone' : 'deadline', area: project.area, title: d.title, note: null, due_date: d.date, due_at, start_at: null, end_at: null, remind_at: null, done_at: null, location: null, postponed_count: 0 });
      save(addTask({ title: d.title, projectId: project.id, area: project.area, date: d.date, time: d.time, isDeadline: !d.milestone, milestone: d.milestone }));
      flash(`已加入「${d.title}」`);
    }
  }
  // 新增專案：先放進畫面（臨時 id），存好後重讀拿到真的 id
  function createProject(name: string, color: string) {
    setNewProject(false);
    const tmp: Project = { id: 'tmp-' + Date.now(), name, short_name: name, aliases: [], color, area: 'work', status: 'active', sort_order: 999, due_on: null } as unknown as Project;
    setData((prev) => (prev ? { ...prev, projects: [...prev.projects, tmp] } : prev));
    save(addProject(name, color));
    flash(`已新增專案「${name}」`);
  }
  function deleteDeadline() {
    const t = editDue?.task;
    setEditDue(null);
    if (!t) return;
    const before = { ...t };
    patchLocal(t.id, null);
    save(deleteTask(t));
    flash(`已刪除「${t.title}」`, () => { insertLocal(before); save(restoreTask(before)); });
  }

  function flash(msg: string, undo?: () => void) {
    clearTimeout(toastTimer.current);
    setToast({ msg, undo });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  async function commitDraft(p: Project) {
    const v = draft.trim();
    if (!v) { setAdding(null); return; }
    setDraft('');
    insertLocal({ id: 'tmp-' + Date.now(), project_id: p.id === '__none' ? null : p.id, kind: 'day_task', area: p.area, title: v, note: null, due_date: day, due_at: null, start_at: null, end_at: null, remind_at: null, done_at: null, location: null, postponed_count: 0 });
    save(addTask({ title: v, projectId: p.id === '__none' ? null : p.id, area: p.area, date: day }));
  }

  async function onAction(a: SheetAction) {
    const t = sel!;
    setSel(null);
    const before = { ...t };
    const undoFields = () => { patchLocal(t.id, pick(before)); save(updateTask(t.id, pick(before))); };
    const moveTo = (to: string, label: string) => {
      patchLocal(t.id, moveFields(t, to));
      save(moveTask(t, to));
      flash(`「${t.title}」移到${label}`, undoFields);
    };
    if (a === 'done') toggle(t);
    if (a === 'tomorrow') moveTo(addDays(taskDay(t) ?? today, 1), '明天');
    if (a === 'weekend') { const sat = weekOf(today)[6]; moveTo(sat <= today ? addDays(sat, 7) : sat, '週六'); }
    if (a === 'someday') {
      const patch: Partial<Task> = { kind: 'someday', due_date: null, due_at: null, start_at: null, end_at: null, remind_at: null };
      patchLocal(t.id, patch); save(updateTask(t.id, patch));
      flash(`「${t.title}」放到之後再說`, undoFields);
    }
    if (a === 'delete') {
      patchLocal(t.id, null); save(deleteTask(t));
      flash(`已刪除「${t.title}」`, () => { insertLocal(before); save(restoreTask(before)); });
    }
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
        <View style={s.headerActions}>
          <Pressable onPress={() => router.push('/focus')} style={s.focusPill} accessibilityLabel="開始專注">
            <Text style={s.focusText}>◷ 專注</Text>
          </Pressable>
          <Pressable onPress={() => { setInboxOpen(true); setSeen(inboxItems.length); }} style={s.inbox} accessibilityLabel={`通知匣，${badge} 則未讀`}>
            <Text style={s.bell}>♢</Text>
            {badge > 0 ? <View style={s.badge}><Text style={s.badgeText}>{badge}</Text></View> : null}
          </Pressable>
        </View>
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
            <ProjectProgress projects={projects} tasks={tasks} onPressProject={() => router.push('/projects')} onPressItem={(t, p) => setEditDue({ project: p, task: t })} onAdd={(p) => setEditDue({ project: p, task: null })} onAddProject={() => setNewProject(true)} />
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
                <TaskRow key={t.id} task={t} color={projOf(t).color} onToggle={() => toggle(t)} onOpen={() => setSel(t)} />
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

      {bannerTask && bannerTask === upcoming ? (
        <Banner
          key={bannerTask.id}
          kind="meeting" top={insets.top + 8}
          eyebrow={`下一小時・${minsTo(bannerTask.start_at!)} 分鐘後`} right="現在"
          title={`${hhmm(bannerTask.start_at)} ${bannerTask.title}`}
          body={bannerTask.location ? bannerTask.location : `${projOf(bannerTask).name}`}
          actions={[
            { label: '我知道了', primary: true, onPress: () => dismiss(bannerTask.id) },
            { label: '稍後提醒', onPress: () => dismiss(bannerTask.id) },
          ]}
          onAutoHide={() => dismiss(bannerTask.id)}
        />
      ) : bannerTask ? (
        <Banner
          key={bannerTask.id + ':due'}
          kind="due" top={insets.top + 8}
          eyebrow={`${bannerTask.kind === 'day_task' ? '日任務' : '截止'}・${minsTo(bannerTask.due_at!)} 分鐘後`} right={hhmm(bannerTask.due_at)}
          title={bannerTask.title}
          body={`${hhmm(bannerTask.due_at)} 前要完成。`}
          actions={[
            { label: '我知道了', primary: true, onPress: () => dismiss(bannerTask.id + ':due') },
            { label: '已完成', onPress: () => { dismiss(bannerTask.id + ':due'); toggle(bannerTask); } },
            { label: '移到明天', onPress: () => { dismiss(bannerTask.id + ':due'); patchLocal(bannerTask.id, moveFields(bannerTask, addDays(today, 1))); save(moveTask(bannerTask, addDays(today, 1))); } },
          ]}
          onAutoHide={() => dismiss(bannerTask.id + ':due')}
        />
      ) : null}

      <ProjectSheet open={newProject} used={projects.map((p) => p.color)} onClose={() => setNewProject(false)} onSave={createProject} />
      <DeadlineSheet open={!!editDue} project={editDue?.project ?? null} task={editDue?.task ?? null} onClose={() => setEditDue(null)} onSave={saveDeadline} onDelete={deleteDeadline} />
      <InboxSheet open={inboxOpen} items={inboxItems} onClose={() => setInboxOpen(false)} topInset={insets.top} />
      <AchievementCard
        open={achv} title="今天過半了" body={`今天完成 ${todayDone} 件事。\n${petName}學會了新動作：伸懶腰。`}
        onClose={() => setAchv(false)} onGo={() => { setAchv(false); router.push('/space'); }}
      />
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  month: { fontSize: 24, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 13, color: colors.ink2, marginTop: 2 },
  focusPill: { height: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: colors.ink, justifyContent: 'center' },
  focusText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  inbox: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  bell: { color: colors.ink, fontSize: 25, lineHeight: 27, transform: [{ rotate: '45deg' }] },
  badge: { position: 'absolute', right: -2, top: -3, minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 4, backgroundColor: '#FF7A59', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
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
